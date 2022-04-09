/* eslint-disable max-classes-per-file */
import { assert, ContainerElement, BlockElement, isContainer, isChildContainer, getContainerId, SimpleCache, getLogger } from '@nexteditorjs/nexteditor-core';
import { table2Grid } from './table-data';
import { getBlockTable, getChildContainerInCell, getTableKey } from './table-dom';
import { DocTableCellData, DocTableRow, DocTableCellIndex } from './doc-table-grid';

const logger = getLogger('table-grid');

const CACHE_EXPIRE_SECONDS = 60;

export class TableCell implements DocTableCellData {
  containerId: string;

  row: number;

  col: number;

  colSpan: number;

  rowSpan: number;

  virtual?: boolean;

  table: HTMLTableElement;

  constructor(table: HTMLTableElement, cellData: DocTableCellData) {
    this.table = table;
    this.containerId = cellData.containerId;
    this.row = cellData.row;
    this.col = cellData.col;
    this.colSpan = cellData.colSpan;
    this.rowSpan = cellData.rowSpan;
    this.virtual = cellData.virtual;
  }

  get cell(): HTMLTableCellElement {
    const container = this.container;
    const cell = container.closest('td') as HTMLTableCellElement;
    assert(logger, cell, 'no parent cell for child container');
    return cell;
  }

  get container(): ContainerElement {
    const containers = this.table.querySelectorAll(`[data-container-id=${this.containerId}]`);
    assert(logger, containers.length === 1, 'containers !== 1');
    assert(logger, isContainer(containers[0]), 'not a container');
    const container = containers[0] as ContainerElement;
    assert(logger, isChildContainer(container), 'not a child container');
    return container;
  }
}

export class TableRow {
  private _cells: TableCell[] = [];

  constructor(table: HTMLTableElement, row: DocTableRow) {
    row.forEach((cell) => {
      this._cells.push(new TableCell(table, cell));
    });
  }

  get cells(): TableCell[] {
    return this._cells;
  }

  getCell(col: number): TableCell {
    assert(logger, col < this._cells.length, 'get cell, invalid col');
    return this._cells[col];
  }

  getNextNonVirtualCell(col: number): TableCell | undefined {
    return this._cells.slice(col + 1).find((data) => !data.virtual);
  }

  getSpannedCell(): TableCell | undefined {
    return this._cells.find((cell) => cell.virtual || cell.colSpan > 1 || cell.rowSpan > 1);
  }
}

export class TableGrid {
  private _rows: TableRow[] = [];

  private static caches = new SimpleCache<TableGrid>(CACHE_EXPIRE_SECONDS);

  constructor(public table: HTMLTableElement) {
    //
    const grid = table2Grid(table);
    grid.forEach((row) => {
      this._rows.push(new TableRow(table, row));
    });
    const colCount = this.colCount;
    this._rows.forEach((row) => {
      assert(logger, row.cells.length === colCount, 'row.cells.length !== colCount');
    });
  }

  get rowCount(): number {
    return this._rows.length;
  }

  get colCount(): number {
    if (this._rows.length === 0) {
      return 0;
    }
    assert(logger, this.rowCount > 0, 'rowCount <= 0');
    return this.getRow(0).cells.length;
  }

  getRow(row: number): TableRow {
    return this._rows[row];
  }

  getCell(cellIndex: DocTableCellIndex): TableCell {
    const row = this.getRow(cellIndex.row);
    assert(logger, row, 'no row');
    return row.getCell(cellIndex.col);
  }

  getCellContainer(cellIndex: DocTableCellIndex): ContainerElement {
    return this.getCell(cellIndex).container;
  }

  getFirstCellContainer(): ContainerElement {
    return this.getCellContainer({ row: 0, col: 0 });
  }

  getLastCellContainer(): ContainerElement {
    const row = this.rowCount - 1;
    const col = this.colCount - 1;
    return this.getCellContainer({ row, col });
  }

  getColumnCells(colIndex: number): TableCell[] {
    assert(logger, colIndex >= 0 && colIndex < this.colCount, 'colIndex out of range');
    const rowCount = this.rowCount;
    const ret = [];
    for (let row = 0; row < rowCount; row++) {
      const cell = this.getCell({ row, col: colIndex });
      ret.push(cell);
    }
    return ret;
  }

  toRealCells(cells: TableCell[]): TableCell[] {
    const realCells: TableCell[] = [];
    cells.forEach((cell) => {
      const realCell = this.getRealCell(cell);
      if (realCells.findIndex((test) => test.containerId === realCell.containerId) === -1) {
        realCells.push(realCell);
      }
    });
    return realCells;
  }

  getColumnRealCells(colIndex: number): TableCell[] {
    const cells = this.getColumnCells(colIndex);
    return this.toRealCells(cells);
  }

  getRowRealCells(rowIndex: number): TableCell[] {
    const cells = this.getRow(rowIndex).cells;
    return this.toRealCells(cells);
  }

  getFirstSpannedCell(colIndex: number): TableCell | undefined {
    assert(logger, colIndex >= 0 && colIndex < this.colCount, 'colIndex out of range');
    const rowCount = this.rowCount;
    for (let row = 0; row < rowCount; row++) {
      const cell = this.getCell({ row, col: colIndex });
      if (cell.virtual || cell.colSpan > 1 || cell.rowSpan > 1) {
        return cell;
      }
    }
    return undefined;
  }

  getRealCell(cellIndex: DocTableCellIndex): TableCell {
    const cell = this.getCell(cellIndex);
    if (!cell.virtual) {
      return cell;
    }
    const ret = this.getCellById(cell.containerId);
    assert(logger, !ret.virtual, 'found a virtual cell');
    return ret;
  }

  getColumnSpannedRange(col: number): number[] {
    const cells = this.getColumnRealCells(col);
    let min = 100000;
    let max = -1;
    cells.forEach((cell) => {
      min = Math.min(cell.col, min);
      max = Math.max(cell.col + cell.colSpan - 1, max);
    });
    assert(logger, min <= max, 'min > max');
    assert(logger, min >= 0, 'min < 0');
    assert(logger, max < this.colCount, 'max >= colCount');
    return [min, max];
  }

  getRowSpannedRange(row: number): number[] {
    const cells = this.getRowRealCells(row);
    let min = 100000;
    let max = -1;
    cells.forEach((cell) => {
      min = Math.min(cell.row, min);
      max = Math.max(cell.row + cell.rowSpan - 1, max);
    });
    assert(logger, min <= max, 'min > max');
    assert(logger, min >= 0, 'min < 0');
    assert(logger, max < this.rowCount, 'max >= rowCount');
    return [min, max];
  }

  getSpannedRange(startIndex: DocTableCellIndex, endIndex: DocTableCellIndex): DocTableCellIndex [] {
    //
    //
    const fromRow = Math.min(startIndex.row, endIndex.row);
    const toRow = Math.max(startIndex.row, endIndex.row);
    const fromCol = Math.min(startIndex.col, endIndex.col);
    const toCol = Math.max(startIndex.col, endIndex.col);
    //
    const cells = [];
    for (let row = fromRow; row <= toRow; row++) {
      for (let col = fromCol; col <= toCol; col++) {
        cells.push(this.getCell({ row, col }));
      }
    }
    //
    const realCells = this.toRealCells(cells);
    let startRow = 10000;
    let startCol = 10000;
    let endRow = -1;
    let endCol = -1;
    realCells.forEach((cell) => {
      startCol = Math.min(cell.col, startCol);
      startRow = Math.min(cell.row, startRow);
      endCol = Math.max(cell.col + cell.colSpan - 1, endCol);
      endRow = Math.max(cell.row + cell.rowSpan - 1, endRow);
    });
    //
    return [{ row: startRow, col: startCol }, { row: endRow, col: endCol }];
  }

  getAllCells() {
    return this.getCells({ col: 0, row: 0 }, { col: this.colCount - 1, row: this.rowCount - 1 });
  }

  getAllContainers() {
    const containers = this.getAllCells().map((c) => c.container);
    return containers;
  }

  getCells(from: DocTableCellIndex, to: DocTableCellIndex) {
    //
    const ret: TableCell[] = [];
    //
    const indexes = this.getSpannedRange(from, to);
    const start = indexes[0];
    const end = indexes[1];
    //
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);
    //
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = this.getCell({ row, col });
        if (!cell.virtual) {
          ret.push(cell);
        }
      }
    }
    //
    return ret;
  }

  getBottomCell(cellData: TableCell): TableCell | null {
    const rowCount = this.rowCount;
    let nextCellData = cellData;
    let nextRow = cellData.row;
    while (nextCellData.containerId === cellData.containerId) {
      nextRow += 1;
      if (nextRow >= rowCount) {
        return null;
      }
      nextCellData = this.getCell({ row: nextRow, col: cellData.col });
    }
    return this.getRealCell(nextCellData);
  }

  getTopCell(cellData: TableCell): TableCell | null {
    let prevCellData = cellData;
    let nextRow = cellData.row;
    while (prevCellData.containerId === cellData.containerId) {
      nextRow -= 1;
      if (nextRow < 0) {
        return null;
      }
      prevCellData = this.getCell({ row: nextRow, col: cellData.col });
    }
    return this.getRealCell(prevCellData);
  }

  get cells(): TableCell[] {
    let ret: TableCell[] = [];
    this._rows.forEach((row) => {
      ret = ret.concat(row.cells);
    });
    return ret;
  }

  getCellById(cellId: string): TableCell {
    const cells = this.cells;
    const cell = cells.find((c) => c.containerId === cellId);
    assert(logger, cell, 'cell not found');
    return cell;
  }

  getCellByCellElement(cell: HTMLTableCellElement): TableCell {
    const container = getChildContainerInCell(cell);
    return this.getCellByContainerId(getContainerId(container));
  }

  getCellByContainerId(containerId: string): TableCell {
    return this.getCellById(containerId);
  }

  static fromTable(table: HTMLTableElement): TableGrid {
    //
    const key = getTableKey(table);
    const grid = this.caches.getSync(key, () => {
      logger.debug('create table grid');
      const grid = new TableGrid(table);
      return grid;
    });
    //
    if (grid.table !== table) {
      this.caches.delete(key);
      return this.fromTable(table);
    }
    //
    return grid;
  }

  static fromBlock(block: BlockElement): TableGrid {
    return this.fromTable(getBlockTable(block));
  }
}
