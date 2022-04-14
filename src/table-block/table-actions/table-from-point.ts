import { getParentBlock, NextEditor } from '@nexteditorjs/nexteditor-core';
import { isTableBlock } from '../table-dom';
import { removeAllIndicators } from './indicators';

export function tableBlockFromPoint(editor: NextEditor, ev: MouseEvent) {
  const elem = document.elementFromPoint(ev.x, ev.y);
  if (!elem) {
    return null;
  }
  const block = getParentBlock(elem);
  if (!block) {
    removeAllIndicators(editor);
    return null;
  }
  if (!editor.contains(block)) {
    removeAllIndicators(editor);
    return null;
  }
  if (!isTableBlock(block)) {
    removeAllIndicators(editor);
    return null;
  }
  return block;
}
