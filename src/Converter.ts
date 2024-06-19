import { deepMerge } from "@std/collections";
import type {
  ConverterConvertResult,
  ConverterOption,
  ConvertFunction,
  Plugin,
} from "./types.ts";
import { defaultConverterOption } from "./constants.ts";

export class Converter<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginNames extends Extract<keyof TPlugins, string>,
> {
  plugins: TPlugins;
  converterOption: Required<ConverterOption>;

  constructor(
    plugins: TPlugins,
    options: {
      pluginOptions?: {
        [P in TPluginNames]?: TPlugins[P] extends Plugin<object>
          ? TPlugins[P]["defaultOption"]
          : undefined;
      };
      extendConvertFunctions?: {
        [P in TPluginNames]?: (
          convertFunctions: TPlugins[P]["convertFunctions"],
        ) => TPlugins[P]["convertFunctions"];
      };
      converterOption?: ConverterOption;
    } = {},
  ) {
    const tempPlugins: Partial<
      Record<TPluginNames, Plugin<object | undefined>>
    > = {};
    Object.entries(plugins).forEach(
      ([name, { defaultOption, convertFunctions }]) => {
        const pluginOption = options.pluginOptions?.[name as TPluginNames];
        const extendConvertFunction = options.extendConvertFunctions?.[
          name as TPluginNames
        ];
        if (defaultOption) {
          tempPlugins[name as TPluginNames] = {
            defaultOption: pluginOption
              ? deepMerge(defaultOption, pluginOption)
              : defaultOption,
            convertFunctions: extendConvertFunction?.(convertFunctions) ??
              convertFunctions,
          };
        } else {
          tempPlugins[name as TPluginNames] = {
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

  async convert(
    text: string,
    usingPlugins: Array<
      | TPluginNames
      | {
        [P in TPluginNames]: {
          name: P;
          option?: TPlugins[P]["defaultOption"];
        };
      }[TPluginNames]
    >,
  ): Promise<ConverterConvertResult> {
    let convertedText = text;
    for await (const usingPlugin of usingPlugins) {
      const { name, option } = typeof usingPlugin === "string"
        ? { name: usingPlugin, option: undefined }
        : usingPlugin;
      const plugin: TPlugins[typeof name] | undefined = this.plugins[name];
      if (!plugin) {
        if (this.converterOption.continueWithPluginError) {
          break;
        }
        throw new Error(`Plugin "${name}" is not found.`);
      }
      // TODO: もっと簡潔にする
      if (plugin.defaultOption) {
        for await (
          const [indexString, convertFunction] of Object.entries(
            plugin.convertFunctions,
          )
        ) {
          const index = Number(indexString);
          try {
            convertedText = await convertFunction(
              convertedText,
              deepMerge(plugin.defaultOption, option ?? {}),
            );
            break;
          } catch (error) {
            console.error(
              new Error(
                `Failed to convert function. \nPlugin: "${name}"\nConvertFunctionIndex: ${index}`,
                { cause: error },
              ),
            );
          }
        }
      } else {
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
            break;
          } catch (error) {
            console.error(
              new Error(
                `Failed to convert function. \nPlugin: "${name}"\nConvertFunctionIndex: ${index}`,
                { cause: error },
              ),
            );
          }
        }
      }
    }
    return {
      text: convertedText,
    };
  }
}
