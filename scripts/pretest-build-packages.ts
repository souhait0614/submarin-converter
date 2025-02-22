import { resolve } from "@std/path/posix";
import { build, emptyDir } from "@deno/dnt";

const baseOutDir = resolve(Deno.cwd(), "./built-packages");

await emptyDir(baseOutDir);

interface Package {
  name: string;
  exports: Record<string, string>;
}

const packages = [
  {
    name: "core",
    exports: {
      ".": "./src/index.ts",
    },
  },
  {
    name: "plugin-cjp",
    exports: {
      ".": "./src/index.ts",
      "./dynamic": "./src/dynamic.ts",
    },
  },
  {
    name: "plugin-genhera",
    exports: {
      ".": "./src/index.ts",
      "./dynamic": "./src/dynamic.ts",
    },
  },
  {
    name: "plugin-nomlish",
    exports: {
      ".": "./src/index.ts",
    },
  },
] as const satisfies Package[];

for await (const pkg of packages) {
  console.log(`START build ${pkg.name}`);
  await build({
    entryPoints: Object.entries(pkg.exports).map(([name, path]) => ({
      name,
      path: resolve(`./packages/${pkg.name}`, path),
    })),
    outDir: resolve(baseOutDir, `./${pkg.name}`),
    shims: {
      deno: true,
    },
    importMap: `./packages/${pkg.name}/deno.json`,
    test: false,
    typeCheck: false,
    package: {
      name: `@submarin-converter/${pkg.name}`,
      version: "0.0.0",
    },
  });
  console.log(`END build ${pkg.name}\n`);
}
