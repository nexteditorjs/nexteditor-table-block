import { BlockCommandItem, BlockElement,
  CommandParams,
  CommandResult,
  getBlockType, NextEditor, NextEditorCommandProvider, SelectionRange,
} from '@nexteditorjs/nexteditor-core';

export default class TableBlockCommandProvider implements NextEditorCommandProvider {
  getAvailableCommands(editor: NextEditor, block: BlockElement, range: SelectionRange): BlockCommandItem[] {
    if (getBlockType(block) !== 'table') {
      return [];
    }
    return [];
  }

  executeCommand(editor: NextEditor, block: BlockElement, range: SelectionRange, command: string, params: CommandParams, result: CommandResult): boolean {
    return false;
  }
}
