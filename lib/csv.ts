/** CSV helpers used by the reports page and data export. */

export type CsvCell = string | number | null | undefined;
export type CsvRows = CsvCell[][];

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: CsvRows): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Triggers a UTF-8 (BOM) CSV download in the browser. */
export function downloadCsv(filename: string, rows: CsvRows): void {
  downloadBlob(
    filename,
    new Blob([`\uFEFF${toCsv(rows)}`], { type: "text/csv;charset=utf-8;" }),
  );
}

/** Downloads already-serialized CSV text, prefixed with a UTF-8 BOM. */
export function downloadCsvText(filename: string, csv: string): void {
  downloadBlob(
    filename,
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }),
  );
}

/** Triggers a text file download (JSON export, etc.). */
export function downloadTextFile(
  filename: string,
  text: string,
  mimeType = "application/json",
): void {
  downloadBlob(filename, new Blob([text], { type: `${mimeType};charset=utf-8;` }));
}
