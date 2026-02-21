/* eslint-disable jest/valid-title */
/* eslint-disable jest/no-export */
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
        const apiAsserts = {};

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
              apiAsserts[name + "." + key] = mockFn;
            }
            mocks[name] = mockedObject;
          },
          require: (name) => {
            if (mocks[name]) {
              return mocks[name];
            }
            switch (name) {
              case "Promise":
                return Promise;
              case "JSON":
                return JSON;
              case "logToConsole":
                return () => {};
              case "encodeUriComponent":
                return (str) => encodeURIComponent(str);
              case "templateDataStorage": {
                const storageMock = {
                  getItemCopy: jest.fn(),
                  setItemCopy: jest.fn(),
                };
                mocks[name] = storageMock;
                apiAsserts[name + ".getItemCopy"] = storageMock.getItemCopy;
                apiAsserts[name + ".setItemCopy"] = storageMock.setItemCopy;
                return storageMock;
              }
              default: {
                const mockFn = jest.fn();
                mocks[name] = mockFn;
                apiAsserts[name] = mockFn;
                return mockFn;
              }
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
              wasCalledWith: (...args) =>
                expect(mockFn).toHaveBeenCalledWith(...args),
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
                ...sandbox,
              },
            });
            const codeToRun = template.sandbox;
            const wrappedCode = `(function() { ${codeToRun} })();`;
            return vm.run(wrappedCode);
          },
        };

        apiAsserts.gtmOnSuccess = jest.fn();
        apiAsserts.gtmOnFailure = jest.fn();
        sandbox.gtmOnSuccess = apiAsserts.gtmOnSuccess;
        sandbox.gtmOnFailure = apiAsserts.gtmOnFailure;

        const testVm = new VM({
          timeout: 1000,
          sandbox: sandbox,
        });

        const testCode = commonSetup + "\n" + scenario.code;
        const patchedTestCode = testCode.replace(
          /Promise\.create/g,
          "new Promise",
        );

        await testVm.run(patchedTestCode);
      });
    });
  });
}

export { runGtmTests };
