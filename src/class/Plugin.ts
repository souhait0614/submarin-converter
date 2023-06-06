import type { Promisable } from "type-fest"

export interface ConvertFunctionArgs<T = unknown> {
  input: string
  option?: T
}
export type ConvertFunction<TOption = unknown> = (
  args: ConvertFunctionArgs<TOption>
) => Promisable<string>

export interface PluginMetaData {
  name?: string
  description?: string
  author?: string
}

export interface PluginConfig<TOption = unknown> {
  convertFunction: ConvertFunction<TOption>[]
  metaData?: PluginMetaData
}

export type PluginConvertResult = {
  error: unknown[]
} & (
  | {
      ok: true
      output: string
    }
  | {
      ok: false
      output?: never
    }
)

export class Plugin<TOption = unknown> {
  #convertFunction: ConvertFunction<TOption>[]

  #metaData: PluginMetaData

  constructor(config: PluginConfig<TOption>) {
    this.#convertFunction = config.convertFunction
    this.#metaData = config.metaData ?? {}
  }

  get metaData() {
    return this.#metaData
  }

  async convert(args: ConvertFunctionArgs<TOption>) {
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
        error: [],
      })
    )
  }
}
