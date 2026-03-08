import { build_server } from "../server.js";
import { jest } from "@jest/globals";

describe("POST /v1/validate/remote", () => {
  let server;
  const loadSchema = jest.fn();
  const originalSchemaPattern = process.env.SCHEMA_URL_PATTERN;

  beforeEach(async () => {
    process.env.SCHEMA_URL_PATTERN = "^https://example\\.com/.*\\.json$";
    server = build_server({ loadSchema });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
    jest.clearAllMocks();
    process.env.SCHEMA_URL_PATTERN = originalSchemaPattern;
  });

  describe("with schema_url in query", () => {
    it("returns a validation success", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://example.com/schema.json",
        payload: { name: "test" },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ valid: true, errors: [] });
    });

    it("returns a validation failure", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://example.com/schema.json",
        payload: { name: 123 },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).valid).toBe(false);
      expect(JSON.parse(response.payload).errors).not.toEqual([]);
    });

    it("handles schema processing errors", async () => {
      loadSchema.mockRejectedValue(new Error("Failed to fetch"));

      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://example.com/schema.json",
        payload: { name: "test" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Invalid schema or validation request",
      });
    });

    it("rejects schema urls that do not match the allowlist pattern", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://attacker.example/schema.json",
        payload: { name: "test" },
      });

      expect(response.statusCode).toBe(400);
      expect(loadSchema).not.toHaveBeenCalled();
    });

    it("reuses compiled validators for repeated schema urls", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      const request = {
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://example.com/schema.json",
        payload: { name: "test" },
      };

      const first = await server.inject(request);
      const second = await server.inject(request);

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(loadSchema).toHaveBeenCalledTimes(1);
    });
  });

  describe("with $schema in body", () => {
    it("returns a validation success", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote",
        payload: {
          $schema: "https://example.com/schema.json",
          name: "test",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ valid: true, errors: [] });
    });

    it("returns a validation failure", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/validate/remote",
        payload: {
          $schema: "https://example.com/schema.json",
          name: 123,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).valid).toBe(false);
      expect(JSON.parse(response.payload).errors).not.toEqual([]);
    });

    it("prefers body schema over query schema", async () => {
      loadSchema.mockResolvedValue({
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      });

      await server.inject({
        method: "POST",
        url: "/v1/validate/remote?schema_url=https://example.com/query.schema.json",
        payload: {
          $schema: "https://example.com/body.schema.json",
          name: "test",
        },
      });

      expect(loadSchema).toHaveBeenCalledWith(
        "https://example.com/body.schema.json",
      );
    });
  });
});
