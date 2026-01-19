const plugin = async (fastify) => {
  fastify.get("/", function (request, reply) {
    reply.send({ hello: "world" });
  });
};

export default plugin;
