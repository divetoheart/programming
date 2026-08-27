# App Foundry

A reusable mobile-app publishing factory for shipping small apps fast without rebuilding infrastructure every time.

## Goal

Idea -> vibe code -> test -> monetize -> EAS build -> TestFlight/App Store -> iterate or sell.

## Standard stack

- Official Expo SDK 57 TypeScript template as the base
- EAS Build + Submit
- RevenueCat for purchases/subscriptions
- AsyncStorage for local-first persistence
- No backend by default
- Supabase or another backend only when a product genuinely needs accounts, shared data, or server-side logic

## Create an app

```bash
cd app-foundry
npm run new -- my-app
cd ../my-app
cp .env.example .env
npm run ios
```

That is the normal path. App name is derived from the slug and the bundle/package ID defaults to `com.divetoheart.<slug-without-hyphens>`.

Override only when needed:

```bash
npm run new -- my-app --name "My App" --bundle com.company.myapp --out ../my-app
```

The generator creates the Expo project, installs the standard native dependencies, adds Foundry's overlay, and runs the preflight doctor automatically.

## First-time service setup for an app

You only do these when the app actually needs them:

1. Sign into Expo and initialize/link the EAS project.
2. Make the App Store Connect app record.
3. If paid, create the RevenueCat app/products/entitlement and put production public SDK keys into EAS environment variables.
4. Add the repository secret `EXPO_TOKEN` if you want the GitHub Actions release button.
5. Replace the TODOs in `STORE.md` and `PRIVACY.md`.

Apple Developer membership is still required for App Store distribution.

## Ship to iOS

Once initial credentials/store records exist:

```bash
npm run ship:ios
```

This runs Foundry's doctor, then a production EAS build with automatic submission.

Or use the generated GitHub Actions workflow and press **Run workflow** from GitHub Actions.

## Rules of the factory

1. Product code is allowed to be weird; infrastructure is not.
2. Local-first until a backend has a concrete product reason to exist.
3. Every paid feature is represented by a RevenueCat entitlement, never scattered purchase checks.
4. Every app must pass `npm run doctor` and `npm run typecheck` before shipping.
5. Every app keeps its store metadata and transfer notes in the repo so it is easy to sell later.
6. Do not add Fastlane, custom signing automation, alternate build services, bespoke CI, or a server unless EAS/RevenueCat cannot satisfy an actual requirement.

## Generated app contents

Each generated app includes:

- Current official Expo TypeScript project
- unique bundle/package identifiers
- EAS development, preview, and production profiles
- RevenueCat bootstrap with a mock/local fallback
- local storage wrapper
- analytics hook point
- `doctor` and one-command `ship:ios` scripts
- App Store metadata + transfer template
- privacy worksheet
- GitHub Actions iOS shipping workflow
- `AGENTS.md` telling future coding agents how to preserve the factory conventions

## Moving App Foundry later

Everything is self-contained inside this directory. It can be split into its own repository without depending on the rest of `programming`.
