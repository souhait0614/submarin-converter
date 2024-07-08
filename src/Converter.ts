import { deepMerge } from "@std/collections";
import type {
  ConverterConvertResult,
  ConverterConvertResultDetail,
  ConverterConvertUsingPlugin,
  ConverterEndConvertFunctionHandler,
  ConverterEndPluginConvertHandler,
  ConverterOption,
  Plugin,
  PluginConvertFunction,
} from "./types.ts";
import { defaultConverterOption } from "./constants.ts";
import { Logger } from "./logger.ts";

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

/**
 * 指定されたプラグインを使用して変換を処理するConverterクラス
 *
 * @template {Record<string, Plugin<object | undefined>>} TPlugins
 * @template {Extract<keyof TPlugins, string>} TPluginIDs
 *
 * @example
 * ```typescript
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
 * ```
 */
export class Converter<
  TPlugins extends Record<
    string,
    Plugin<object | undefined>
  >,
  TPluginIDs extends Extract<keyof TPlugins, string>,
> {
  plugins: TPlugins;
  converterOption: Required<ConverterOption>;
  private logger: Logger;
  private onEndConvertFunction?: ConverterEndConvertFunctionHandler<TPlugins>;
  private onEndPluginConvert?: ConverterEndPluginConvertHandler<TPlugins>;

  /**
   * Converterインスタンスを構築します
   *
   * @param {TPlugins} plugins - 使用するプラグイン
   * @param {Object} [options]
   * @param {Object} [options.pluginOptions] - 各プラグインのオプション
   * @param {Object} [options.extendConvertFunctions] - 各プラグインの変換関数を拡張するための関数
   * @param {ConverterOption} [options.converterOption] - Converter本体のオプション
   * @param {ConverterEndConvertFunctionHandler<TPlugins>} [options.onEndConvertFunction] - Converter.convertでプラグインのConvertFunctionが実行されたあとに呼び出されるコールバック関数
   * @param {ConverterEndPluginConvertHandler<TPlugins>} [options.onEndPluginConvert] - Converter.convertでプラグインでの変換が成功または失敗したあとに呼び出されるコールバック関数
   */
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
      onEndConvertFunction?: ConverterEndConvertFunctionHandler<TPlugins>;
      onEndPluginConvert?: ConverterEndPluginConvertHandler<TPlugins>;
    } = {},
  ) {
    this.logger = new Logger(
      options.converterOption?.logLevel ?? defaultConverterOption.logLevel,
    );
    this.logger.debug("Logger is initialized:", this.logger);
    this.logger.debug("Converter constructor is called:", {
      plugins,
      options,
    });
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
          const plugin = {
            defaultOption: pluginOption
              ? deepMerge(defaultOption, pluginOption)
              : defaultOption,
            convertFunctions: extendConvertFunction?.(convertFunctions) ??
              convertFunctions,
          };
          tempPlugins[name as TPluginIDs] = plugin;
          this.logger.debug(`Plugin "${name}" is loaded.`, plugin);
        } else {
          const plugin = {
            convertFunctions: (extendConvertFunction?.(convertFunctions) ??
              convertFunctions) as PluginConvertFunction<undefined>[],
          };
          tempPlugins[name as TPluginIDs] = plugin;
          this.logger.debug(`Plugin "${name}" is loaded.`, plugin);
        }
      },
    );
    this.plugins = tempPlugins as TPlugins;
    this.logger.debug("Plugins are loaded:", this.plugins);
    this.converterOption = {
      ...defaultConverterOption,
      ...options.converterOption,
    };
    this.logger.debug("ConverterOption is initialized:", this.converterOption);
    this.onEndConvertFunction = options.onEndConvertFunction;
    this.logger.debug(
      "EndConvertFunction is initialized:",
      this.onEndConvertFunction,
    );
    this.onEndPluginConvert = options.onEndPluginConvert;
    this.logger.debug(
      "EndPluginConvert is initialized:",
      this.onEndPluginConvert,
    );
  }

  /**
   * 指定されたプラグインを使用してテキストを変換します
   *
   * @template TUsingPlugins - 変換に使用するプラグインのタプル
   * @param {string} text - 変換するテキスト
   * @param {TUsingPlugins} usingPlugins - 変換に使用するプラグイン
   * @returns {Promise<ConverterConvertResult<TPlugins, TUsingPlugins>>} - 変換の結果
   * @throws {Error} - プラグインが見つからない場合や変換に失敗した場合にエラーをスローします
   */
  async convert<
    TUsingPlugins extends ConverterConvertUsingPlugin<TPlugins>[],
  >(
    text: string,
    usingPlugins: TUsingPlugins,
  ): Promise<
    ConverterConvertResult<TPlugins, TUsingPlugins>
  > {
    this.logger.debug("convert is called:", {
      text,
      usingPlugins,
    }, this);
    let convertedText = text;
    const details: Array<
      ConverterConvertResultDetail<
        TPlugins,
        TPluginIDs
      >
    > = [];
    for await (
      const [usingPluginsIndexString, usingPlugin] of Object.entries(
        usingPlugins,
      )
    ) {
      const usingPluginsIndex = Number(usingPluginsIndexString);
      const { name, option } = typeof usingPlugin === "string"
        ? { name: usingPlugin, option: undefined }
        : usingPlugin;
      const plugin: TPlugins[typeof name] | undefined = this.plugins[name];
      this.logger.debug(`using plugin: "${name}"`, {
        option,
        plugin,
      });
      if (!plugin) {
        if (this.converterOption.interruptWithPluginError) {
          throw new Error(`Plugin "${name}" is not found.`);
        }
        this.logger.warn(`Plugin "${name}" is not found.`);
        break;
      }
      const mergedOption = plugin.defaultOption
        ? deepMerge(
          plugin.defaultOption,
          option ?? {},
        )
        : {};
      this.logger.debug("merged option:", {
        option,
        mergedOption,
      });
      const detail = {
        ok: false,
        order: {
          name,
          option: plugin.defaultOption ? mergedOption : undefined,
        },
        convertedText,
      } as ConverterConvertResultDetail<
        TPlugins,
        TPluginIDs
      >;
      for await (
        const [convertFunctionIndexString, convertFunction] of Object.entries(
          plugin.convertFunctions,
        )
      ) {
        const convertFunctionIndex = Number(convertFunctionIndexString);
        try {
          this.logger.debug(
            `try convert function index: ${convertFunctionIndex}`,
            {
              convertFunction,
              mergedOption,
              convertedText,
            },
          );
          convertedText = await convertFunction(
            convertedText,
            mergedOption,
          );
          detail.ok = true;
          detail.convertedText = convertedText;
          this.logger.debug("convert function succeeded:", {
            convertFunction,
            mergedOption,
            convertedText,
          });
          break;
        } catch (error) {
          this.logger.error(
            makeFailedToConvertFunctionError(name, convertFunctionIndex, error)
              .message,
            error,
          );
          detail.errors ??= [];
          detail.errors.push(error);
        } finally {
          this.onEndConvertFunction?.(
            structuredClone(detail),
            usingPluginsIndex,
            convertFunctionIndex,
          );
        }
      }
      details.push(detail);
      this.onEndPluginConvert?.(detail, usingPluginsIndex);
      if (this.converterOption.interruptWithPluginError) {
        throw makeFailedToAllConvertFunctionError(name, detail.errors!);
      }
    }
    const result = {
      text: convertedText,
      details: details as ConverterConvertResult<
        TPlugins,
        TUsingPlugins
      >["details"],
    };
    this.logger.debug("convert result:", result);
    return result;
  }
}
