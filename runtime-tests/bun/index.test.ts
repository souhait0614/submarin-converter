import {
  Converter,
  type ConverterConvertResult,
  type ConverterEndConvertFunctionHandler,
  type Plugin,
} from "../../built-packages/core/esm/index";
import cjp from "../../built-packages/plugin-cjp/esm/index";
import genhera from "../../built-packages/plugin-genhera/esm/index";
import cjpDynamic from "../../built-packages/plugin-cjp/esm/dynamic";
import genheraDynamic from "../../built-packages/plugin-genhera/esm/dynamic";
import { assert, test } from "vitest";

test("single convert", async () => {
  const double: Plugin<undefined> = {
    convertFunctions: [(text) => text + text],
  };
  const converter = new Converter({
    double,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", ["double"]);
  assert.deepEqual(text, "TestTest");
  assert.deepEqual(results.length, 1);
  assert.deepEqual(results[0].ok, true);
});

test("option convert", async () => {
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
  assert.deepEqual(text, "TestFoo");
  assert.deepEqual(results.length, 1);
  assert.deepEqual(results[0].ok, true);
});

test("fallback convert function", async () => {
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
  assert.deepEqual(text, "FooTest");
  assert.deepEqual(results.length, 1);
  assert.deepEqual(results[0].ok, true);
  assert.instanceOf(results[0].errors?.at(0), Error);
});

test("failed convert", async () => {
  const error: Plugin<undefined> = {
    convertFunctions: [() => {
      throw new Error("Foo");
    }],
  };
  const converter = new Converter({
    error,
  }, { converterOption: { logLevel: "debug" } });
  const { text, results } = await converter.convert("Test", ["error"]);
  assert.deepEqual(text, "Test");
  assert.deepEqual(results.length, 1);
  assert.deepEqual(results[0].ok, false);
  assert.instanceOf(results[0].errors?.at(0), Error);
});

test("async convert", async () => {
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
  assert.deepEqual(text, "Test");
  assert.deepEqual(results.length, 1);
  assert.deepEqual(results[0].ok, true);
});

test("callback", async () => {
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
  assert.deepEqual(text, "FooTestTestBar");
  assert.deepEqual(results.map(({ ok }) => ok), [true, true, true]);
  assert.instanceOf(results[1].errors?.at(0), Error);

  assert.deepEqual(endConvertFunctionResults.map(({ ok }) => ok), [
    true,
    false,
    true,
    true,
  ]);
  assert.deepEqual(endConvertFunctionIndices, [[0, 0], [1, 0], [1, 1], [2, 0]]);
  assert.instanceOf(endConvertFunctionResults[1].errors?.at(0), Error);
  assert.instanceOf(endConvertFunctionResults[2].errors?.at(0), Error);

  assert.deepEqual(endPluginConvertResults, results);
  assert.deepEqual(endPluginConvertIndices, [0, 1, 2]);
});

test("module plugin convert", async () => {
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

  assert.deepEqual(text, "ごんにさゎ。。。");
  assert.deepEqual(results.map(({ ok }) => ok), [true, true]);
});

test("dynamic module plugin convert", async () => {
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

  assert.deepEqual(text, "ごんにさゎ。。。");
  assert.deepEqual(results.map(({ ok }) => ok), [true, true]);
});

test("multiple plugins convert", async () => {
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
  assert.deepEqual(text, "BazTestFooTestFooBar");
  assert.deepEqual(results.map(({ ok }) => ok), [
    true,
    true,
    true,
    false,
    true,
    true,
  ]);
  assert.instanceOf(results[3].errors?.at(0), Error);
  assert.instanceOf(results[4].errors?.at(0), Error);
});

test("context", async () => {
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
  assert.deepEqual(
    text,
    "trueFoo",
  );
  assert.deepEqual(results.length, 2);
  assert.deepEqual(results[0].ok, true);
  assert.deepEqual(
    results[0].convertedText,
    Object.keys(converter.plugins).sort().join(","),
  );
  assert.deepEqual(results[1].ok, true);
});
