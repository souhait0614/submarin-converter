# submarin-converter

いい感じの型が付いたTypeScript製文字変換ライブラリ

[![GitHub License](https://img.shields.io/github/license/souhait0614/submarin-converter?style=flat-square)](/LICENSE)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/souhait0614/submarin-converter/ci.yml?branch=master&style=flat-square&label=test)](https://github.com/souhait0614/submarin-converter/actions/workflows/ci.yml)

## Packages

| name                                                                                    | version                                                                                                                              | description                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| [@submarin-converter/core](https://jsr.io/@submarin-converter/core)                     | [![core JSR](https://jsr.io/badges/@submarin-converter/core)](https://jsr.io/@submarin-converter/core)                               | submarin-converter本体     |
| [@submarin-converter/plugin-cjp](https://jsr.io/@submarin-converter/plugin-cjp)         | [![plugin-cjp JSR](https://jsr.io/badges/@submarin-converter/plugin-cjp)](https://jsr.io/@submarin-converter/plugin-cjp)             | 怪レい日本语プラグイン     |
| [@submarin-converter/plugin-genhera](https://jsr.io/@submarin-converter/plugin-genhera) | [![plugin-genhera JSR](https://jsr.io/badges/@submarin-converter/plugin-genhera)](https://jsr.io/@submarin-converter/plugin-genhera) | ﾒﾝﾍﾗっぽぃ日本語プラグイン |

## Example

### General usage

```typescript
import { Converter, type Plugin } from "@submarin-converter/core";

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

const input = "ほげ";

const output = await converter.convert(
  input,
  [
    "double",
    {
      name: "suffix",
      option: { suffix: "ふが" },
    },
  ] as const,
);
console.log(output.text); // "ほげほげふが"
```

### Using plugin libraries

```typescript
import { Converter, type Plugin } from "@submarin-converter/core";
import cjp from "@submarin-converter/plugin-cjp";
import genhera from "@submarin-converter/plugin-genhera";

const converter = new Converter({
  cjp,
  genhera,
});

const input = "こんにちは。";

const output = await converter.convert(
  input,
  [
    "cjp",
    "genhera",
  ] as const,
);
console.log(output.text); // "ごんにさゎ。。。"
```

### Convert results

```typescript
import { Converter, type Plugin } from "@submarin-converter/core";
import cjp from "@submarin-converter/plugin-cjp";
import genhera from "@submarin-converter/plugin-genhera";

const converter = new Converter({
  cjp,
  genhera,
});

const input = "こんにちは。";

const output = await converter.convert(
  input,
  [
    "cjp",
    "genhera",
  ] as const,
);
// cjp convert result
console.log(output.results[0].ok); // true
console.log(output.results[0].convertedText); // "ごんにさは。"
// genhera convert result
console.log(output.results[1].ok); // true
console.log(output.results[1].convertedText); // "ごんにさゎ。。。"
```
