import type { ConvertFunctionArgs, Plugin } from "./Plugin"
import type { ValueOf } from "type-fest"

export type Plugins<T = unknown> = Record<string, Plugin<T>>

export type ConvertOptionObject<TPlugins extends Plugins> = {
  [Id in keyof TPlugins]: {
    id: Extract<Id, string>
    option?: TPlugins[Id] extends Plugin<infer R> ? R : never
  }
}

export type ConvertOption<TPlugins extends Plugins> = ValueOf<ConvertOptionObject<TPlugins>>

export interface ConverterConfig<TPlugins extends Readonly<Plugins>> {
  plugins: TPlugins
}

export type ConverterResultDetail = {
  id: string
  args: ConvertFunctionArgs
} & (
  | {
      ok: true
      output: string
    }
  | {
      ok: false
      error: unknown[]
    }
)

export type ConverterResultDetails<TConvertOptions extends readonly ConvertOption<Plugins>[]> = {
  [Index in keyof TConvertOptions]: ConverterResultDetail
}

export type ConverterResult = [string, ConverterResultDetail[]]

export class Converter<TPlugins extends Readonly<Plugins<any>>> {
  #plugins: TPlugins

  constructor(config: ConverterConfig<TPlugins>) {
    this.#plugins = config.plugins
  }

  async convert<TConvertOptions extends readonly ConvertOption<TPlugins>[]>(
    input: string,
    options: TConvertOptions
  ): Promise<ConverterResult> {
    return options.reduce<Promise<ConverterResult>>(async (acc, { id, option }) => {
      const [prevOutput, prevDetails] = await acc
      try {
        const plugin = this.#plugins[id]
        if (!plugin) throw new TypeError(`The plugin '${String(id)}' was not found.`)
        const output = await plugin.convert({ input: prevOutput, option })
        return [
          output,
          [
            ...prevDetails,
            {
              id,
              ok: true,
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
          input,
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
  }
}
