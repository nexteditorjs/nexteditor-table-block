import { getTableCol } from '../table-dom';

export function setColumnWidth(table: HTMLTableElement, colIndex: number, width: number) {
  getTableCol(table, colIndex).style.width = `${width}px`;
}

export function getTableColumnWidths(table: HTMLTableElement) {
  const tableCols = Array.from((table.querySelector('colgroup') as HTMLElement).children) as HTMLTableColElement[];
  const widths = tableCols.map((col) => col.getBoundingClientRect().width);
  return widths;
}
