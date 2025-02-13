import { json2Dict, replace } from "@submarin/generator";
import type { TextData } from "@submarin/generator";

import jsonCommon from "./dict/common.ts";
import jsonKana from "./dict/kana.ts";

export const generate = (text: string = "") => {
  let data: TextData = { text, replaced: [] };

  data = replace(data, json2Dict(jsonCommon));
  data = replace(data, json2Dict(jsonKana));

  return data.text;
};

export default { generate };
