const SHEET_ID = '1bR2dlX_sHTaxMMlmeze3sHYWryRyVsKDKE_tJUxJS70';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlW5wHBUsexlBtuEmdMMBRFNxtcU6WeZpJBf0pKmPSveZTwxPsF9ofxb98WMM-YKDC/exec';

export interface SheetRow {
  rowIndex: number;
  data: string[];
}

export async function fetchSheetData(): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('無法讀取試算表');
  }
  
  const text = await response.text();
  const lines = parseCSV(text);
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = lines[0];
  const rows: SheetRow[] = lines.slice(1).map((data, index) => ({
    rowIndex: index + 2, // +2 because row 1 is header, and sheets are 1-indexed
    data
  }));
  
  return { headers, rows };
}

export async function saveSheetRow(rowIndex: number, data: string[]): Promise<boolean> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rowIndex, data }),
  });
  
  // Due to no-cors mode, we can't read the response, but if no error thrown, assume success
  return true;
}

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    result.push(row);
  }
  
  return result;
}

export function getEmailColumnIndex(headers: string[]): number {
  return 0;
}

export function canEditRow(rowEmail: string, userEmail: string): boolean {
  return rowEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
}
