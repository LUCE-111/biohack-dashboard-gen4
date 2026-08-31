import readWorkbook from 'read-excel-file/browser';
import { ROSTER_PARSER_VERSION, parseRosterWorkbook, stableSchedulePayload } from './roster.ts';
import type { RosterAliasMap, RosterVersion, WorkbookCell, WorkbookSheetData } from '../types.ts';

function normalizeCell(value: string | number | boolean | Date | null | undefined): WorkbookCell {
  return value ?? null;
}

async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function readRosterWorkbook(file: File): Promise<readonly WorkbookSheetData[]> {
  const sheets = await readWorkbook(file);
  return sheets.map((sheet) => ({
    name: sheet.sheet,
    rows: sheet.data.map((row) => row.map(normalizeCell)),
  }));
}

export async function createRosterVersion(
  file: File,
  workbook: readonly WorkbookSheetData[],
  aliases: RosterAliasMap,
): Promise<RosterVersion> {
  const parsed = parseRosterWorkbook(workbook, aliases);
  const bytes = await file.arrayBuffer();
  const rawHash = await sha256Hex(bytes);
  const scheduleHash = await sha256Hex(stableSchedulePayload(parsed.assignments));
  const importedAt = new Date().toISOString();
  return {
    id: `roster:${scheduleHash.slice(0, 20)}:${Date.now()}`,
    fileName: file.name,
    importedAt,
    rawHash,
    scheduleHash,
    parserVersion: ROSTER_PARSER_VERSION,
    coverage: parsed.coverage,
    employees: parsed.employees,
    assignments: parsed.assignments,
    conflicts: parsed.conflicts,
    unresolvedTokens: parsed.unresolvedTokens,
  };
}
