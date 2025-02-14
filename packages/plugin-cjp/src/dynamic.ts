/**
 * @module
 *
 * submarin-converterのPluginとして設定することで文章を怪レい日本语に変換できます
 *
 * @example
 * ```typescript
 * import { Converter } from "@submarin-converter/core";
 * import cjp from "@submarin-converter/plugin-cjp/dynamic";
 *
 * const converter = new Converter({ cjp });
 *
 * const output = await converter.convert("怪しい日本語", ["cjp"]);
 *
 * console.log(output.text) // "怪レい日本语"
 * ```
 */

import type { Plugin } from "@submarin-converter/core";
import { metaData } from "./constants.ts";

const dynamicGenerate = async (text: string) => {
  const { generate } = await import("cjp");
  return generate(text);
};

/** submarin-converterのPluginとして設定できるPlugin */
const plugin: Plugin<undefined> = {
  convertFunctions: [dynamicGenerate],
  metaData,
};

export default plugin;
