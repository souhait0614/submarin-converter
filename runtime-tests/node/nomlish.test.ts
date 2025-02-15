import { Converter } from "../../built-packages/core/esm/index";
import PluginNomlish from "../../built-packages/plugin-nomlish/esm/index";
import { assert, test } from "vitest";

test("nomlish plugin convert", async () => {
  const nomlish = new PluginNomlish();
  const converter = new Converter({
    nomlish,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert(
    "吾輩は猫である。名前はまだ無い。",
    [
      "nomlish",
    ] as const,
  );

  assert.exists(text);
  assert.deepEqual(results.map(({ ok }) => ok), [true]);
});
