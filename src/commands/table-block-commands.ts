import { BlockCommandItem, BlockElement,
  CommandParams,
  CommandResult,
  getBlockId,
  getBlockKind,
  getBlockType, NextEditor, NextEditorCommandProvider, SelectionRange,
} from '@nexteditorjs/nexteditor-core';
import { canMergeCells, mergeCells } from './merge-cells';

const TableCommands = [
  'mergeCells',
  'splitCell',
  'insertColumnBefore',
  'insertColumnAfter',
  'insertRowAbove',
  'insertRowBelow',
  'deleteRows',
  'deleteColumns',
] as const;

export type TableCommand = typeof TableCommands[number];

export default class TableBlockCommandProvider implements NextEditorCommandProvider {
  getAvailableCommands(editor: NextEditor, block: BlockElement, range: SelectionRange): BlockCommandItem[] {
    if (getBlockType(block) !== 'table') {
      return [];
    }
    //
    const commands: BlockCommandItem[] = [];
    if (canMergeCells(editor, block, range)) {
      commands.push({
        id: 'mergeCells',
        name: 'merge cells',
        blockId: getBlockId(block),
        blockKind: getBlockKind(editor, block),
        blockType: getBlockType(block),
      });
    }
    //
    return commands;
  }

  executeCommand(editor: NextEditor, block: BlockElement, range: SelectionRange, command: string, params: CommandParams, result: CommandResult): boolean {
    if (getBlockType(block) !== 'table') {
      return false;
    }
    if (!((new Set(TableCommands) as Set<string>).has(command))) {
      return false;
    }
    //
    if (command === 'mergeCells') {
      mergeCells(range);
    }
    //
    return false;
  }
}
