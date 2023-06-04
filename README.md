# submarin-converter

![npm](https://img.shields.io/npm/v/submarin-converter?style=flat-square)

文書変換するやつ

## Example

```typescript
const exampleConverter1 = ({ input, option = 1 }: PluginConvertFunctionArgs<number>) =>
  [...Array(option - 1)].reduce<string>((prev) => `${prev} ${input}`, input)
const exampleConverter2 = ({ input, option = "" }: PluginConvertFunctionArgs<string>) =>
  `${input} ${option}`

const source = "very"

const converter = new Converter({
  plugins: {
    example1: new Plugin({ convertFunction: [exampleOptionConverter1] }),
    example2: new Plugin({ convertFunction: [exampleOptionConverter2] }),
  } as const,
})

const [result] = await converter.convert(source, [
  { id: "example1", option: 5 },
  { id: "example2", option: "cool library." },
])

console.log(result) // "very very very very very cool library."
```

## Installation

```shell
npm install submarin-converter
# or yarn add submarin-converter-core-v2
# or pnpm add submarin-converter-core-v2
```

## Docs

あとでなんとかします

## Development

```shell
git clone https://github.com/souhait0614/submarin-converter.git
cd submarin-converter
pnpm i
pnpm test
```
