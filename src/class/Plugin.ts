import type { Promisable } from "type-fest"

export interface PluginConvertFunctionArgs<T = unknown> {
  input: string
  option?: T
}
export type PluginConvertFunction<TOption = unknown> = (
  args: PluginConvertFunctionArgs<TOption>
) => Promisable<string>

export interface PluginMetaData {
  name?: string
  description?: string
}

export interface PluginConfig<TOption = unknown> {
  convertFunction: PluginConvertFunction<TOption>[]
  metaData?: PluginMetaData
}

export interface PluginConvertResult {
  ok: boolean
  output: string
  error: unknown[]
}

export class Plugin<TOption = unknown> {
  #convertFunction: PluginConvertFunction<TOption>[]

  #metaData: PluginMetaData

  constructor(config: PluginConfig<TOption>) {
    this.#convertFunction = config.convertFunction
    this.#metaData = config.metaData ?? {}
  }

  get metaData() {
    return this.#metaData
  }

  async convert(args: PluginConvertFunctionArgs<TOption>) {
    return this.#convertFunction.reduce<Promise<PluginConvertResult>>(
      async (acc, func) => {
        const awaitedAcc = await acc
        if (awaitedAcc.ok) return awaitedAcc
        try {
          const output = await func(args)
          return {
            ok: true,
            output,
            error: [...awaitedAcc.error],
          }
        } catch (error) {
          return {
            ...awaitedAcc,
            error: [...awaitedAcc.error, error],
          }
        }
      },
      Promise.resolve({
        ok: false,
        output: "",
        error: [],
      })
    )
  }
}
