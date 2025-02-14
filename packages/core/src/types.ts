import type { LoggerFunctions, LogLevels } from "./logger.ts";

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
  logger?: Partial<LoggerFunctions>;
}

export type ConverterPluginOrder<
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
export type ConverterConvertPluginOrder<
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
  TPluginOrder extends ConverterPluginOrder<TPlugins>,
> = TPluginOrder extends
  { name: infer R extends Extract<keyof TPlugins, string> } ? R
  : TPluginOrder extends Extract<keyof TPlugins, string> ? TPluginOrder
  : never;

/** Converter.convertで指定したPluginごとの変換結果 */
export type ConverterConvertResult<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = {
  pluginOrder: ConverterConvertPluginOrder<TPlugins, TPluginIDs>;
  ok: boolean;
  errors?: unknown[];
  convertedText: string;
};

/** Converter.convertの返り値 */
export interface ConverterConvertOutput<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginOrders extends ConverterPluginOrder<TPlugins>[],
> {
  text: string;
  results: {
    [K in keyof TPluginOrders]: ConverterConvertResult<
      TPlugins,
      ConverterConvertOrderName<TPlugins, TPluginOrders[K]>
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
  detail: ConverterConvertResult<TPlugins, TPluginIDs>,
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
  detail: ConverterConvertResult<TPlugins, TPluginIDs>,
  usingPluginsIndex: number,
  convertFunctionIndex: number,
) => void;
