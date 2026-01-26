import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import Ajv2019 from "ajv/dist/2019.js";
import AjvDraft4 from "ajv-draft-04";
import addFormats from "ajv-formats";
import ajvKeywords from "ajv-keywords";

function createAjvInstance(schemas, mainSchema) {
  const schemaVersion = mainSchema?.$schema;

  const options = { allErrors: true, schemas: schemas };

  let ajv;
  if (schemaVersion?.includes("2020-12")) {
    options.strict = false;
    ajv = new Ajv2020(options);
  } else if (schemaVersion?.includes("2019-09")) {
    options.strict = false;
    ajv = new Ajv2019(options);
  } else if (schemaVersion?.includes("draft-04")) {
    ajv = new AjvDraft4();
    schemas.forEach((s) => ajv.addSchema(s));
  } else {
    options.strict = false;
    ajv = new Ajv(options);
  }

  addFormats(ajv);
  if (ajv.addKeyword) {
    ajv.addKeyword("x-gtm-clear");
  }
  ajvKeywords(ajv);

  return ajv;
}

/**
 * Creates a validation function for a given set of JSON schemas.
 *
 * @param {object[]} schemas An array of all JSON schemas.
 * @param {object} mainSchema The main JSON schema to validate against.
 * @returns {function(object): {valid: boolean, errors: object[]}} A function that takes data and returns a validation result.
 */
export function createValidator(schemas, mainSchema) {
  if (!mainSchema) {
    mainSchema = schemas;
    schemas = [mainSchema];
  }
  const ajv = createAjvInstance(schemas, mainSchema);
  const validate = mainSchema["$id"]
    ? ajv.getSchema(mainSchema["$id"])
    : ajv.compile(mainSchema);

  if (!validate) {
    throw new Error(
      `Could not compile schema or find compiled schema for ${mainSchema["$id"] || "main schema"}`,
    );
  }

  return (data) => {
    const valid = validate(data);
    if (!valid) {
      return { valid: false, errors: validate.errors };
    }
    return { valid: true, errors: [] };
  };
}
