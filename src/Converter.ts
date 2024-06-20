import { deepMerge } from "@std/collections";
import type {
  ConverterConvertResult,
  ConverterConvertResultDetail,
  ConverterConvertUsingPlugin,
  ConverterOption,
  ConvertFunction,
  Plugin,
} from "./types.ts";
import { defaultConverterOption } from "./constants.ts";

const makeFailedToConvertFunctionError = (
  name: string,
  index: number,
  error: unknown,
) =>
  new Error(
    `Failed to convert function.\nPlugin: "${name}"\nConvertFunctionIndex: ${index}`,
    { cause: error },
  );

const makeFailedToAllConvertFunctionError = (
  name: string,
  errors: unknown[],
) =>
  new Error(
    `Failed to convert function.\nPlugin: "${name}"\n`,
    { cause: errors },
  );
export class Converter<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string>,
> {
  plugins: TPlugins;
  converterOption: Required<ConverterOption>;

  constructor(
    plugins: TPlugins,
    options: {
      pluginOptions?: {
        [P in TPluginIDs]?: TPlugins[P] extends Plugin<object>
          ? Partial<TPlugins[P]["defaultOption"]>
          : undefined;
      };
      extendConvertFunctions?: {
        [P in TPluginIDs]?: (
          convertFunctions: TPlugins[P]["convertFunctions"],
        ) => TPlugins[P]["convertFunctions"];
      };
      converterOption?: ConverterOption;
    } = {},
  ) {
    const tempPlugins: Partial<
      Record<TPluginIDs, Plugin<object | undefined>>
    > = {};
    Object.entries(plugins).forEach(
      ([name, { defaultOption, convertFunctions }]) => {
        const pluginOption = options.pluginOptions?.[name as TPluginIDs];
        const extendConvertFunction = options.extendConvertFunctions?.[
          name as TPluginIDs
        ];
        if (defaultOption) {
          tempPlugins[name as TPluginIDs] = {
            defaultOption: pluginOption
              ? deepMerge(defaultOption, pluginOption)
              : defaultOption,
            convertFunctions: extendConvertFunction?.(convertFunctions) ??
              convertFunctions,
          };
        } else {
          tempPlugins[name as TPluginIDs] = {
            convertFunctions: (extendConvertFunction?.(convertFunctions) ??
              convertFunctions) as ConvertFunction[],
          };
        }
      },
    );
    this.plugins = tempPlugins as TPlugins;
    this.converterOption = {
      ...defaultConverterOption,
      ...options.converterOption,
    };
  }

  async convert<
    TUsingPlugins extends ConverterConvertUsingPlugin<TPlugins>[],
  >(
    text: string,
    usingPlugins: TUsingPlugins,
  ): Promise<
    ConverterConvertResult<TPlugins, TUsingPlugins>
  > {
    let convertedText = text;
    const details: Array<
      ConverterConvertResultDetail<
        TPlugins,
        TPluginIDs
      >
    > = [];
    for await (const usingPlugin of usingPlugins) {
      const { name, option } = typeof usingPlugin === "string"
        ? { name: usingPlugin, option: undefined }
        : usingPlugin;
      const plugin: TPlugins[typeof name] | undefined = this.plugins[name];
      if (!plugin) {
        if (this.converterOption.interruptWithPluginError) {
          throw new Error(`Plugin "${name}" is not found.`);
        }
        break;
      }
      // TODO: もっと簡潔にする
      if (plugin.defaultOption) {
        const mergedOption = deepMerge(
          plugin.defaultOption,
          option ?? {},
        );
        const detail = {
          ok: false,
          order: {
            name,
            option: mergedOption,
          },
          convertedText,
        } as ConverterConvertResultDetail<
          TPlugins,
          TPluginIDs
        >;
        for await (
          const [indexString, convertFunction] of Object.entries(
            plugin.convertFunctions,
          )
        ) {
          const index = Number(indexString);
          try {
            convertedText = await convertFunction(
              convertedText,
              mergedOption,
            );
            detail.ok = true;
            detail.convertedText = convertedText;
            details.push(detail);
            break;
          } catch (error) {
            console.error(makeFailedToConvertFunctionError(name, index, error));
            detail.errors ??= [];
            detail.errors.push(error);
          }
          details.push(detail);
        }
        if (this.converterOption.interruptWithPluginError) {
          throw makeFailedToAllConvertFunctionError(name, detail.errors!);
        }
      } else {
        const detail = {
          ok: false,
          order: {
            name,
          },
          convertedText,
        } as ConverterConvertResultDetail<
          TPlugins,
          TPluginIDs
        >;
        for await (
          const [indexString, convertFunction] of Object.entries(
            plugin.convertFunctions,
          )
        ) {
          const index = Number(indexString);
          try {
            convertedText = await convertFunction(
              convertedText,
            );
            detail.ok = true;
            detail.convertedText = convertedText;
            details.push(detail);
            break;
          } catch (error) {
            console.error(makeFailedToConvertFunctionError(name, index, error));
            detail.errors ??= [];
            detail.errors.push(error);
          }
          details.push(detail);
        }
        if (this.converterOption.interruptWithPluginError) {
          throw makeFailedToAllConvertFunctionError(name, detail.errors!);
        }
      }
    }
    return {
      text: convertedText,
      details: details as ConverterConvertResult<
        TPlugins,
        TUsingPlugins
      >["details"],
    };
  }
}
