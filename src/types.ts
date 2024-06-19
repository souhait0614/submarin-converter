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
}

export type ConverterConvertUsingPlugin<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginNames extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> =
  | TPluginNames
  | {
    [P in TPluginNames]: {
      name: P;
      option?: TPlugins[P]["defaultOption"];
    };
  }[TPluginNames];

export type ConverterConvertOrder<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginNames extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = TPlugins[TPluginNames]["defaultOption"] extends object ? {
    name: TPluginNames;
    option: TPlugins[TPluginNames]["defaultOption"];
  }
  : {
    name: TPluginNames;
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
  TPluginNames extends Extract<keyof TPlugins, string> = Extract<
    keyof TPlugins,
    string
  >,
> = {
  order: ConverterConvertOrder<TPlugins, TPluginNames>;
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
