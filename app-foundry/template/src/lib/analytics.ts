type Properties = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, properties: Properties = {}) {
  if (__DEV__) {
    console.log('[analytics]', event, properties);
  }

  // Intentionally provider-free. Add PostHog, Amplitude, etc. only when the app
  // has a concrete analytics requirement, and keep product code calling this adapter.
}
