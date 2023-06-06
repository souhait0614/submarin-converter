import { describe, expect, it, test } from "vitest"

import {
  Converter,
  Plugin,
  ConvertFunction,
  ConvertResultDetails,
  Plugins,
  ConvertOrder,
} from "../src"

const upperCase: ConvertFunction = ({ input }) => input.toUpperCase()
const x4: ConvertFunction<{
  target: `${string}`
}> = ({
  input,
  option = {
    target: "O",
  },
}) => input.replace(new RegExp(option.target, "g"), Array(4).fill(option.target).join(""))
const amazingProcessing: ConvertFunction = ({ input }) =>
  new Promise<void>((r) => setTimeout(() => r(), 1000)).then(() => `${input.length}`)

const dummyError = new Error("dummy error")
const error = () => {
  throw dummyError
}

test.concurrent("Basic Usage", async () => {
  const converter = new Converter({
    plugins: {
      upperCase: new Plugin({ convertFunction: [upperCase] }),
      x4: new Plugin({ convertFunction: [x4] }),
      amazingProcessing: new Plugin({ convertFunction: [amazingProcessing] }),
    } as const,
  })

  const input = "subway"

  const [output, details] = await converter.convert(input, [
    { id: "upperCase" },
    {
      id: "x4",
      option: {
        target: "A",
      },
    },
    { id: "amazingProcessing" },
  ] as const)

  // test
  const expectedOutput = "9"
  const expectedDetails = [
    {
      id: "upperCase",
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
      id: "amazingProcessing",
      ok: true,
      output: "9",
      args: {
        input: "SUBWAAAAY",
      },
      error: [],
    },
  ]

  expect(output).toEqual(expectedOutput)
  expect(details).toEqual(expectedDetails)
})

test.concurrent("Normal Convert", async () => {
  const plugins = {
    upc: new Plugin({ convertFunction: [upperCase] }),
    x4: new Plugin({ convertFunction: [x4] }),
    amg: new Plugin({ convertFunction: [amazingProcessing] }),
  } as const satisfies Plugins<any>
  const converter = new Converter({
    plugins,
  })

  expect(converter.plugins).toEqual(plugins)

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
  ] as const satisfies readonly ConvertOrder<typeof plugins>[]
  const expectedDetails: ConvertResultDetails<typeof options> = [
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

test.concurrent("Fallback Convert", async () => {
  const plugins = {
    upc: new Plugin({ convertFunction: [error, upperCase] }),
    x4: new Plugin({ convertFunction: [error] }),
    amg: new Plugin({ convertFunction: [amazingProcessing, error] }),
  } as const satisfies Plugins<any>
  const converter = new Converter({
    plugins,
  })

  expect(converter.plugins).toEqual(plugins)

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
  ] as const satisfies readonly ConvertOrder<typeof plugins>[]
  const expectedDetails: ConvertResultDetails<typeof options> = [
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
