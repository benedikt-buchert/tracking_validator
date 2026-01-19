import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import Ajv2019 from "ajv/dist/2019.js";
import AjvDraft4 from "ajv-draft-04";
import addFormats from "ajv-formats";
import ajvKeywords from "ajv-keywords";

function createAjvInstance(schema) {
  const schemaVersion = schema.$schema;

  if (schemaVersion?.includes("2020-12")) {
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    return ajv;
  }

  if (schemaVersion?.includes("2019-09")) {
    const ajv = new Ajv2019({ allErrors: true, strict: false });
    addFormats(ajv);
    ajvKeywords(ajv);
    return ajv;
  }

  if (schemaVersion?.includes("draft-04")) {
    return new AjvDraft4();
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajvKeywords(ajv);
  return ajv;
}

/**
 * Creates a validation function for a given JSON schema.
 *
 * @param {object} schema The JSON schema to validate against.
 * @returns {function(object): {valid: boolean, errors: object[]}} A function that takes data and returns a validation result.
 */
export function createValidator(schema) {
  const ajv = createAjvInstance(schema);
  const validate = ajv.compile(schema);
  return (data) => {
    const valid = validate(data);
    if (!valid) {
      return { valid: false, errors: validate.errors };
    }
    return { valid: true, errors: [] };
  };
}
