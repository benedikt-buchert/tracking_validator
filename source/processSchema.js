import $RefParser from "@apidevtools/json-schema-ref-parser";

export async function processSchema(schemaUrl) {
  return await $RefParser.bundle(schemaUrl);
}
