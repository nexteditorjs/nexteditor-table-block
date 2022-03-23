import { assert, DocBlock, DocObject, genId, NextEditor, cloneBlock } from '@nexteditorjs/nexteditor-core';
import cloneDeep from 'lodash.clonedeep';

export function cloneTableBlock(editor: NextEditor, oldDoc: DocObject, block: DocBlock, newDoc: DocObject): DocBlock {
  //
  assert(block.type === 'table', `invalid block type, ${block.type}`);
  assert(block.children, 'no table children');
  //
  const newBlock = {
    ...cloneDeep(block),
    id: genId(),
  };
  //
  const containerIdMap = new Map<string, string>();
  //
  newBlock.children = block.children.map((childContainerId) => {
    const newChildContainerId = genId();
    //
    const childBlocks = oldDoc.blocks[childContainerId];
    assert(Array.isArray(childBlocks), 'invalid child blocks');
    const newChildBlocks = childBlocks.map((c) => cloneBlock(editor, oldDoc, c, newDoc));
    // eslint-disable-next-line no-param-reassign
    newDoc.blocks[newChildContainerId] = newChildBlocks;
    //
    containerIdMap.set(childContainerId, newChildContainerId);
    //
    return newChildContainerId;
  });
  //
  const tryReplaceKey = (key: string) => {
    const entries = Array.from(containerIdMap.entries());
    // eslint-disable-next-line no-restricted-syntax
    for (const entry of entries) {
      const [oldContainerId, newContainerId] = entry;
      const prefix = `${oldContainerId}_`;
      if (key.startsWith(prefix)) {
        const keyContent = key.substring(prefix.length);
        const newKey = `${newContainerId}_${keyContent}`;
        console.debug(`replace key: ${key} -> ${newKey}`);
        return newKey;
      }
    }
    //
    return key;
  };
  //
  const newEntries = Object.entries((newBlock)).map(([key, value]) => {
    const newKey = tryReplaceKey(key);
    return [newKey, value];
  });
  //
  return Object.fromEntries(newEntries);
}
