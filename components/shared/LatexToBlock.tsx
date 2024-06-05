// import { BlockNoteSchema, BlockSchema, InlineContentSchema, StyleSchema, PartialBlock } from './path/to/BlockNoteEditor';

import {
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
  BlockNoteSchema,
  PartialBlock,
  BlockNoteSchema,
} from "@blocknote/core";

export function LatexToBlock<
  BSchema extends BlockSchema,
  ISchema extends InlineContentSchema,
  SSchema extends StyleSchema,
>(
  latex: string,
  schema: BlockNoteSchema<BSchema, ISchema, SSchema>
): PartialBlock<BSchema, ISchema, SSchema>[] {
  return [
    {
      type: "latex", // Assuming 'latex' is a valid type in your schema
      content: latex,
    },
  ];
}
