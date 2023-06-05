import { describe, expect, it } from "vitest"

import {
  PluginConvertFunctionArgs,
  Converter,
  Plugin,
  PluginConvertFunction,
  ConverterResultDetails,
  ConverterResultDetail,
  Plugins,
  ConvertOption,
} from "../src"

const upperCase: PluginConvertFunction = ({ input }) => input.toUpperCase()
const x4: PluginConvertFunction<{
  target: `${string}`
}> = ({
  input,
  option = {
    target: "O",
  },
}) => input.replace(new RegExp(option.target, "g"), Array(4).fill(option.target).join(""))
const amazingProcessing: PluginConvertFunction = ({ input }) =>
  new Promise<void>((r) => setTimeout(() => r(), 1000)).then(() => `${input.length}`)

const dummyError = new Error("dummy error")
const error = () => {
  throw dummyError
}

describe("Converter", () => {
  it.concurrent("Normal Convert", async () => {
    const plugins = {
      upc: new Plugin({ convertFunction: [upperCase] }),
      x4: new Plugin({ convertFunction: [x4] }),
      amg: new Plugin({ convertFunction: [amazingProcessing] }),
    } as const satisfies Plugins<any>
    const converter = new Converter({
      plugins,
    })

    const input = "subway"
    const expectedOutput = "9"

    const options = [
      { id: "upc" },
      {
        id: "x4",
        option: {
          target: "A",
        },
      },
      { id: "amg" },
    ] as const satisfies readonly ConvertOption<typeof plugins>[]
    const expectedDetails: ConverterResultDetails<typeof options> = [
      {
        id: "upc",
        ok: true,
        output: "SUBWAY",
        args: {
          input: "subway",
        },
        error: [],
      },
      {
        id: "x4",
        ok: true,
        output: "SUBWAAAAY",
        args: {
          input: "SUBWAY",
          option: {
            target: "A",
          },
        },
        error: [],
      },
      {
        id: "amg",
        ok: true,
        output: "9",
        args: {
          input: "SUBWAAAAY",
        },
        error: [],
      },
    ]

    const [output, details] = await converter.convert(input, options)

    expect(output).toEqual(expectedOutput)
    expect(details).toEqual(expectedDetails)
  })

  it.concurrent("Fallback Convert", async () => {
    const plugins = {
      upc: new Plugin({ convertFunction: [error, upperCase] }),
      x4: new Plugin({ convertFunction: [error] }),
      amg: new Plugin({ convertFunction: [amazingProcessing, error] }),
    } as const satisfies Plugins<any>
    const converter = new Converter({
      plugins,
    })

    const input = "subway"
    const expectedOutput = "6"

    const options = [
      { id: "upc" },
      {
        id: "x4",
        option: {
          target: "A",
        },
      },
      { id: "amg" },
    ] as const satisfies readonly ConvertOption<typeof plugins>[]
    const expectedDetails: ConverterResultDetails<typeof options> = [
      {
        id: "upc",
        ok: true,
        output: "SUBWAY",
        args: {
          input: "subway",
        },
        error: [dummyError],
      },
      {
        id: "x4",
        ok: false,
        args: {
          input: "SUBWAY",
          option: {
            target: "A",
          },
        },
        error: [dummyError],
      },
      {
        id: "amg",
        ok: true,
        output: "6",
        args: {
          input: "SUBWAY",
        },
        error: [],
      },
    ]

    const [output, details] = await converter.convert(input, options)

    expect(output).toEqual(expectedOutput)
    expect(details).toEqual(expectedDetails)
  })
})
