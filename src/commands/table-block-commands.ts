import { BlockCommandItem, BlockElement,
  CommandParams,
  CommandResult,
  getBlockId,
  getBlockKind,
  getBlockType, NextEditor, NextEditorCommandProvider, SelectionRange,
} from '@nexteditorjs/nexteditor-core';
import { canMergeCells, mergeRangeCells } from './merge-cells';
import { canSplitCell, splitRangeCells } from './split-cell';

const TableCommands = [
  'table/merge-cells',
  'table/split-cell',
  'table/insert-column-before',
  'table/insert-column-after',
  'table/insert-row-above',
  'table/insert-row-below',
  'table/delete-rows',
  'table/delete-columns',
] as const;

export type TableCommand = typeof TableCommands[number];

export default class TableBlockCommandProvider implements NextEditorCommandProvider {
  getAvailableCommands(editor: NextEditor, block: BlockElement, range: SelectionRange): BlockCommandItem[] {
    if (getBlockType(block) !== 'table') {
      return [];
    }
    //
    const ext = {
      blockId: getBlockId(block),
      blockKind: getBlockKind(editor, block),
      blockType: getBlockType(block),
    };
    //
    const commands: BlockCommandItem[] = [];
    if (canMergeCells(editor, block, range)) {
      commands.push({
        id: 'table/merge-cells',
        name: 'merge cells',
        ...ext,
      });
    }
    if (canSplitCell(editor, block, range)) {
      commands.push({
        id: 'table/split-cell',
        name: 'split cell',
        ...ext,
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
    if (command === 'table/merge-cells') {
      mergeRangeCells(range);
      return true;
    }
    //
    if (command === 'table/split-cell') {
      splitRangeCells(range);
      return true;
    }
    //
    return false;
  }
}