import * as fs from "fs/promises";
import path from "path";
import net from "node:net";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_FETCH_TIMEOUT_MS = 5000;
const DEFAULT_SCHEMA_MAX_BYTES = 256 * 1024;

function getPositiveIntegerEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isLocalOrPrivateIp(hostname) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return true;
  }

  const ipType = net.isIP(hostname);
  if (ipType === 0) {
    return false;
  }

  if (ipType === 4) {
    const [a, b] = hostname.split(".").map((part) => Number.parseInt(part, 10));
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

function assertRemoteSchemaHostAllowed(url) {
  if (isLocalOrPrivateIp(url.hostname)) {
    throw new Error(`Disallowed schema host: ${url.hostname}`);
  }
}

async function readJsonWithSizeLimit(rawContent, maxBytes) {
  if (Buffer.byteLength(rawContent, "utf8") > maxBytes) {
    throw new Error(`Schema exceeds maximum allowed size of ${maxBytes} bytes`);
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    throw new Error("Schema content is not valid JSON");
  }
}

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
  if (typeof uri !== "string" || uri.length === 0) {
    throw new Error("Schema URI must be a non-empty string");
  }

  let localPath;
  const projectRoot = path.resolve(__dirname, "..");
  const schemasRoot = path.resolve(projectRoot, "schemas");
  const schemaMaxBytes = getPositiveIntegerEnv(
    "SCHEMA_MAX_BYTES",
    DEFAULT_SCHEMA_MAX_BYTES,
  );
  const fetchTimeoutMs = getPositiveIntegerEnv(
    "SCHEMA_FETCH_TIMEOUT_MS",
    DEFAULT_FETCH_TIMEOUT_MS,
  );

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
    let schemaContent;
    try {
      schemaContent = await fs.readFile(localPath, "utf-8");
    } catch {
      if (!uri.startsWith("http")) {
        throw new Error(`Schema not found at local path: ${uri}`);
      }
      // If it's a URL and local file not found, we'll fall back to fetching.
    }

    if (schemaContent !== undefined) {
      return await readJsonWithSizeLimit(schemaContent, schemaMaxBytes);
    }
  }

  if (uri.startsWith("http")) {
    const remoteUrl = new URL(uri);
    assertRemoteSchemaHostAllowed(remoteUrl);

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(
      () => abortController.abort(),
      fetchTimeoutMs,
    );

    try {
      const res = await fetch(uri, { signal: abortController.signal });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch schema from ${uri}, status: ${res.status}`,
        );
      }

      if (typeof res.text === "function") {
        const raw = await res.text();
        return await readJsonWithSizeLimit(raw, schemaMaxBytes);
      }

      const data = await res.json();
      const raw = JSON.stringify(data);
      return await readJsonWithSizeLimit(raw, schemaMaxBytes);
    } catch (e) {
      if (abortController.signal.aborted) {
        throw new Error(
          `Failed to fetch schema from ${uri}. Error: Request timed out after ${fetchTimeoutMs}ms`,
        );
      }

      throw new Error(
        `Failed to fetch schema from ${uri}. Error: ${e.message}`,
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  throw new Error(`Cannot resolve schema URI: ${uri}`);
}
