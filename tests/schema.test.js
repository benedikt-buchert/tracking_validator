import { processSchema } from "../source/processSchema.js";
import { jest } from "@jest/globals";
import $RefParser from "@apidevtools/json-schema-ref-parser";

jest.mock("@apidevtools/json-schema-ref-parser");

describe("processSchema", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and processes a schema without references", async () => {
    const schemaUrl = "http://example.com/schema.json";
    const schema = {
      $id: schemaUrl,
      type: "object",
      properties: { name: { type: "string" } },
    };

    $RefParser.bundle = jest.fn().mockResolvedValue(schema);

    const schemas = await processSchema(schemaUrl);

    expect(schemas).toEqual(schema);
  });

  it("fetches a schema and its references", async () => {
    const mainSchemaUrl = "http://example.com/main.schema.json";
    const refSchemaUrl = "http://example.com/ref.schema.json";

    const mainSchema = {
      $id: mainSchemaUrl,
      type: "object",
      properties: {
        ref: { $ref: "ref.schema.json" },
      },
    };
    const refSchema = {
      $id: refSchemaUrl,
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const bundledSchema = {
      ...mainSchema,
      definitions: {
        "ref.schema.json": refSchema,
      },
    };
    $RefParser.bundle = jest.fn().mockResolvedValue(bundledSchema);

    const schemas = await processSchema(mainSchemaUrl);

    expect(schemas).toEqual(bundledSchema);
  });

  it("throws an error for a non-existent schema", async () => {
    const schemaUrl = "http://example.com/non-existent.schema.json";

    const error = new Error("File not found");
    $RefParser.bundle = jest.fn().mockRejectedValue(error);

    await expect(processSchema(schemaUrl)).rejects.toThrow(error);
  });
});
