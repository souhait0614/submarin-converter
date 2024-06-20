# submarin-converter

いい感じの型が付いた TypeScript 製文字変換ライブラリ

<a href="/LICENSE" target="_blank">
  <img
    src="https://img.shields.io/github/license/souhait0614/submarin-converter?style=flat-square"
    alt="license"
  >
</a>
<a href="https://jsr.io/@submarin-converter/core" target="_blank">
  <img src="https://img.shields.io/jsr/v/@submarin-converter/core?style=flat-square" alt="jsr">
</a>

## Example

```typescript
import { Converter, type Plugin } from "@submarin-converter/core"
const double: Plugin<undefined> = {
  convertFunctions: [(text) => text + text],
};
const suffix: Plugin<{ suffix: string }> = {
  defaultOption: { suffix: "" },
  convertFunctions: [(text, option) => text + option.suffix],
};
const converter = new Converter({
  double,
  suffix,
});

const { text } = await converter.convert(
  "Foo",
  [
    "double",
    {
      name: "suffix",
      option: { suffix: "Bar" },
    },
  ] as const,
);

console.log(text) // "FooFooBar"
```

## Installation/Docs

see <https://jsr.io/@submarin-converter/core>

## Development

```shell
git clone https://github.com/souhait0614/submarin-converter.git
cd submarin-converter
pnpm i
pnpm test
```
