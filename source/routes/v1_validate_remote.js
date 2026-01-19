import { createValidator } from "../validator.js";

const plugin = async (fastify, { getSchema }) => {
  const schema = {
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
  };

  fastify.post(
    "/v1/validate/remote",
    { schema },
    async function (request, reply) {
      const { schema_url } = request.query;

      try {
        const remoteSchema = await getSchema(schema_url);
        const validator = createValidator(remoteSchema);
        const result = validator(request.body);
        reply.send(result);
      } catch (error) {
        reply
          .status(400)
          .send({ error: error.message || "Failed to process schema" });
      }
    },
  );
};

export default plugin;
