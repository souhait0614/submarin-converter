import type { ConvertFunctionArgs, Plugin } from "./Plugin"
import type { ValueOf } from "type-fest"

export type Plugins<T = unknown> = Record<string, Plugin<T>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConvertOrder<TPlugins extends Plugins<any>> = ValueOf<{
  [Id in keyof TPlugins]: {
    id: Extract<Id, string>
    option?: TPlugins[Id] extends Plugin<infer R> ? R : never
  }
}>

export interface ConverterConfig<TPlugins extends Readonly<Plugins>> {
  plugins: TPlugins
}

export type ConvertResultDetail<TConvertOption extends ConvertOrder<Plugins>> = {
  id: TConvertOption["id"]
  args: ConvertFunctionArgs<TConvertOption["option"]>
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

export type ConvertResultDetails<TConvertOrders extends readonly ConvertOrder<Plugins>[]> = {
  [Index in keyof TConvertOrders]: ConvertResultDetail<TConvertOrders[Index]>
}

export type ConvertResult<TConvertOrders extends readonly ConvertOrder<Plugins>[]> = [
  string,
  ConvertResultDetails<TConvertOrders>
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Converter<TPlugins extends Readonly<Plugins<any>>> {
  #plugins: TPlugins

  constructor(config: ConverterConfig<TPlugins>) {
    this.#plugins = config.plugins
  }

  get plugins() {
    return this.#plugins
  }

  async convert<TConvertOrders extends readonly ConvertOrder<TPlugins>[]>(
    input: string,
    options: TConvertOrders
  ): Promise<ConvertResult<TConvertOrders>> {
    const results: ConvertResult<readonly ConvertOrder<Plugins>[]> = await options.reduce<
      Promise<ConvertResult<readonly ConvertOrder<Plugins>[]>>
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
    return results as ConvertResult<TConvertOrders>
  }
}
