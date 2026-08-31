declare module 'read-excel-file/browser' {
  type Cell = string | number | boolean | Date | null;
  interface Sheet {
    sheet: string;
    data: Cell[][];
  }
  export default function readWorkbook(file: File | Blob | ArrayBuffer): Promise<Sheet[]>;
}
