import type { Promisable } from "type-fest";

export type PluginConvertFunction<
  TOption extends object | undefined,
> = TOption extends object
  ? (text: string, option: TOption) => Promisable<string>
  : (text: string) => Promisable<string>;

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
> = TOption extends object ? {
    defaultOption: Required<TOption>;
    convertFunctions: PluginConvertFunction<TOption>[];
  }
  : {
    defaultOption?: never;
    convertFunctions: PluginConvertFunction<undefined>[];
  };

export interface ConverterOption {
  interruptWithPluginError?: boolean;
  // TODO: エラー出力の制御オプションの追加
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
