# submarin-converter

いい感じの型が付いた TypeScript 製文字変換ライブラリ

<a href="/LICENSE" target="_blank">
  <img
    src="https://img.shields.io/github/license/souhait0614/submarin-converter?style=flat-square"
    alt="license"
  >
</a>
<a href="https://www.npmjs.com/package/submarin-converter" target="_blank">
  <img src="https://img.shields.io/npm/v/submarin-converter?style=flat-square" alt="npm">
</a>
<a href="https://bundlephobia.com/package/submarin-converter" target="_blank">
  <img
    src="https://img.shields.io/bundlephobia/min/submarin-converter?style=flat-square"
    alt="npm bundle size"
  >
</a>

## Example

```typescript
import { Converter, Plugin } from "submarin-converter"
import type { ConvertFunction } from "submarin-converter"

const upperCase: ConvertFunction = ({ input }) => input.toUpperCase()
const x4: ConvertFunction<{ target: `${string}` }> = ({
  input,
  option = {
    target: "O",
  },
}) => input.replace(new RegExp(option.target, "g"), Array(4).fill(option.target).join(""))
const amazingProcessing: ConvertFunction = ({ input }) =>
  new Promise<void>((r) => setTimeout(() => r(), 1000)).then(() => `${input.length}`)

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

console.log(output) // "9"
console.log(details)
/*
[
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
*/
```

## Installation

```shell
npm install submarin-converter
# or yarn add submarin-converter
# or pnpm add submarin-converter
```

## [Docs](/docs/index.md)

- [基本的な使い方](/docs/basic_usage.md)

## Development

```shell
git clone https://github.com/souhait0614/submarin-converter.git
cd submarin-converter
pnpm i
pnpm test
```
