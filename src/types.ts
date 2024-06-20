import type { Promisable } from "type-fest";

export type ConvertFunction = (text: string) => Promisable<string>;
export type ConvertFunctionWithOption<
  TOption extends object,
> = (text: string, option: Partial<TOption>) => Promisable<string>;

export type Plugin<
  TOption extends object | undefined,
> = TOption extends object ? {
    defaultOption: Required<TOption>;
    convertFunctions: ConvertFunctionWithOption<TOption>[];
  }
  : {
    defaultOption?: never;
    convertFunctions: ConvertFunction[];
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
