import { DocBlock, DocBlockAttributes } from '@nexteditorjs/nexteditor-core';

export function pickContainerData(blockData: DocBlock, containerId: string) {
  const ret: DocBlockAttributes = {};
  Object.entries(blockData).forEach(([key, value]) => {
    if (key.startsWith(`${containerId}/`)) {
      ret[key] = value;
    }
  });
  return ret;
}

export function deleteContainerData(blockData: DocBlock, containerId: string) {
  Object.entries(blockData).forEach(([key]) => {
    if (key.startsWith(`${containerId}/`)) {
      // eslint-disable-next-line no-param-reassign
      delete blockData[key];
    }
  });
}
