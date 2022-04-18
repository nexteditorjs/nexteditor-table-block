import { getParentBlock, NextEditor } from '@nexteditorjs/nexteditor-core';
import { isTableBlock } from '../table-dom';

export function tableBlockFromPoint(editor: NextEditor, ev: MouseEvent) {
  const elem = document.elementFromPoint(ev.x, ev.y);
  if (!elem) {
    return null;
  }
  const block = getParentBlock(elem);
  if (!block) {
    return null;
  }
  if (!editor.contains(block)) {
    return null;
  }
  if (!isTableBlock(block)) {
    return null;
  }
  return block;
}
