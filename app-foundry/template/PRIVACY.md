# __APP_NAME__ — Privacy Worksheet

This is an internal source-of-truth worksheet, not automatically a final legal privacy policy.

## Default App Foundry posture

- Local-first storage
- No account required unless the product needs one
- No advertising SDK by default
- No analytics provider by default
- RevenueCat only when monetization is enabled

## Data inventory

For every data type the app handles, document:

| Data | Collected? | Stored where? | Purpose | Shared with |
| --- | --- | --- | --- | --- |
| Account/contact info | No by default | — | — | — |
| User-created content | TODO | Local by default | App functionality | None by default |
| Purchase data | If paid | Apple/Google + RevenueCat | Purchases/entitlements | RevenueCat |
| Analytics | No by default | — | — | — |
| Diagnostics/crash data | TODO | TODO | Reliability | TODO |

## Before App Store submission

- [ ] Replace every TODO above.
- [ ] Confirm App Store privacy nutrition-label answers match this worksheet.
- [ ] Publish a real privacy policy URL if required by the app/store configuration.
- [ ] Update this document whenever a new SDK or backend is introduced.
