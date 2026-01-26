import $RefParser from "@apidevtools/json-schema-ref-parser";

export async function processSchema(schemaUrl) {
  try {
    const bundledSchema = await $RefParser.bundle(schemaUrl);
    return bundledSchema;
  } catch (error) {
    // Re-throw the error to be caught by the caller
    throw error;
  }
}
