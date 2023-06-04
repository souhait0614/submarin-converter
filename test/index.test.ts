import { describe, expect, it } from "vitest"

import { ConvertFunctionArgs, Converter, Plugin } from "../src"

const exampleConverter1 = ({ input }: ConvertFunctionArgs) => input.toUpperCase()
const exampleConverter2 = ({ input }: ConvertFunctionArgs) => input.replace(/O/g, "OOOOO")

const dummyError = new Error("dummy error")
const errorConverter = () => {
  throw dummyError
}

describe("Converter", () => {
  it("NormalConvert", async () => {
    const input = "This is a very cool library."

    const converter = new Converter({
      plugins: {
        example1: new Plugin({ convertFunction: [exampleConverter1] }),
        example2: new Plugin({ convertFunction: [exampleConverter2] }),
      },
    })

    const [result, detail] = await converter.convert(input, [
      {
        id: "example1",
      },
      {
        id: "example2",
      },
    ])

    detail[0].id

    expect(result).toEqual("THIS IS A VERY COOOOOOOOOOL LIBRARY.")
  })
  it("ConvertError", async () => {
    const errorConverter = () => {
      throw dummyError
    }

    const source = "This is a very cool library."

    const converter = new Converter({
      plugins: {
        example1: new Plugin({ convertFunction: [errorConverter] }),
        example2: new Plugin({ convertFunction: [exampleConverter2] }),
      },
    })

    const [result, [example1Detail]] = await converter.convert(source, [
      { id: "example1" },
      { id: "example2" },
    ])

    expect(result).toEqual(source)
    expect(example1Detail.ok).toEqual(false)
    expect(example1Detail.error).toEqual([dummyError])
  })
  it("FallbackConvert", async () => {
    const source = "This is a very cool library."

    const converter = new Converter({
      plugins: {
        example1: new Plugin({ convertFunction: [errorConverter, exampleConverter1] }),
        example2: new Plugin({ convertFunction: [exampleConverter2] }),
      },
    })

    const [result, [example1Detail]] = await converter.convert(source, [
      { id: "example1" },
      { id: "example2" },
    ])

    expect(result).toEqual("THIS IS A VERY COOOOOOOOOOL LIBRARY.")
    expect(example1Detail.ok).toEqual(true)
    expect(example1Detail.error).toEqual([dummyError])
  })
  it("ConvertOption", async () => {
    const exampleOptionConverter1 = ({ input, option }: ConvertFunctionArgs<string>) =>
      input + option
    const exampleOptionConverter2 = ({ input, option = 1 }: ConvertFunctionArgs<number>) =>
      [...Array(option - 1)].reduce<string>((prev) => prev + input, input)

    const source = "very "

    const converter = new Converter({
      plugins: {
        example1: new Plugin({ convertFunction: [exampleOptionConverter1] }),
        example2: new Plugin({ convertFunction: [exampleOptionConverter2] }),
      } as const,
    })

    const [result] = await converter.convert(source, [
      { id: "example2", option: 5 },
      { id: "example1", option: "cool library." },
    ])

    expect(result).toEqual("very very very very very cool library.")
  })
})
