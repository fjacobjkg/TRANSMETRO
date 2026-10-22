import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "rolldown/utils";

// Use the project's installed TSX transformer for Node tests, without a dev server.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/src/") && specifier.startsWith(".")) {
      for (const extension of [".ts", ".tsx"]) {
        const url = new URL(specifier + extension, context.parentURL);
        if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".css")) return { format: "module", source: "", shortCircuit: true };
    if (url.endsWith(".tsx")) {
      const file = fileURLToPath(url);
      const result = transformSync(file, readFileSync(file, "utf8"), { lang: "tsx", jsx: { runtime: "automatic" } });
      if (result.errors.length) throw new Error(JSON.stringify(result.errors));
      return { format: "module", source: result.code, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
export const { DataTable } = await import("../../src/components/ui/DataTable.tsx");
export const { SearchableSelect } = await import("../../src/components/ui/SearchableSelect.tsx");
export const { Select } = await import("../../src/components/ui/Select.tsx");
export const pagination = await import("../../src/utils/table-pagination.ts");
hooks.deregister();
