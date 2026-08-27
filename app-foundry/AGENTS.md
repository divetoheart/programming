# App Foundry Maintainer Rules

App Foundry exists to reduce launch friction, not become a platform project.

## Priorities

1. Keep `npm run new -- <slug>` boring and reliable.
2. Prefer official Expo tooling over custom infrastructure.
3. Keep the generated app local-first and backend-free by default.
4. Preserve mock purchase mode so product work can run without store plumbing.
5. Keep real purchase logic behind the generated `src/lib/purchases.ts` adapter.
6. Keep generated apps transferable: no personal server dependencies, undocumented services, or secrets in source.
7. Add a dependency only when it removes more recurring work than it creates.

## Updating Expo

`foundry.config.json` owns the target Expo SDK. When changing it, verify the official `create-expo-app` template name and update the generated app docs if the development workflow changes.

## Release philosophy

The target experience is:

```bash
npm run new -- cool-idea
# vibe code the product
npm run ship:ios
```

Everything added to Foundry should make that path shorter, safer, or more repeatable.
