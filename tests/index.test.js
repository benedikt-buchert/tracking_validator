import { build_server } from "../server.js";

describe("GET /health", () => {
  let server;
  beforeAll(async () => {
    server = build_server();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it("responds with json", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(JSON.parse(response.payload)).toEqual({ status: "ok" });
  });
});
