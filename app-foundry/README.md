# App Foundry

A reusable mobile-app publishing factory for shipping small apps fast without rebuilding infrastructure every time.

## Goal

Idea -> vibe code -> test -> monetize -> EAS build -> TestFlight/App Store -> iterate or sell.

## Standard stack

- Expo / React Native
- EAS Build + Submit
- RevenueCat for purchases/subscriptions
- AsyncStorage for local-first persistence
- No backend by default
- Supabase or another backend only when a product genuinely needs accounts, shared data, or server-side logic

## Create an app

```bash
cd app-foundry
npm run new -- my-app --name "My App" --bundle com.yourname.myapp --out ../my-app
cd ../my-app
npm install
cp .env.example .env
npm run doctor
npm run ios
```

## Ship to iOS

First-time setup requires an Expo account, EAS project initialization, Apple Developer membership, App Store Connect app record, and RevenueCat products if the app is paid.

After that, the intended release command is:

```bash
npm run ship:ios
```

That runs a production EAS build with automatic submission.

## Rules of the factory

1. Product code is allowed to be weird; infrastructure is not.
2. Local-first until a backend has a concrete product reason to exist.
3. Every paid feature is represented by a RevenueCat entitlement, never scattered purchase checks.
4. Every app must pass `npm run doctor` and `npm run typecheck` before shipping.
5. Every app keeps its store metadata and transfer notes in the repo so it is easy to sell later.
6. Do not add Fastlane, custom signing automation, bespoke CI, or a server unless EAS/RevenueCat cannot satisfy an actual requirement.

## Generated app contents

Each generated app includes:

- Expo config with unique bundle/package identifiers
- EAS development, preview, and production profiles
- RevenueCat bootstrap with a mock/local fallback
- local storage wrapper
- analytics hook point
- `doctor` and `ship:ios` scripts
- App Store metadata template
- privacy/legal placeholders
- GitHub Actions iOS shipping workflow template
- `AGENTS.md` telling future coding agents how to preserve the factory conventions

## Moving App Foundry later

Everything is self-contained inside this directory. It can be split into its own repository without depending on the rest of `programming`.
