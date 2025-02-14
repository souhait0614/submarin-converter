/**
 * @module
 *
 * submarin-converterのPluginとして設定することで文章を怪レい日本语に変換できます
 *
 * @example
 * ```typescript
 * import { Converter } from "@submarin-converter/core";
 * import cjp from "@submarin-converter/plugin-cjp";
 *
 * const converter = new Converter({ cjp });
 *
 * const output = await converter.convert("怪しい日本語", ["cjp"]);
 *
 * console.log(output.text) // "怪レい日本语"
 * ```
 */

import { generate } from "cjp";
import type { Plugin } from "@submarin-converter/core";
import { metaData } from "./constants.ts";

/** submarin-converterのPluginとして設定できるPlugin */
const plugin: Plugin<undefined> = {
  convertFunctions: [generate],
  metaData,
};

export default plugin;
