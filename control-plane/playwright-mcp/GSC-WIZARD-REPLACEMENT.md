# GSC Wizard Replacement

## Decision
GSC Wizard is no longer a required dependency for Search Console operations in the Control Tower.

## Primary provider
**Native Google Search Console toolkit through Composio**.

## Verified on 2026-10-08
- Connection: ACTIVE
- Property: sc-domain:clinicasaopauloparnamirim.com.br
- Permission: siteOwner
- Search Analytics query: SUCCESS
- Page breakdown query: SUCCESS
- List sites: SUCCESS

## Runtime tools
- GOOGLE_SEARCH_CONSOLE_LIST_SITES
- GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY
- GOOGLE_SEARCH_CONSOLE_LIST_SITEMAPS
- GOOGLE_SEARCH_CONSOLE_INSPECT_URL

## Secondary provider
OpenSEO Search Console tools remain available as a complementary SEO intelligence layer when a valid OpenSEO project is connected.

## Control Tower rule
Do not treat GSC Wizard availability or subscription state as a prerequisite for Search Console operations.

Preferred routing:
1. Native Google Search Console via Composio
2. OpenSEO Search Console tools for SEO opportunity/indexation workflows
3. Control Tower custom GSC audit as a legacy/fallback path only while its Google token-refresh issue remains unresolved

## Evidence
The native Composio Search Console connection returned real Search Analytics data for the clinic for 2026-09-08 through 2026-10-05, including queries and page-level metrics.

Google's official OAuth documentation lists the Search Console read-only scope as https://www.googleapis.com/auth/webmasters.readonly.
