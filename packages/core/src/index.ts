/**
 * @module
 *
 * 文字列を加工して返却する関数をプラグインとして設定し、指定した順序、オプションに従って文字列を変換します
 *
 * @example
 * ```typescript
 * import { Converter, type Plugin } from "@submarin-converter/core";
 * const double: Plugin<undefined> = {
 *   convertFunctions: [(text) => text + text],
 * };
 * const suffix: Plugin<{ suffix: string }> = {
 *   defaultOption: { suffix: "" },
 *   convertFunctions: [(text, option) => text + option.suffix],
 * };
 * const converter = new Converter({
 *   double,
 *   suffix,
 * });
 *
 * const output = await converter.convert(
 *   "Foo",
 *   [
 *     "double",
 *     {
 *       name: "suffix",
 *       option: { suffix: "Bar" },
 *     },
 *   ] as const,
 * );
 *
 * console.log(output.text) // "FooFooBar"
 * ```
 *
 * @example
 * ```typescript
 * import { Converter, type Plugin } from "@submarin-converter/core";
 * import cjp from "@submarin-converter/plugin-cjp";
 * import genhera from "@submarin-converter/plugin-genhera";
 *
 * const converter = new Converter({
 *   cjp,
 *   genhera,
 * });
 *
 * const output = await converter.convert(
 *   "こんにちは。",
 *   [
 *     "cjp",
 *     "genhera",
 *   ] as const,
 * );
 *
 * console.log(output.text) // "ごんにさゎ。。。"
 * ```
 */

export * from "./Converter.ts";
export type {
  ConverterConvertOutput,
  ConverterConvertPluginOrder,
  ConverterConvertResult,
  ConverterEndConvertFunctionHandler,
  ConverterEndPluginConvertHandler,
  ConverterOption,
  Plugin,
  PluginConvertFunction,
  PluginMetaData,
} from "./types.ts";
