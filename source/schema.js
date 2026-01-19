import { processSchema as defaultProcessSchema } from "./processSchema.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

export async function getSchema(
  schemaUrl,
  processSchema = defaultProcessSchema,
) {
  const cachedSchema = cache.get(schemaUrl);
  if (cachedSchema) {
    return cachedSchema;
  }

  const schema = await processSchema(schemaUrl);
  cache.set(schemaUrl, schema);
  return schema;
}
