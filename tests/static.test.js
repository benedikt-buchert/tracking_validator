import { access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Static files", () => {
  it("dataLayer.js should exist", async () => {
    const filePath = join(__dirname, "../source/static/dataLayer.js");
    await expect(access(filePath)).resolves.not.toThrow();
  });
});
