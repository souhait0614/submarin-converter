/**
 * @module
 *
 * submarin-converterのPluginとして設定することで文章をﾒﾝﾍﾗっぽぃ日本語に変換できます
 *
 * @example
 * ```typescript
 * import { Converter } from "@submarin-converter/core";
 * import genhera from "@submarin-converter/plugin-genhera";
 *
 * const converter = new Converter({ genhera });
 *
 * const { text } = await converter.convert("メロスは激怒した。", ["genhera"]);
 *
 * console.log(text) // "ﾒﾛｽゎ激怒した。。。"
 * ```
 */

import type { Plugin } from "@submarin-converter/core";
import { metaData } from "./constants.ts";
import { generate } from "./genhera/index.ts";

/** submarin-converterのPluginとして設定できるPlugin */
const plugin: Plugin<undefined> = {
  convertFunctions: [generate],
  metaData,
};

export default plugin;
