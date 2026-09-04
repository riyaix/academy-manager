import Papa from "papaparse";
import * as XLSX from "xlsx";

export type SpreadsheetTable = {
  headers: string[];
  rows: Record<string, string>[];
};

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return String(value).trim();
}

function tableFromMatrix(matrix: unknown[][]): SpreadsheetTable {
  if (matrix.length === 0) return { headers: [], rows: [] };

  const rawHeaders = (matrix[0] ?? []).map((cell, index) => {
    const label = normalizeCell(cell);
    return label || `Column ${index + 1}`;
  });

  // Deduplicate headers so Record keys stay unique.
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((header) => {
    const count = seen.get(header) ?? 0;
    seen.set(header, count + 1);
    return count === 0 ? header : `${header} (${count + 1})`;
  });

  const rows = matrix.slice(1).map((line) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = normalizeCell(line[index]);
    });
    return row;
  }).filter((row) => Object.values(row).some((value) => value.length > 0));

  return { headers, rows };
}

export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetTable> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const parsed = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "CSV parse error");
    }
    return tableFromMatrix(parsed.data);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { headers: [], rows: [] };
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
    return tableFromMatrix(matrix);
  }

  throw new Error("Unsupported file type");
}
