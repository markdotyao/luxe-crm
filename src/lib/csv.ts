/**
 * Minimal CSV builder. RFC 4180-ish: \r\n line endings, fields wrapped in
 * quotes when they contain commas, quotes, or newlines, with internal
 * quotes doubled. A UTF-8 BOM (﻿) is prepended so Excel opens the
 * file with the right encoding.
 */

type Column<T> = {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

const BOM = "﻿";

export function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const headerLine = columns.map((c) => csvField(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => csvField(c.value(row))).join(","),
  );
  return BOM + [headerLine, ...dataLines].join("\r\n");
}

export function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Trigger a browser download for a CSV string. Client-only — uses Blob and
 * document.createElement, so don't call from a server component.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
