import { Converter, type Plugin } from "../src/index.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";

Deno.test("single convert", async () => {
  const double: Plugin<undefined> = {
    convertFunctions: [(text) => text + text],
  };
  const converter = new Converter({
    double,
  });
  const { text, details } = await converter.convert("Test", ["double"]);
  assertEquals(text, "TestTest");
  assertEquals(details[0].ok, true);
});

Deno.test("option convert", async () => {
  const suffix: Plugin<{ suffix: string }> = {
    defaultOption: { suffix: "" },
    convertFunctions: [(text, option) => text + option.suffix],
  };
  const converter = new Converter({
    suffix,
  });
  const { text, details } = await converter.convert("Test", [{
    name: "suffix",
    option: { suffix: "Foo" },
  }]);
  assertEquals(text, "TestFoo");
  assertEquals(details[0].ok, true);
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
  });
  const { text, details } = await converter.convert("Test", [{
    name: "prefix",
    option: { prefix: "Foo" },
  }]);
  assertEquals(text, "FooTest");
  assertEquals(details[0].ok, true);
  assertInstanceOf(details[0].errors?.at(0), Error);
});

Deno.test("failed convert", async () => {
  const error: Plugin<undefined> = {
    convertFunctions: [() => {
      throw new Error("Foo");
    }],
  };
  const converter = new Converter({
    error,
  });
  const { text, details } = await converter.convert("Test", ["error"]);
  assertEquals(text, "Test");
  assertEquals(details[0].ok, false);
  assertInstanceOf(details[0].errors?.at(0), Error);
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
  });
  const { text, details } = await converter.convert("Test", [{
    name: "sleep",
    option: { time: 500 },
  }]);
  assertEquals(text, "Test");
  assertEquals(details[0].ok, true);
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
  });
  const { text, details } = await converter.convert(
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
  assertEquals(details[0].ok, true);
  assertEquals(details[1].ok, true);
  assertEquals(details[2].ok, true);
  assertEquals(details[3].ok, false);
  assertInstanceOf(details[3].errors?.at(0), Error);
  assertEquals(details[4].ok, true);
  assertInstanceOf(details[4].errors?.at(0), Error);
  assertEquals(details[5].ok, true);
});
