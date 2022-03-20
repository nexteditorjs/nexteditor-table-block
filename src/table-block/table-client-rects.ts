import { NextEditor, BlockElement, SelectionRange, ComplexBlockPosition } from '@nexteditorjs/nexteditor-core';
import { getTableSelectedContainers } from './get-selected-containers';
import { getBlockTable } from './table-dom';

export function getClientRects(editor: NextEditor, block: BlockElement, range: SelectionRange): DOMRect[] {
  if (range.isSimple()) {
    return [getBlockTable(block).getBoundingClientRect()];
  }

  const containers = getTableSelectedContainers(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  let left = Number.MAX_SAFE_INTEGER;
  let top = Number.MAX_SAFE_INTEGER;
  let right = Number.MIN_SAFE_INTEGER;
  let bottom = Number.MIN_SAFE_INTEGER;
  //
  containers.forEach((container) => {
    const rect = container.getBoundingClientRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  });
  //
  return [new DOMRect(left, top, right - left, bottom - top)];
}
