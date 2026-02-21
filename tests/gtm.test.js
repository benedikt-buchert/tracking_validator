import { describe, test, expect } from "@jest/globals";
import { globSync } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import { runGtmTests } from "./gtm-test-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("GTM Templates", () => {
  const templateDir = path.join(__dirname, "../gtm_tempaltes");
  const templateFiles = globSync(`${templateDir}/**/*.tpl`);

  if (templateFiles.length === 0) {
    test("found no .tpl files in gtm_tempaltes directory", () => {
      // This test will fail if no templates are found, alerting the user.
      expect(templateFiles.length).toBeGreaterThan(
        0,
        `No .tpl files found in ${templateDir}`,
      );
    });
  }

  templateFiles.forEach((templatePath) => {
    runGtmTests(templatePath);
  });
});
