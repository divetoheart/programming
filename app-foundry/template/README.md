# __APP_NAME__

Generated with App Foundry.

## Fast development loop

```bash
cp .env.example .env
npm start
```

The default `.env.example` uses mock purchases, so product development can stay fast. RevenueCat is loaded only when `EXPO_PUBLIC_PURCHASES_MODE=store`.

## Preflight

```bash
npm run doctor
npm run typecheck
```

## Test real purchases

RevenueCat uses native modules, so real store-mode purchase testing needs an Expo development build or TestFlight build rather than Expo Go.

Configure your RevenueCat public SDK keys, switch purchase mode to `store`, then create/use a development build.

## Ship iOS

First-time per app:

- Link/init the Expo EAS project.
- Create the App Store Connect record.
- Configure Apple credentials through EAS.
- If monetized, configure RevenueCat products/offering/`pro` entitlement.
- Put production public SDK keys in the EAS production environment.
- Complete `STORE.md` and `PRIVACY.md`.

Then:

```bash
npm run ship:ios
```

Or add an `EXPO_TOKEN` repository secret and use **GitHub Actions -> Ship iOS -> Run workflow**.

## Architecture rule

Local-first. Do not add a backend until the product has a feature that cannot reasonably work locally. See `AGENTS.md` before asking a coding agent to extend infrastructure.
