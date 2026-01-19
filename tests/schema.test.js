import { getSchema } from "../source/schema.js";
import { jest } from "@jest/globals";

describe("getSchema", () => {
  it("caches a schema", async () => {
    const processSchema = jest.fn();
    processSchema.mockResolvedValue({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
    });

    await getSchema("https://example.com/schema.json", processSchema);
    await getSchema("https://example.com/schema.json", processSchema);

    expect(processSchema).toHaveBeenCalledTimes(1);
  });
});
