# Google Ads + WhatsApp + Landing Page Gauntlet

Campanha: SEARCH | PARNAMIRIM | ALTA INTENÇÃO (24289443969).

## Live Google Ads recommendations audited

- CAMPAIGN_BUDGET: current R$17/day; Google recommends R$21/day and estimates +12 clicks/week. Do not apply until WhatsApp conversion tracking is verified.
- SITELINK_ASSET: active. Google API may return an empty recommendation object; treat it as a signal to add relevant sitelinks, not as a blind mutation.
- SEARCH_PARTNERS_OPT_IN: active. Do not enable automatically before validating lead quality because the current campaign has insufficient verified conversion data.

## Money-path

Google Ads → landing page → WhatsApp click → CSP lead reference → Cloudflare Durable Object → incoming WhatsApp message → attribution → GA4 whatsapp_lead (when GA4_MEASUREMENT_ID and GA4_API_SECRET are configured) → Google Ads conversion.

The browser bridge captures gclid/gbraid/wbraid/UTMs and GA4 client ID when available. The Worker stores only attribution metadata and message linkage, not message text or sender phone number.

## 100/100 gate

100% Google Ads Optimization Score, Quality Score, Landing Page Experience and Lighthouse/PageSpeed are different metrics. The objective is to make each layer technically and commercially healthy, not to apply every recommendation just to raise a number.

P0 is complete only when the click is recorded, the WhatsApp message links to the click, GA4 receives whatsapp_lead, the event is made a key event/conversion for Ads, duplicate tracking is absent, and the landing page passes performance/accessibility/best-practice/SEO checks.
