/* eslint-disable max-classes-per-file */
import { assert } from '@nexteditorjs/nexteditor-core';
import { DocTableBlockData } from './doc-table-data';

export interface DocTableCellData {
  cellId: string;
  row: number;
  col: number;
  colSpan: number;
  rowSpan: number;
  virtual?: boolean;
}

export class DocTableRow {
  private _cells: DocTableCellData[] = [];

  constructor(cols: number) {
    for (let i = 0; i < cols; i++) {
      this._cells.push(undefined as any);
    }
  }

  cols() {
    return this._cells.length;
  }

  setCell(col: number, cell: DocTableCellData) {
    assert(col >= 0 && col < this.cols());
    this._cells[col] = cell;
  }

  getCell(col: number): DocTableCellData {
    assert(col >= 0 && col < this.cols());
    const cell = this._cells[col];
    assert(cell);
    return cell;
  }

  getCellAllowEmpty(col: number): DocTableCellData | undefined {
    assert(col >= 0 && col < this.cols());
    const cell = this._cells[col];
    return cell;
  }

  getNextNonVirtualCell(col: number): DocTableCellData | undefined {
    return this._cells.slice(col + 1).find((data) => !data.virtual);
  }

  forEach(callbackfn: (value: DocTableCellData, index: number, array: DocTableCellData[]) => void) {
    this._cells.forEach(callbackfn);
  }
}

export interface DocTableCellIndex {
  row: number,
  col: number;
}

export class DocTableGrid {
  private _data: DocTableBlockData;

  private _rows: DocTableRow[];

  constructor(tableData: DocTableBlockData) {
    this._data = tableData;
    this._rows = [];
    for (let y = 0; y < this.rowCount; y++) {
      this._rows.push(new DocTableRow(this.colCount));
    }
    this.fillGrid();
  }

  get rowCount() {
    return this._data.rows;
  }

  get colCount() {
    return this._data.cols;
  }

  getNextEmptyCell(col: number, row: number) {
    let x = col;
    let y = row;
    for (;;) {
      x += 1;
      if (x === this.colCount) {
        x = 0;
        y += 1;
      }
      //
      if (y >= this.rowCount) {
        return null;
      }
      //
      if (this._rows[y].getCellAllowEmpty(x) === undefined) {
        return {
          col: x,
          row: y,
        };
      }
      //
    }
  }

  fillGrid() {
    const children = this._data.children;
    assert(children);
    //
    let col = 0;
    let row = 0;
    children.forEach((cellId: string, index: number) => {
      const cellColSpan = this._data[`${cellId}_colSpan`] as number || 1;
      const cellRowSpan = this._data[`${cellId}_rowSpan`] as number || 1;
      //
      for (let y = 0; y < cellRowSpan; y++) {
        for (let x = 0; x < cellColSpan; x++) {
          this._rows[row + y].setCell(col + x, {
            col,
            row,
            cellId,
            virtual: x !== 0 || y !== 0,
            colSpan: cellColSpan,
            rowSpan: cellRowSpan,
          });
        }
      }
      //
      const next = this.getNextEmptyCell(col, row);
      if (!next) {
        assert(index === children.length - 1, `invalid table data, no next empty cell: ${JSON.stringify(this._data)}`);
      } else {
        col = next.col;
        row = next.row;
      }
    });
    //
    // eslint-disable-next-line @typescript-eslint/no-shadow
    this._rows.forEach((row) => {
      row.forEach((cell) => {
        assert(cell);
        assert(cell.cellId);
      });
    });
  }

  getCell(index: DocTableCellIndex): DocTableCellData {
    const { col, row } = index;
    const r = this._rows[row];
    assert(r);
    const ret = r.getCell(col);
    assert(ret);
    return ret;
  }

  getRow(row: number): DocTableRow {
    const ret = this._rows[row];
    assert(ret);
    return ret;
  }

  forEach(callbackfn: (value: DocTableRow, index: number, array: DocTableRow[]) => void) {
    this._rows.forEach(callbackfn);
  }
}
