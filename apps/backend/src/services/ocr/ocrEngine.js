import fs from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

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

function isSparse(pages) {
  const text = pages.map((page) => page.text).join(" ").replace(/\s+/g, " ").trim();
  return text.length < 40;
}

export async function extractDocumentPages({ filePath, mimeType }) {
  const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    let pages = [];
    let engine = "pdfjs";

    if (await hasBinary("pdftotext")) {
      pages = await extractPdfTextNative(filePath);
      engine = "pdftotext";
    } else {
      pages = await extractPdfTextWithPdfjs(filePath);
    }

    if (isSparse(pages) && (await hasBinary("pdftoppm")) && (await hasBinary("tesseract"))) {
      const raster = await rasterizePdfPages(filePath);
      try {
        pages = [];
        for (const image of raster.images) {
          const ocr = await ocrImage(image.path);
          pages.push({ page: image.page, text: cleanOcrText(ocr.text), engine: ocr.engine });
        }
        engine = "tesseract";
      } finally {
        await fs.rm(raster.tempDir, { recursive: true, force: true });
      }
    }

    return {
      engine,
      pageCount: pages.length,
      pages: pages.map((page) => ({
        page: page.page,
        section: `Página ${page.page}`,
        text: page.text || "",
        engine: page.engine || engine
      }))
    };
  }

  const ocr = await ocrImage(filePath);
  return {
    engine: ocr.engine,
    pageCount: 1,
    pages: [
      {
        page: 1,
        section: "Documento escaneado",
        text: cleanOcrText(ocr.text),
        engine: ocr.engine
      }
    ]
  };
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
