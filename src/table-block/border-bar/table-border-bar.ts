import { assert, BlockElement, getLogger, NextEditor } from '@nexteditorjs/nexteditor-core';
import { hideTableBorderBar, updateTableBorderBar } from './table-border-dom';

const logger = getLogger('table-border-bar');

export class TableBorderBar {
  constructor(private editor: NextEditor, public tableBlock: BlockElement) {
    assert(logger, this.tableBlock, 'no table block');
    logger.debug('create table border bar');
    updateTableBorderBar(this.editor, this.tableBlock);
    this.editor.addListener('blockNotify', this.handleTableResize);
  }

  destroy() {
    logger.debug('destroy table border bar');
    this.editor.removeListener('blockNotify', this.handleTableResize);
    hideTableBorderBar(this.editor, this.tableBlock);
  }

  update() {
    logger.debug('update table border bar');
    updateTableBorderBar(this.editor, this.tableBlock);
  }

  handleTableResize = (editor: NextEditor, block: BlockElement, notifyName: string) => {
    if (block === this.tableBlock && notifyName === 'resize') {
      this.update();
    }
  };
}
