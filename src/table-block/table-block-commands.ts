import { BlockElement, CommandItem,
  ComplexBlockPosition,
  ContainerElement,
  createBlockSimpleRange, executeBlockCommand, getBlockCommands,
  getBlockTextLength, getChildBlocks, intersectionCommands, NextEditor, SelectionRange,
} from '@nexteditorjs/nexteditor-core';
import { getTableSelectedContainers } from './get-selected-containers';
import { getTableChildContainers } from './table-container';

export function getAvailableCommands(editor: NextEditor, block: BlockElement, range: SelectionRange): CommandItem[] {
  //
  let containers: ContainerElement[] = [];
  if (range.isSimple()) {
    containers = getTableChildContainers(block);
  } else {
    containers = getTableSelectedContainers(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  }
  //
  const blockCommands: CommandItem[][] = [];
  containers.forEach((container) => {
    const blocks = getChildBlocks(container);
    blocks.forEach((block) => {
      const length = getBlockTextLength(editor, block);
      const newRange = createBlockSimpleRange(editor, block, 0, length);
      const commands = getBlockCommands(editor, block, newRange);
      blockCommands.push(commands);
    });
    //
  });
  //
  return intersectionCommands(blockCommands);
}

export function executeCommand(editor: NextEditor, block: BlockElement, range: SelectionRange, command: string, params?: { [index: string] : unknown }): unknown | undefined {
  if (!command.startsWith('style-')) {
    console.warn(`unknown command: ${command}`);
    return undefined;
  }
  //
  let containers: ContainerElement[] = [];
  if (range.isSimple()) {
    containers = getTableChildContainers(block);
  } else {
    containers = getTableSelectedContainers(block, range.start as ComplexBlockPosition, range.end as ComplexBlockPosition);
  }
  //
  const result: unknown[] = [];
  containers.forEach((container) => {
    const blocks = getChildBlocks(container);
    blocks.forEach((block) => {
      const length = getBlockTextLength(editor, block);
      const newRange = createBlockSimpleRange(editor, block, 0, length);
      const ret = executeBlockCommand(editor, block, newRange, command, params);
      result.push(ret);
    });
    //
  });
  return result;
}
