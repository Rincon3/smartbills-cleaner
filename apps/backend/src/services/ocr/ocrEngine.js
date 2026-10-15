import fs from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { tryCloudOcr } from "./cloudOcr.js";

const execFileAsync = promisify(execFile);

async function hasBinary(name) {
  try {
    await execFileAsync("which", [name]);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args, options = {}) {
  const { stdout } = await execFileAsync(command, args, {
    maxBuffer: 20 * 1024 * 1024,
    timeout: 120000,
    ...options
  });
  return String(stdout || "");
}

export async function getPdfPageCount(filePath) {
  if (await hasBinary("pdfinfo")) {
    try {
      const output = await run("pdfinfo", [filePath]);
      const match = output.match(/Pages:\s+(\d+)/i);
      if (match) {
        return Number(match[1]);
      }
    } catch {
      // fallback below
    }
  }

  const pages = await extractPdfTextWithPdfjs(filePath).catch(() => []);
  return pages.length || 1;
}

async function extractPdfTextWithPdfjs(filePath) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createRequire } = await import("module");
  const { pathToFileURL } = await import("url");
  const require = createRequire(import.meta.url);
  const pdfjsRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
  const data = new Uint8Array(await fs.readFile(filePath));
  const pdf = await getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    standardFontDataUrl: `${pathToFileURL(path.join(pdfjsRoot, "standard_fonts"))}/`
  }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ").replace(/[ ]{2,}/g, " ").trim();
    pages.push({ page: pageNumber, text: cleanOcrText(text), engine: "pdfjs" });
  }

  return pages;
}

async function extractPdfTextNative(filePath) {
  const pageCount = await getPdfPageCount(filePath);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const text = await run("pdftotext", ["-f", String(pageNumber), "-l", String(pageNumber), "-layout", "-enc", "UTF-8", filePath, "-"]);
    pages.push({ page: pageNumber, text: cleanOcrText(text), engine: "pdftotext" });
  }

  return pages;
}

async function ocrImageNative(imagePath) {
  try {
    return (await run("tesseract", [imagePath, "stdout", "-l", "spa+eng", "--psm", "6"])).trim();
  } catch {
    return (await run("tesseract", [imagePath, "stdout", "-l", "eng", "--psm", "6"])).trim();
  }
}

async function ocrImageJs(imagePath) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa+eng");
  try {
    const result = await worker.recognize(imagePath);
    return String(result.data?.text || "").trim();
  } finally {
    await worker.terminate();
  }
}

export async function ocrImage(imagePath) {
  if (await hasBinary("tesseract")) {
    return { text: await ocrImageNative(imagePath), engine: "tesseract" };
  }

  return { text: await ocrImageJs(imagePath), engine: "tesseract.js" };
}

async function rasterizePdfPages(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "smartbills-ocr-"));
  const prefix = path.join(tempDir, "page");
  await run("pdftoppm", ["-png", "-r", "220", filePath, prefix]);
  const files = (await fs.readdir(tempDir))
    .filter((name) => name.endsWith(".png"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  return {
    tempDir,
    images: files.map((name, index) => ({ page: index + 1, path: path.join(tempDir, name) }))
  };
}

function cleanOcrText(text) {
  return String(text || "")
    .replace(/\f/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

export function isSparse(pages) {
  const text = (pages || []).map((page) => page.text).join(" ").replace(/\s+/g, " ").trim();
  return text.length < 40;
}

function toResult(engine, pages) {
  const normalized = (pages || []).map((page, index) => ({
    page: page.page || index + 1,
    section: page.section || `Página ${page.page || index + 1}`,
    text: page.text || "",
    engine: page.engine || engine
  }));

  return {
    engine,
    pageCount: normalized.length,
    pages: normalized
  };
}

async function extractWithTesseractPdf(filePath) {
  if (!(await hasBinary("pdftoppm")) || !(await hasBinary("tesseract"))) {
    return null;
  }

  const raster = await rasterizePdfPages(filePath);
  try {
    const pages = [];
    for (const image of raster.images) {
      const ocr = await ocrImage(image.path);
      pages.push({ page: image.page, text: cleanOcrText(ocr.text), engine: ocr.engine });
    }
    return toResult("tesseract", pages);
  } finally {
    await fs.rm(raster.tempDir, { recursive: true, force: true });
  }
}

export async function extractDocumentPages({ filePath, mimeType }) {
  const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    let local = toResult("pdfjs", []);

    try {
      if (await hasBinary("pdftotext")) {
        local = toResult("pdftotext", await extractPdfTextNative(filePath));
      } else {
        local = toResult("pdfjs", await extractPdfTextWithPdfjs(filePath));
      }
    } catch (error) {
      console.warn("OCR local de PDF omitido:", error.message || error);
    }

    if (!isSparse(local.pages)) {
      return local;
    }

    const cloud = await tryCloudOcr({ filePath, mimeType: mimeType || "application/pdf" });
    if (cloud && !isSparse(cloud.pages)) {
      return toResult(cloud.engine, cloud.pages);
    }

    try {
      const tess = await extractWithTesseractPdf(filePath);
      if (tess && !isSparse(tess.pages)) {
        return tess;
      }
    } catch (error) {
      console.warn("OCR Tesseract omitido:", error.message || error);
    }

    return local;
  }

  const cloud = await tryCloudOcr({ filePath, mimeType: mimeType || "image/png" });
  if (cloud && !isSparse(cloud.pages)) {
    return toResult(cloud.engine, cloud.pages);
  }

  try {
    const ocr = await ocrImage(filePath);
    return toResult(ocr.engine, [
      {
        page: 1,
        section: "Documento escaneado",
        text: cleanOcrText(ocr.text),
        engine: ocr.engine
      }
    ]);
  } catch (error) {
    console.warn("OCR de imagen omitido:", error.message || error);
    return toResult("none", []);
  }
}

export function serializeOcrText(pages) {
  return pages
    .map((page) => `----- page ${page.page} -----\n${page.text || ""}`)
    .join("\n\n")
    .trim();
}

export function parseOcrPages(ocrRawText) {
  if (!ocrRawText) {
    return [];
  }

  const chunks = String(ocrRawText).split(/----- page (\d+) -----\n/);
  const pages = [];

  for (let index = 1; index < chunks.length; index += 2) {
    pages.push({
      page: Number(chunks[index]),
      section: `Página ${chunks[index]}`,
      text: (chunks[index + 1] || "").trim()
    });
  }

  return pages;
}
