type Cell = string | number | null;

type SpreadsheetResult = {
  rows: Record<string, Cell>[];
  columns: string[];
  rowCount: number;
  numericSummary: Record<string, { count: number; min: number; max: number; average: number; sum: number }>;
  missing: Record<string, number>;
};

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim()); current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeCell(value: string): Cell {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(number) && /^[-+]?\d[\d,]*(\.\d+)?$/.test(trimmed) ? number : trimmed;
}

export function analyzeSpreadsheetText(input: string, delimiter = ","): SpreadsheetResult {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error("Spreadsheet is empty");
  const headerCells = delimiter === "\t" ? lines[0].split("\t") : splitCsvLine(lines[0]);
  const columns = headerCells.map((value, index) => value.trim() || `Column ${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const cells = delimiter === "\t" ? line.split("\t") : splitCsvLine(line);
    return Object.fromEntries(columns.map((column, index) => [column, normalizeCell(cells[index] || "")]));
  });

  const numericSummary: SpreadsheetResult["numericSummary"] = {};
  const missing: Record<string, number> = {};
  for (const column of columns) {
    const values = rows.map((row) => row[column]);
    missing[column] = values.filter((value) => value === null || value === "").length;
    const numbers = values.filter((value): value is number => typeof value === "number");
    if (numbers.length) {
      const sum = numbers.reduce((a, b) => a + b, 0);
      numericSummary[column] = { count: numbers.length, min: Math.min(...numbers), max: Math.max(...numbers), average: sum / numbers.length, sum };
    }
  }

  return { rows, columns, rowCount: rows.length, numericSummary, missing };
}
