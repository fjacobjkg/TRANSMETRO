import { registerHooks } from "node:module";

// Resolve the app's extensionless TypeScript import without changing its compiler settings.
const resolver = registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.endsWith("/src/utils/role-routing.ts") && specifier.startsWith(".")) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
} });
export const { getPanelsByRole, getHomeRouteByRole, roleLabel } = await import("../../src/utils/role-routing.ts");
resolver.deregister();
