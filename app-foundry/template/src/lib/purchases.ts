import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const entitlement = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || 'pro';
const mode = process.env.EXPO_PUBLIC_PURCHASES_MODE || 'mock';
let configured = false;
let mockPro = false;

function apiKey() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

export async function initializePurchases() {
  if (configured || mode !== 'store') return;

  const key = apiKey();
  if (!key || key.includes('your_public_sdk_key')) {
    throw new Error('RevenueCat store mode is enabled but the public SDK key is missing.');
  }

  Purchases.configure({ apiKey: key });
  configured = true;
}

export async function getProStatus() {
  if (mode !== 'store') return mockPro;
  await initializePurchases();
  const info = await Purchases.getCustomerInfo();
  return Boolean(info.entitlements.active[entitlement]);
}

export async function openPaywall() {
  if (mode !== 'store') {
    mockPro = true;
    return;
  }

  await initializePurchases();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];

  if (!pkg) {
    throw new Error('No RevenueCat package is available in the current offering.');
  }

  await Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  if (mode !== 'store') return mockPro;
  await initializePurchases();
  const info = await Purchases.restorePurchases();
  return Boolean(info.entitlements.active[entitlement]);
}
