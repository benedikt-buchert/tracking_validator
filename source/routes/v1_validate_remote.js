import { createValidator } from "../validator.js";
import defaultLoadSchema from "../loadSchema.js";

const plugin = async (fastify, opts) => {
  const { loadSchema = defaultLoadSchema } = opts;
  const schema = {
    oneOf: [
      {
        querystring: {
          type: "object",

          properties: {
            schema_url: {
              type: "string",

              pattern: process.env.SCHEMA_URL_PATTERN || ".*",
            },
          },

          required: ["schema_url"],
        },
      },

      {
        body: {
          type: "object",

          properties: {
            $schema: {
              type: "string",

              pattern: process.env.SCHEMA_URL_PATTERN || ".*",
            },
          },

          required: ["$schema"],
        },
      },
    ],
  };

  fastify.post(
    "/v1/validate/remote",
    { schema },
    async function (request, reply) {
      const { schema_url: query_schema_url } = request.query || {};

      const { $schema: body_schema_url, ...dataToValidate } =
        request.body || {};

      const schema_url = body_schema_url || query_schema_url;

      const validationData = body_schema_url ? dataToValidate : request.body;

      try {
        const mainSchema = await loadSchema(schema_url);
        const validator = await createValidator(mainSchema);
        const result = validator(validationData);
        reply.send(result);
      } catch (error) {
        request.log.error(error);
        reply
          .status(400)
          .send({ error: error.message || "Failed to process schema" });
      }
    },
  );
};

export default plugin;
