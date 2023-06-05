import type { PluginConvertFunctionArgs, Plugin } from "./Plugin"
import type { ValueOf } from "type-fest"

export type Plugins<T = unknown> = Record<string, Plugin<T>>

export type ConvertOption<TPlugins extends Plugins> = ValueOf<{
  [Id in keyof TPlugins]: {
    id: Extract<Id, string>
    option?: TPlugins[Id] extends Plugin<infer R> ? R : never
  }
}>

export interface ConverterConfig<TPlugins extends Readonly<Plugins>> {
  plugins: TPlugins
}

export type ConverterResultDetail<TConvertOption extends ConvertOption<Plugins>> = {
  id: TConvertOption["id"]
  args: PluginConvertFunctionArgs<TConvertOption["option"]>
  error: unknown[]
} & (
  | {
      ok: true
      output: string
    }
  | {
      ok: false
    }
)

export type ConverterResultDetails<TConvertOptions extends readonly ConvertOption<Plugins>[]> = {
  [Index in keyof TConvertOptions]: ConverterResultDetail<TConvertOptions[Index]>
}

export type ConverterResult<TConvertOptions extends readonly ConvertOption<Plugins>[]> = [
  string,
  ConverterResultDetails<TConvertOptions>
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Converter<TPlugins extends Readonly<Plugins<any>>> {
  #plugins: TPlugins

  constructor(config: ConverterConfig<TPlugins>) {
    this.#plugins = config.plugins
  }

  async convert<TConvertOptions extends readonly ConvertOption<TPlugins>[]>(
    input: string,
    options: TConvertOptions
  ): Promise<ConverterResult<TConvertOptions>> {
    const results: ConverterResult<readonly ConvertOption<Plugins>[]> = await options.reduce<
      Promise<ConverterResult<readonly ConvertOption<Plugins>[]>>
    >(async (acc, { id, option }) => {
      const [prevOutput, prevDetails] = await acc
      try {
        const plugin = this.#plugins[id]
        if (!plugin) throw new TypeError(`The plugin '${String(id)}' was not found.`)
        const { ok, error, output } = await plugin.convert({ input: prevOutput, option })
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        if (!ok) throw error
        return [
          output,
          [
            ...prevDetails,
            {
              id,
              ok,
              error,
              output,
              args: {
                input: prevOutput,
                option,
              },
            },
          ],
        ]
      } catch (error) {
        return [
          prevOutput,
          [
            ...prevDetails,
            {
              id,
              ok: false,
              error: Array.isArray(error) ? error : [error],
              args: {
                input: prevOutput,
                option,
              },
            },
          ],
        ]
      }
    }, Promise.resolve([input, []]))
    return results as ConverterResult<TConvertOptions>
  }
}
