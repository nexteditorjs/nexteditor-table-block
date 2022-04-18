import { assert, BlockElement, getLogger, isChildNode, NextEditor } from '@nexteditorjs/nexteditor-core';
import { getParentTableBlock } from '../table-dom';
import { TableBorderBar } from './table-border-bar';

const logger = getLogger('table-border-bar');

class TableBlockBorderHandler {
  private activeTableBar: TableBorderBar | null = null;

  constructor(private editor: NextEditor) {
    this.editor.addListener('blockDeleted', this.handleBlockDeleted);
    this.editor.addListener('focusBlockChanged', this.handleFocusBlockChanged);
  }

  destroy() {
    this.editor.removeListener('blockDeleted', this.handleBlockDeleted);
    this.editor.removeListener('focusBlockChanged', this.handleFocusBlockChanged);
  }

  handleBlockDeleted = (editor: NextEditor, block: BlockElement) => {
    if (!this.activeTableBar) {
      return;
    }
    if (block === this.activeTableBar.tableBlock || isChildNode(block, this.activeTableBar.tableBlock)) {
      this.activeTableBar.destroy();
      this.activeTableBar = null;
    }
  };

  handleFocusBlockChanged = (editor: NextEditor, newBlock: BlockElement | null) => {
    if (!newBlock) {
      this.hide();
      return;
    }
    const activeTableBlock = getParentTableBlock(newBlock);
    if (activeTableBlock) {
      if (this.activeTableBar) {
        if (this.activeTableBar.tableBlock !== activeTableBlock) {
          this.hide();
        }
      }
      this.show(activeTableBlock);
    } else {
      this.hide();
    }
  };

  show(tableBlock: BlockElement) {
    if (this.activeTableBar) {
      if (this.activeTableBar.tableBlock !== tableBlock) {
        this.hide();
      }
      // update
      this.activeTableBar.update();
    } else {
      this.activeTableBar = new TableBorderBar(this.editor, tableBlock);
    }
  }

  hide() {
    if (!this.activeTableBar) {
      return;
    }
    assert(logger, this.activeTableBar, 'no active table bar');
    this.activeTableBar.destroy();
    this.activeTableBar = null;
  }
}

export function handleTableBorderBar(editor: NextEditor) {
  editor.addCustom('table-border-bar', (editor) => new TableBlockBorderHandler(editor));
}
