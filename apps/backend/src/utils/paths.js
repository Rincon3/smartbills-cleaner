import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const uploadsDir = path.resolve(backendRoot, "uploads");

export function resolveStoredFile(filePath) {
  const relative = String(filePath || "").replace(/^\/+/, "").replace(/^uploads\//, "");
  return path.resolve(uploadsDir, relative);
}
