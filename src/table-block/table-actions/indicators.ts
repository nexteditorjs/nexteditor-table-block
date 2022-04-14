import { NextEditor } from '@nexteditorjs/nexteditor-core';
import { removeAllInsertColumnIndicators } from '../insert-column/insert-column-indicator';
import { removeAllResizeGripper } from '../table-resize/resize-gripper';

export function removeAllIndicators(editor: NextEditor) {
  removeAllResizeGripper(editor);
  removeAllInsertColumnIndicators(editor);
}
