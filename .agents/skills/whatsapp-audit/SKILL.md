---
name: whatsapp-audit
description: Audit website-to-WhatsApp tracking, destination URLs, attribution and webhook readiness without sending messages or creating cost.
---

# whatsapp-audit

## Procedure
1. Inspect website WhatsApp links and event listeners.
2. Verify the event name and parameters used for clique_whatsapp.
3. Check Google Ads import status for the corresponding conversion.
4. Check GA4 event evidence.
5. Check for malformed or duplicated WhatsApp URLs.
6. Verify UTM/tracking parameters at the site and Ads layers.
7. Verify webhook/security design without sending production messages.
## Safety
Never send a WhatsApp message automatically and never expose phone or API secrets in logs.
