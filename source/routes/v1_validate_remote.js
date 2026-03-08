import { createValidator } from "../validator.js";
import defaultLoadSchema from "../loadSchema.js";

const DEFAULT_SCHEMA_URL_PATTERN =
  "^https?:\\/\\/tracking-docs-demo\\.buchert\\.digital.*\\.json$";

function getSchemaUrlPattern() {
  const pattern = process.env.SCHEMA_URL_PATTERN || DEFAULT_SCHEMA_URL_PATTERN;
  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(DEFAULT_SCHEMA_URL_PATTERN);
  }
}

const plugin = async (fastify, opts) => {
  const { loadSchema = defaultLoadSchema } = opts;
  const schemaUrlPattern = getSchemaUrlPattern();
  const validatorCache = new Map();

  const schema = {
    oneOf: [
      {
        querystring: {
          type: "object",

          properties: {
            schema_url: {
              type: "string",

              pattern: schemaUrlPattern.source,
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

              pattern: schemaUrlPattern.source,
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

      if (!schema_url || !schemaUrlPattern.test(schema_url)) {
        return reply
          .status(400)
          .send({ error: "Invalid schema or validation request" });
      }

      try {
        let validator = validatorCache.get(schema_url);
        if (!validator) {
          const mainSchema = await loadSchema(schema_url);
          validator = await createValidator(mainSchema);
          validatorCache.set(schema_url, validator);
        }

        const result = validator(validationData);
        return reply.send(result);
      } catch (error) {
        request.log.error(
          { err: error, schema_url },
          "Failed to process schema",
        );
        return reply
          .status(400)
          .send({ error: "Invalid schema or validation request" });
      }
    },
  );
};

export default plugin;
