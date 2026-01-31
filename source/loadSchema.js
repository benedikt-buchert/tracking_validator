import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asynchronously loads a schema from a given URI.
 * It first attempts to resolve the URI to a local file path within the 'schemas' directory.
 * If the local file is not found, it attempts to fetch the schema from the URI as a URL.
 *
 * @param {string} uri - The URI of the schema to load. Can be a URL or a path.
 * @returns {Promise<object>} A promise that resolves to the loaded schema object.
 * @throws {Error} If the schema cannot be found locally for a non-HTTP URI, or if fetching fails.
 */
export default async function loadSchema(uri) {
  let localPath;
  const projectRoot = path.resolve(__dirname, "..");
  const schemasRoot = path.resolve(projectRoot, "schemas");

  let potentialPath;
  if (uri.startsWith("http")) {
    try {
      const url = new URL(uri);
      const schemaPath = url.pathname.includes("schemas")
        ? url.pathname.substring(url.pathname.indexOf("schemas"))
        : undefined;
      if (schemaPath) {
        potentialPath = path.join(projectRoot, schemaPath);
      }
    } catch {
      // Not a valid URL
    }
  } else if (uri.startsWith("schemas")) {
    potentialPath = path.join(projectRoot, uri);
  }

  if (potentialPath) {
    const resolvedPath = path.resolve(potentialPath);
    if (resolvedPath.startsWith(schemasRoot)) {
      localPath = resolvedPath;
    } else {
      if (!uri.startsWith("http")) {
        throw new Error(
          `Path traversal attempt detected for local schema: ${uri}`,
        );
      }
    }
  }

  if (localPath) {
    try {
      const schemaContent = await fs.readFile(localPath, "utf-8");
      return JSON.parse(schemaContent);
    } catch {
      if (!uri.startsWith("http")) {
        throw new Error(`Schema not found at local path: ${uri}`);
      }
      // If it's a URL and local file not found, we'll fall back to fetching.
    }
  }

  if (uri.startsWith("http")) {
    try {
      const res = await fetch(uri);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch schema from ${uri}, status: ${res.status}`,
        );
      }
      return await res.json();
    } catch (e) {
      throw new Error(
        `Failed to fetch schema from ${uri}. Error: ${e.message}`,
      );
    }
  }

  throw new Error(`Cannot resolve schema URI: ${uri}`);
}
