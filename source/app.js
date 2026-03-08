import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";

const DEFAULT_CORS_ORIGIN_REGEX = "^https?://localhost(:\\d+)?$";

function getCorsOriginRegex() {
  const pattern = process.env.CORS_ORIGIN_REGEX || DEFAULT_CORS_ORIGIN_REGEX;
  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(DEFAULT_CORS_ORIGIN_REGEX);
  }
}

export default async function serviceApp(fastify, opts) {
  const routeOptions = { ...(opts || {}) };
  delete routeOptions.skipOverride;
  const corsOriginRegex = getCorsOriginRegex();

  // Register CORS plugin
  fastify.register(fastifyCors, {
    origin: corsOriginRegex,
  });

  fastify.register(fastifyRateLimit, {
    max: Number.parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: routeOptions,
  });

  fastify.register(fastifyStatic, {
    root: path.join(import.meta.dirname, "static"),
    prefix: "/static",
  });

  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      "Unhandled error occurred",
    );

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
    }

    return { message };
  });
}
