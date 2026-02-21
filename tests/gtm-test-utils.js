import { jest, describe, test, expect } from "@jest/globals";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { VM } from "vm2";

// Parses a GTM template file (.tpl)
function parseTemplate(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const sections = fileContent.split(/___\w+___/);
  const sectionNames = fileContent.match(/___\w+___/g);

  if (!sectionNames) {
    throw new Error(`Could not find GTM sections in ${filePath}`);
  }

  const gtmTemplate = {};
  sectionNames.forEach((name, index) => {
    const sectionContent = sections[index + 1].trim();
    switch (name) {
      case "___INFO___":
        gtmTemplate.info = JSON.parse(sectionContent);
        break;
      case "___SANDBOXED_JS_FOR_WEB_TEMPLATE___":
        gtmTemplate.sandbox = sectionContent;
        break;
      case "___SANDBOXED_JS_FOR_SERVER___":
        gtmTemplate.sandbox = sectionContent;
        break;
      case "___TESTS___":
        gtmTemplate.tests = yaml.load(sectionContent);
        break;
    }
  });

  return gtmTemplate;
}

// Runs the tests for a given template file
function runGtmTests(templatePath) {
  const template = parseTemplate(templatePath);
  const templateName = path.basename(templatePath);

  describe(templateName, () => {
    if (!template.tests || !template.tests.scenarios) {
      test("contains no tests", () => {
        expect(true).toBe(true);
      });
      return;
    }

    // Common setup for all tests in the template
    const commonSetup = template.tests.setup || "";

    template.tests.scenarios.forEach((scenario) => {
      test(scenario.name, async () => {
        const mocks = {};
        const apiAsserts = {
          gtmOnSuccess: jest.fn(),
          gtmOnFailure: jest.fn(),
        };

        const sandbox = {
          mock: (name, impl) => {
            const mockFn = jest.fn(impl);
            mocks[name] = mockFn;
            apiAsserts[name] = mockFn;
          },
          mockObject: (name, obj) => {
            const mockedObject = {};
            for (const key in obj) {
              const mockFn = jest.fn(obj[key]);
              mockedObject[key] = mockFn;
              // Store assertion targets for each method
              apiAsserts[`${name}.${key}`] = mockFn;
            }
            mocks[name] = mockedObject;
          },
          require: (name) => {
            if (mocks[name]) {
              return mocks[name];
            }
            // Add default mocks for common GTM APIs if not provided
            switch (name) {
              case "Promise":
                return Promise;
              case "JSON":
                return JSON;
              case "logToConsole":
                return () => {}; // Suppress logs in tests
              case "templateDataStorage": {
                const storageMock = {
                  getItemCopy: jest.fn(),
                  setItemCopy: jest.fn(),
                };
                mocks[name] = storageMock;
                apiAsserts[`${name}.getItemCopy`] = storageMock.getItemCopy;
                apiAsserts[`${name}.setItemCopy`] = storageMock.setItemCopy;
                return storageMock;
              }
              default:
                // Create a default mock if an API is required but not mocked
                if (!apiAsserts[name]) {
                  const mockFn = jest.fn();
                  mocks[name] = mockFn;
                  apiAsserts[name] = mockFn;
                }
                return mocks[name];
            }
          },
          assertThat: (value) => ({
            isEqualTo: (expected) => expect(value).toEqual(expected),
          }),
          assertApi: (name) => {
            const mockFn = apiAsserts[name];
            if (!mockFn) {
              throw new Error(`assertApi: No mock found for '${name}'`);
            }
            return {
              wasCalled: () => expect(mockFn).toHaveBeenCalled(),
              wasNotCalled: () => expect(mockFn).not.toHaveBeenCalled(),
            };
          },
          runCode: (data) => {
            const vm = new VM({
              timeout: 1000,
              sandbox: {
                data: {
                  ...data,
                  gtmOnSuccess: apiAsserts.gtmOnSuccess,
                  gtmOnFailure: apiAsserts.gtmOnFailure,
                },
                ...sandbox, // Expose the mock APIs to the script
              },
            });
            // The code to run is a combination of common setup and scenario code
            const codeToRun = commonSetup + "\n" + template.sandbox;
            const wrappedCode = `(function() { ${codeToRun} })();`;
            return vm.run(wrappedCode);
          },
        };

        // Run the test code from the template in a new VM
        const testVm = new VM({
          timeout: 1000,
          sandbox,
        });

        // Replace non-standard GTM Promise.create with the standard constructor
        const patchedScenarioCode = scenario.code.replace(
          /Promise\.create/g,
          "new Promise",
        );

        await testVm.run(patchedScenarioCode);
      });
    });
  });
}

export { runGtmTests };
