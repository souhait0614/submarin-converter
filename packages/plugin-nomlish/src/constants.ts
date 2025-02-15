import type { PluginMetaData } from "@submarin-converter/core";

export const metaData = {
  displayName: "ノムリッシュ翻訳",
  description: "日本語を最終にして究極の幻想風の日本語に変換します",
  homepage: [
    "https://github.com/souhait0614/nomlish-translator",
    "https://racing-lagoon.info/nomu/translate.php",
  ],
  repository: "https://github.com/souhait0614/submarin-converter",
  author: "すえ",
} as const satisfies PluginMetaData;
