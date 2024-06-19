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
  continueWithPluginError?: boolean;
}

export interface ConverterConvertResult {
  text: string;
}
