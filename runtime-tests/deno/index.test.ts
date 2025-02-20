import {
  Converter,
  type ConverterConvertResult,
  type ConverterEndConvertFunctionHandler,
  type Plugin,
} from "@submarin-converter/core";
import { assertEquals, assertInstanceOf } from "@std/assert";
import cjp from "@submarin-converter/plugin-cjp";
import genhera from "@submarin-converter/plugin-genhera";
import cjpDynamic from "@submarin-converter/plugin-cjp/dynamic";
import genheraDynamic from "@submarin-converter/plugin-genhera/dynamic";

Deno.test("single convert", async () => {
  const double: Plugin<undefined> = {
    convertFunctions: [(text) => text + text],
  };
  const converter = new Converter({
    double,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", ["double"]);
  assertEquals(text, "TestTest");
  assertEquals(results.length, 1);
  assertEquals(results[0].ok, true);
});

Deno.test("option convert", async () => {
  const suffix: Plugin<{ suffix: string }> = {
    defaultOption: { suffix: "" },
    convertFunctions: [(text, option) => text + option.suffix],
  };
  const converter = new Converter({
    suffix,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", [{
    name: "suffix",
    option: { suffix: "Foo" },
  }]);
  assertEquals(text, "TestFoo");
  assertEquals(results.length, 1);
  assertEquals(results[0].ok, true);
});

Deno.test("fallback convert function", async () => {
  const prefix: Plugin<{ prefix: string }> = {
    defaultOption: { prefix: "" },
    convertFunctions: [() => {
      throw new Error("Foo");
    }, (text, { prefix }) => prefix + text],
  };
  const converter = new Converter({
    prefix,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", [{
    name: "prefix",
    option: { prefix: "Foo" },
  }]);
  assertEquals(text, "FooTest");
  assertEquals(results.length, 1);
  assertEquals(results[0].ok, true);
  assertInstanceOf(results[0].errors?.at(0), Error);
});

Deno.test("failed convert", async () => {
  const error: Plugin<undefined> = {
    convertFunctions: [() => {
      throw new Error("Foo");
    }],
  };
  const converter = new Converter({
    error,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", ["error"]);
  assertEquals(text, "Test");
  assertEquals(results.length, 1);
  assertEquals(results[0].ok, false);
  assertInstanceOf(results[0].errors?.at(0), Error);
});

Deno.test("async convert", async () => {
  const sleep: Plugin<{ time: number }> = {
    defaultOption: { time: 0 },
    convertFunctions: [
      async (text, { time }) => {
        await new Promise((resolve) => setTimeout(resolve, time));
        return text;
      },
    ],
  };
  const converter = new Converter({
    sleep,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", [{
    name: "sleep",
    option: { time: 500 },
  }]);
  assertEquals(text, "Test");
  assertEquals(results.length, 1);
  assertEquals(results[0].ok, true);
});

Deno.test("callback", async () => {
  const double: Plugin<undefined> = {
    convertFunctions: [(text) => text + text],
  };
  const suffix: Plugin<{ suffix: string }> = {
    defaultOption: { suffix: "" },
    convertFunctions: [(text, option) => text + option.suffix],
  };
  const prefix: Plugin<{ prefix: string }> = {
    defaultOption: { prefix: "" },
    convertFunctions: [() => {
      throw new Error("Foo");
    }, (text, { prefix }) => prefix + text],
  };
  const plugins = {
    double,
    suffix,
    prefix,
  };
  const endConvertFunctionResults: ConverterConvertResult<
    typeof plugins
  >[] = [];
  const endConvertFunctionIndices: [number, number][] = [];
  const handleEndConvertFunction: ConverterEndConvertFunctionHandler<
    typeof plugins
  > = (detail, usingPluginsIndex, convertFunctionIndex) => {
    endConvertFunctionResults.push(detail);
    endConvertFunctionIndices.push([usingPluginsIndex, convertFunctionIndex]);
  };
  const endPluginConvertResults: ConverterConvertResult<
    typeof plugins
  >[] = [];
  const endPluginConvertIndices: number[] = [];
  const onEndPluginConvert: (
    detail: ConverterConvertResult<typeof plugins>,
    usingPluginsIndex: number,
  ) => void = (detail, usingPluginsIndex) => {
    endPluginConvertResults.push(detail);
    endPluginConvertIndices.push(usingPluginsIndex);
  };
  const converter = new Converter(plugins, {
    converterOption: { logLevel: "debug" },
    onEndConvertFunction: handleEndConvertFunction,
    onEndPluginConvert,
  });
  const { text, results } = await converter.convert("Test", [
    "double",
    {
      name: "prefix",
      option: { prefix: "Foo" },
    },
    {
      name: "suffix",
      option: { suffix: "Bar" },
    },
  ]);
  assertEquals(text, "FooTestTestBar");
  assertEquals(results.map(({ ok }) => ok), [true, true, true]);
  assertInstanceOf(results[1].errors?.at(0), Error);

  assertEquals(endConvertFunctionResults.map(({ ok }) => ok), [
    true,
    false,
    true,
    true,
  ]);
  assertEquals(endConvertFunctionIndices, [[0, 0], [1, 0], [1, 1], [2, 0]]);
  assertInstanceOf(endConvertFunctionResults[1].errors?.at(0), Error);
  assertInstanceOf(endConvertFunctionResults[2].errors?.at(0), Error);

  assertEquals(endPluginConvertResults, results);
  assertEquals(endPluginConvertIndices, [0, 1, 2]);
});

Deno.test("module plugin convert", async () => {
  const converter = new Converter({
    cjp,
    genhera,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert(
    "こんにちは。",
    [
      "cjp",
      "genhera",
    ] as const,
  );

  assertEquals(text, "ごんにさゎ。。。");
  assertEquals(results.map(({ ok }) => ok), [true, true]);
});

Deno.test("dynamic module plugin convert", async () => {
  const converter = new Converter({
    cjpDynamic,
    genheraDynamic,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert(
    "こんにちは。",
    [
      "cjpDynamic",
      "genheraDynamic",
    ] as const,
  );

  assertEquals(text, "ごんにさゎ。。。");
  assertEquals(results.map(({ ok }) => ok), [true, true]);
});

Deno.test("multiple plugins convert", async () => {
  const double: Plugin<undefined> = {
    convertFunctions: [(text) => text + text],
  };
  const suffix: Plugin<{ suffix: string }> = {
    defaultOption: { suffix: "" },
    convertFunctions: [(text, option) => text + option.suffix],
  };
  const prefix: Plugin<{ prefix: string }> = {
    defaultOption: { prefix: "" },
    convertFunctions: [() => {
      throw new Error("Foo");
    }, (text, { prefix }) => prefix + text],
  };
  const error: Plugin<undefined> = {
    convertFunctions: [() => {
      throw new Error("Foo");
    }],
  };
  const sleep: Plugin<{ time: number }> = {
    defaultOption: { time: 0 },
    convertFunctions: [
      async (text, { time }) => {
        await new Promise((resolve) => setTimeout(resolve, time));
        return text;
      },
    ],
  };
  const converter = new Converter({
    double,
    suffix,
    prefix,
    error,
    sleep,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert(
    "Test",
    [
      {
        name: "suffix",
        option: { suffix: "Foo" },
      },
      "double",
      {
        name: "suffix",
        option: { suffix: "Bar" },
      },
      "error",
      {
        name: "prefix",
        option: { prefix: "Baz" },
      },
      {
        name: "sleep",
        option: { time: 500 },
      },
    ] as const,
  );
  assertEquals(text, "BazTestFooTestFooBar");
  assertEquals(results.map(({ ok }) => ok), [
    true,
    true,
    true,
    false,
    true,
    true,
  ]);
  assertInstanceOf(results[3].errors?.at(0), Error);
  assertInstanceOf(results[4].errors?.at(0), Error);
});

Deno.test("context", async () => {
  const pluginNames: Plugin<undefined> = {
    convertFunctions: [
      (_text, _option, context) =>
        Object.keys(context.plugins ?? {}).sort().join(","),
    ],
  };
  const suffix: Plugin<{ suffix: string }> = {
    defaultOption: { suffix: "" },
    convertFunctions: [
      (_text, option, context) =>
        String(context.currentResults.at(-1)?.ok) + option.suffix,
    ],
  };
  const converter = new Converter({
    pluginNames,
    suffix,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", [
    "pluginNames",
    {
      name: "suffix",
      option: { suffix: "Foo" },
    },
  ]);
  assertEquals(
    text,
    "trueFoo",
  );
  assertEquals(results.length, 2);
  assertEquals(results[0].ok, true);
  assertEquals(
    results[0].convertedText,
    Object.keys(converter.plugins).sort().join(","),
  );
  assertEquals(results[1].ok, true);
});
