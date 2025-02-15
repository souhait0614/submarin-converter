/**
 * @module
 *
 * submarin-converterのPluginとして設定することで文章を最終にして究極の幻想風の日本語に変換できます
 *
 * @example
 * ```typescript
 * import { Converter } from "@submarin-converter/core";
 * import PluginNomlish from "@submarin-converter/plugin-nomlish";
 *
 * const nomlish = new PluginNomlish();
 *
 * const converter = new Converter({ nomlish });
 *
 * const output = await converter.convert("吾輩は猫である。名前はまだ無い。", ["nomlish"]);
 *
 * console.log(output.text) // "人類の上位種である吾輩は獣である。名前はまだクリスタルがこの世に存在していた頃の話…ヴァニティー。"
 * ```
 */

import {
  NomlishTranslator,
  type TranslateParams,
} from "@souhait0614/nomlish-translator";
import type { Plugin } from "@submarin-converter/core";
import { metaData } from "./constants.ts";

class PluginNomlish extends NomlishTranslator {
  convertFunctions: Plugin<TranslateParams>["convertFunctions"];
  metaData: Plugin<TranslateParams>["metaData"] = metaData;

  constructor(translateParams?: Partial<TranslateParams>) {
    super(translateParams);
    this.convertFunctions = [this.translate];
  }
}

export default PluginNomlish;
