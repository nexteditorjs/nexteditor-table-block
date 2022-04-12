import { BlockElement, getContainerMinWidth, getContainerWidth, getParentContainer, NextEditor } from '@nexteditorjs/nexteditor-core';
import { getChildContainerInCell } from '../table-dom';
import { TableCell } from '../table-grid';
import { getEffectedCells, CONTAINER_CELL_DELTA, GRIPPER_SIZE_HALF } from './resize-gripper';

export function calCellNewSize(editor: NextEditor, block: BlockElement, table: HTMLTableElement, cellData: TableCell, x: number) {
  const cell = cellData.cell;
  const cellRect = cell.getBoundingClientRect();
  let newWidth = x - cellRect.left + GRIPPER_SIZE_HALF - CONTAINER_CELL_DELTA;
  const container = getChildContainerInCell(cell);
  const minWidth = getContainerMinWidth(editor, container);
  if (minWidth) {
    // console.log('container min width', minWidth, newWidth);
    // minWidth += getTableCellPadding(this.table);
    // console.log('min-width', minWidth, newWidth);
    if (newWidth < minWidth) {
      newWidth = minWidth;
    }
  }
  //
  // console.log('new width', newWidth);
  //
  const parentContainer = getParentContainer(block);
  const parentContainerWidth = getContainerWidth(parentContainer, { withPadding: false });
  if (parentContainerWidth) {
    // console.log('parent width', parentContainerWidth);
    // check width
    const currentWidth = container.getBoundingClientRect().width;
    const currentTableWidth = table.getBoundingClientRect().width;
    const newTableWidth = currentTableWidth + (newWidth - currentWidth);
    if (newTableWidth > parentContainerWidth) {
      newWidth = currentWidth;
    }
  }
  return Math.round(newWidth);
}

export function getTableResizeMinX(editor: NextEditor, draggingRefCell: HTMLTableCellElement, table: HTMLTableElement, x: number) {
  //
  const cell = draggingRefCell;
  //
  let minX = x;
  //
  const cells = getEffectedCells(table, cell);
  cells.forEach((cellData) => {
    //
    const cell = cellData.cell;
    const cellRect = cell.getBoundingClientRect();
    let newWidth = x - cellRect.left + GRIPPER_SIZE_HALF - CONTAINER_CELL_DELTA;
    const container = getChildContainerInCell(cell);
    const minWidth = getContainerMinWidth(editor, container);
    // console.debug(`container min-width: ${minWidth}`);
    if (minWidth) {
      if (newWidth < minWidth) {
        newWidth = minWidth;
      }
    }
    //
    const newX = cellRect.left + newWidth;
    minX = Math.max(minX, newX);
    //
  });
  //
  return minX;
}
