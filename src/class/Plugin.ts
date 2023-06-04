import type { Promisable } from "type-fest"

export interface ConvertFunctionArgs<T = unknown> {
  input: string
  option?: T
}
export type ConvertFunction<TOption = unknown> = (
  args: ConvertFunctionArgs<TOption>
) => Promisable<string>

export interface MetaData {
  name?: string
  description?: string
}

export interface PluginConfig<TOption = unknown> {
  convertFunction: ConvertFunction<TOption>[]
  metaData?: MetaData
}

export class Plugin<TOption = unknown> {
  #convertFunction: ConvertFunction<TOption>[]

  #metaData: MetaData

  constructor(config: PluginConfig<TOption>) {
    this.#convertFunction = config.convertFunction
    this.#metaData = config.metaData ?? {}
  }

  get metaData() {
    return this.#metaData
  }

  async convert(args: ConvertFunctionArgs<TOption>) {
    interface ConvertResult {
      ok: boolean
      output: string
      error: unknown[]
    }
    const result = await this.#convertFunction.reduce<Promise<ConvertResult>>(
      async (acc, func) => {
        const awaitedAcc = await acc
        if (awaitedAcc.ok) return awaitedAcc
        try {
          const output = await func(args)
          const res: ConvertResult = {
            ok: true,
            output,
            error: [...awaitedAcc.error],
          }
          return res
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
    return result
  }
}
