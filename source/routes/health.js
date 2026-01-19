const plugin = async (fastify) => {
  fastify.get("/health", function (request, reply) {
    reply.send({ status: "ok" });
  });
};

export default plugin;
