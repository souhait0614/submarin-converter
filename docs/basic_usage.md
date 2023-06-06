# 基本的な使い方

`Converter`にプラグインを設定してください。

プラグインは[submarin-converter-plugin-cjp](https://github.com/souhait0614/submarin-converter-plugin-cjp)などの公開されているモジュールを使用するか、`Plugin`を使って自作できます。

`plugins`オブジェクトのキーは後述するオーダーで使用するIDになります。
<!-- TODO: あとで公開プラグイン一覧を作成してここにリンクを貼る -->

```typescript
import { Converter, Plugin } from 'submarin-converter';
import { cjpPlugin } from 'submarin-converter-plugin-cjp';

import type { ConvertFunction } from 'submarin-converter';

const upperCase: ConvertFunction = ({ input }) => input.toUpperCase();

const converter = new Converter({
  plugins: {
    cjp: cjpPlugin,
    upperCase: new Plugin({ convertFunction: [upperCase] }),
  } as const,
});
```

変換したい文字列と変換順を決めるオーダーを`Converter.convert()`に指定して変換を行います。

オーダーは配列で指定し、変換したい文字列を一番目のプラグインが変換し、変換結果を二番目のプラグインが変換……と連鎖しながら変換します。

`Converter.convert()`の返り値として変換後の文字列と変換の詳細な結果が取得できます。

```typescript
import type { ConvertOrder } from 'submarin-converter';

// ~~省略~~

const input = "Submarin.onlineは分散マイクロブログSNSです。新規登録開放中！"

const orders = [
  { id: "upperCase" },
  { id: "cjp" },
] as const satisfies readonly ConvertOrder<typeof converter{"plugins"}>[]

const [output, details] = await converter.convert(input, orders)

console.log(output) // "SUBMARIN.ON微信は分散マ亻ケロブロゲSNSてず。新规登录开放中！"
console.log(details) // 変換の詳細結果
```

オーダーを指定する際、オプションを指定することができます。

オプションの有無や指定方法はプラグインによって異なります。

```typescript
import { Converter, Plugin } from "submarin-converter"

import type { ConvertFunction } from "submarin-converter"

const prefix: ConvertFunction<{ prefix: string }> = ({ input, option }) =>
  `${option?.prefix ?? ""}${input}`

const converter = new Converter({
  plugins: {
    prefix: new Plugin({ convertFunction: [prefix] }),
  } as const,
})

const input = "subway"

const orders = [
  {
    id: "prefix",
    option: {
      prefix: "hi",
    },
  },
] as const satisfies readonly ConvertOrder<typeof converter{"plugins"}>[]

const [output] = await converter.convert(input, orders)

console.log(output) // "hisubway"
```
