import { jest } from "@jest/globals";

jest.unstable_mockModule("fs/promises", () => ({
  readFile: jest.fn(),
}));

const { readFile } = await import("fs/promises");
const { default: loadSchema } = await import("../source/loadSchema.js");

global.fetch = jest.fn();

describe("loadSchema", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads a schema from a local path", async () => {
    const schemaContent = { type: "object" };
    readFile.mockResolvedValue(JSON.stringify(schemaContent));

    const schema = await loadSchema("schemas/1.1.1/purchase-event.json");

    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining("schemas/1.1.1/purchase-event.json"),
      "utf-8",
    );
    expect(schema).toEqual(schemaContent);
  });

  it("throws an error for path traversal attempts", async () => {
    await expect(loadSchema("schemas/../.gitignore")).rejects.toThrow(
      "Path traversal attempt detected for local schema: schemas/../.gitignore",
    );
  });

  it("fetches a schema from a URL", async () => {
    const schemaContent = {
      type: "object",
      properties: { url: { type: "string" } },
    };
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(schemaContent),
    });

    const schema = await loadSchema("http://example.com/schema.json");
    expect(fetch).toHaveBeenCalledWith("http://example.com/schema.json");
    expect(schema).toEqual(schemaContent);
  });

  it("loads a schema from a local path when a valid URL is provided", async () => {
    const schemaContent = { type: "object" };
    readFile.mockResolvedValue(JSON.stringify(schemaContent));

    const schema = await loadSchema(
      "http://example.com/schemas/1.1.1/purchase-event.json",
    );

    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining("schemas/1.1.1/purchase-event.json"),
      "utf-8",
    );
    expect(schema).toEqual(schemaContent);
  });

  it("falls back to fetching when a url with path traversal is provided", async () => {
    const schemaContent = {
      type: "object",
      properties: { url: { type: "string" } },
    };
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(schemaContent),
    });

    await loadSchema("http://example.com/schemas/../../.gitignore");

    expect(readFile).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://example.com/schemas/../../.gitignore",
    );
  });

  it("throws an error for a non-existent local schema", async () => {
    readFile.mockRejectedValue(new Error("File not found"));
    await expect(loadSchema("schemas/1.1.1/non-existent.json")).rejects.toThrow(
      "Schema not found at local path: schemas/1.1.1/non-existent.json",
    );
  });

  it("throws an error for an invalid URI", async () => {
    await expect(loadSchema("invalid-uri")).rejects.toThrow(
      "Cannot resolve schema URI: invalid-uri",
    );
  });

  it("throws an error when fetch returns a non-ok response", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(
      loadSchema("http://example.com/not-found.json"),
    ).rejects.toThrow(
      "Failed to fetch schema from http://example.com/not-found.json, status: 404",
    );
  });

  it("throws an error when fetch fails", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    await expect(
      loadSchema("http://example.com/network-error.json"),
    ).rejects.toThrow(
      "Failed to fetch schema from http://example.com/network-error.json. Error: Network error",
    );
  });

  it("throws an error when local file is not valid JSON", async () => {
    readFile.mockResolvedValue("not a json");
    await expect(loadSchema("schemas/1.1.1/invalid.json")).rejects.toThrow();
  });
});
