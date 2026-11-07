// npm test のための読み込みの補助。ライブラリを増やさないために置いている。
// Node.js だけでは読めない、@/ で始まる読み込みと、拡張子なしの読み込みを .ts に結びつける
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function targetPath(specifier, parentURL) {
  if (specifier.startsWith("@/")) return path.join(root, specifier.slice(2));
  if (specifier.startsWith(".") && parentURL?.startsWith("file:")) {
    return path.join(path.dirname(fileURLToPath(parentURL)), specifier);
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = targetPath(specifier, context.parentURL);
    if (target && !path.extname(target) && existsSync(`${target}.ts`)) {
      return nextResolve(pathToFileURL(`${target}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});
