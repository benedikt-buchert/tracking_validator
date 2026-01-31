import { build_server } from "../server.js";
import { jest } from "@jest/globals";

describe("POST /v1/validate/remote", () => {
  let server;
  const loadSchema = jest.fn();

  beforeEach(async () => {
    server = build_server({ loadSchema });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
    jest.clearAllMocks();
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
        error: "Failed to fetch",
      });
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
