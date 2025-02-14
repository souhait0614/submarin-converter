/**
 * @module
 *
 * submarin-converterのPluginとして設定することで文章をﾒﾝﾍﾗっぽぃ日本語に変換できます
 *
 * @example
 * ```typescript
 * import { Converter } from "@submarin-converter/core";
 * import genhera from "@submarin-converter/plugin-genhera/dynamic";
 *
 * const converter = new Converter({ genhera });
 *
 * const output = await converter.convert("メロスは激怒した。", ["genhera"]);
 *
 * console.log(output.text) // "ﾒﾛｽゎ激怒した。。。"
 * ```
 */

import type { Plugin } from "@submarin-converter/core";
import { metaData } from "./constants.ts";

const dynamicGenerate = async (text: string) => {
  const { generate } = await import("./genhera/index.ts");
  return generate(text);
};

/** submarin-converterのPluginとして設定できるPlugin */
const plugin: Plugin<undefined> = {
  convertFunctions: [dynamicGenerate],
  metaData,
};

export default plugin;
