import { expandGlob } from "@std/fs/expand-glob";
import rootDenoJson from "../deno.json" with { type: "json" };
import { relative } from "@std/path";

console.log("root version:", rootDenoJson.version);

for await (const file of expandGlob("packages/*/deno.json")) {
  const relativePath = relative(Deno.cwd(), file.path);
  const { default: moduleDenoJson } = await import(file.path, {
    with: { type: "json" },
  }) as { default: { version: string } };
  moduleDenoJson.version = rootDenoJson.version;
  await Deno.writeTextFile(file.path, JSON.stringify(moduleDenoJson, null, 2));
  console.log(`${relativePath} version updated to:`, rootDenoJson.version);
  const command = new Deno.Command(Deno.execPath(), {
    args: ["fmt", file.path],
  });
  await command.output();
  console.log(`${relativePath} formatted`);
}
