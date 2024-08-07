import type { LogLevels } from "./logger.ts";

export type PromiseOrValue<T> = T | PromiseLike<T>;

/** Pluginの文字列変換関数 */
export type PluginConvertFunction<
  TOption extends object | undefined,
> = TOption extends object
  ? (text: string, option: Partial<TOption>) => PromiseOrValue<string>
  : (text: string) => PromiseOrValue<string>;

/** Pluginに設定できる情報 */
export interface PluginMetaData {
  displayName?: string;
  description?: string;
  homepage?: string | string[];
  author?: string | string[];
  version?: string;
  repository?: string;
}

/**
 * 文字列を加工して返却する関数やオプションの型
 *
 * @example
 * ```ts
 * const double: Plugin<undefined> = {
 *  convertFunctions: [(text) => text + text],
 * };
 * const suffix: Plugin<{ suffix: string }> = {
 *  defaultOption: { suffix: "" },
 *  convertFunctions: [(text, option) => text + option.suffix],
 * };
 * ```
 *
 * @template {object | undefined} TOption
 */
export type Plugin<
  TOption extends object | undefined,
> =
  & {
    convertFunctions: PluginConvertFunction<TOption>[];
    metaData?: PluginMetaData;
  }
  & (TOption extends object ? {
      defaultOption: Required<TOption>;
    }
    : {
      defaultOption?: never;
    });

/** Converter本体のオプション */
export interface ConverterOption {
  interruptWithPluginError?: boolean;
  logLevel?: LogLevels;
}

export type ConverterConvertUsingPlugin<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> =
  | TPluginIDs
  | {
    [P in TPluginIDs]: {
      name: P;
      option?: TPlugins[P]["defaultOption"];
    };
  }[TPluginIDs];

/** Converter.convertで指定したPluginとPluginが使用したオプションの値 */
export type ConverterConvertOrder<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = TPlugins[TPluginIDs]["defaultOption"] extends object ? {
    name: TPluginIDs;
    option: TPlugins[TPluginIDs]["defaultOption"];
  }
  : {
    name: TPluginIDs;
  };

export type ConverterConvertOrderName<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TUsingPlugin extends ConverterConvertUsingPlugin<TPlugins>,
> = TUsingPlugin extends
  { name: infer R extends Extract<keyof TPlugins, string> } ? R
  : TUsingPlugin extends Extract<keyof TPlugins, string> ? TUsingPlugin
  : never;

/** Converter.convertで指定したPluginごとの変換結果 */
export type ConverterConvertResultDetail<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = {
  order: ConverterConvertOrder<TPlugins, TPluginIDs>;
  ok: boolean;
  errors?: unknown[];
  convertedText: string;
};

/** Converter.convertの返り値 */
export interface ConverterConvertResult<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TUsingPlugins extends ConverterConvertUsingPlugin<TPlugins>[],
> {
  text: string;
  details: {
    [K in keyof TUsingPlugins]: ConverterConvertResultDetail<
      TPlugins,
      ConverterConvertOrderName<TPlugins, TUsingPlugins[K]>
    >;
  };
}

/** Converter.convertでプラグインでの変換が成功または失敗したあとに呼び出されるコールバック関数 */
export type ConverterEndPluginConvertHandler<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = (
  detail: ConverterConvertResultDetail<TPlugins, TPluginIDs>,
  usingPluginsIndex: number,
) => void;

/** Converter.convertでプラグインのConvertFunctionが実行されたあとに呼び出されるコールバック関数 */
export type ConverterEndConvertFunctionHandler<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = (
  detail: ConverterConvertResultDetail<TPlugins, TPluginIDs>,
  usingPluginsIndex: number,
  convertFunctionIndex: number,
) => void;
