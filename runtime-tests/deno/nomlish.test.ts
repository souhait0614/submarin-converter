import { assertEquals } from "@std/assert/equals";
import { Converter } from "@submarin-converter/core";
import PluginNomlish from "@submarin-converter/plugin-nomlish";
import { assertExists } from "@std/assert";

Deno.test("nomlish plugin convert", async () => {
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

  assertExists(text);
  assertEquals(results.map(({ ok }) => ok), [true]);
});
