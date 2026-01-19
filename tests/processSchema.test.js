import { jest } from "@jest/globals";

const mockBundle = jest.fn();

jest.unstable_mockModule("@apidevtools/json-schema-ref-parser", () => ({
  __esModule: true,
  default: {
    bundle: mockBundle,
  },
}));

const { processSchema } = await import("../source/processSchema.js");

describe("processSchema", () => {
  it("throws a custom error for HTTPError", async () => {
    const httpError = new Error("Not Found");
    httpError.name = "HTTPError";
    httpError.status = 404;
    mockBundle.mockRejectedValue(httpError);

    await expect(
      processSchema("https://example.com/non-existent-schema.json"),
    ).rejects.toThrow(
      "Failed to fetch schema from https://example.com/non-existent-schema.json. Status: 404",
    );
  });
});
