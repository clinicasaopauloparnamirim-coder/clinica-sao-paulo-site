#!/usr/bin/env python3
"""Second-pass checks for canonical targets, URL variants, mixed content and sitemap URL status."""
import json, sys, urllib.parse
from html.parser import HTMLParser
from seo_audit import fetch, redirect_chain, MAX_URLS

class ResourceParser(HTMLParser):
    RESOURCE_TAGS={"img","script","iframe","source","video","audio","link","input"}
    def __init__(self):
        super().__init__(convert_charrefs=True); self.refs=[]; self.hreflang=[]
        self.jsonld=[]; self.in_jsonld=False; self.buf=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in self.RESOURCE_TAGS:
            for key in ("src","href","poster"):
                if a.get(key): self.refs.append({"tag":tag,"attribute":key,"url":a[key]})
            if a.get("srcset"):
                for item in a["srcset"].split(","):
                    candidate=item.strip().split(" ")[0]
                    if candidate: self.refs.append({"tag":tag,"attribute":"srcset","url":candidate})
        if tag=="form" and a.get("action"): self.refs.append({"tag":tag,"attribute":"action","url":a["action"]})
        if tag=="link" and (a.get("rel") or "").lower()=="alternate" and a.get("hreflang") and a.get("href"):
            self.hreflang.append({"lang":a["hreflang"],"url":a["href"]})
        if tag=="script" and (a.get("type") or "").lower()=="application/ld+json": self.in_jsonld=True; self.buf=[]
    def handle_endtag(self,tag):
        if tag=="script" and self.in_jsonld: self.jsonld.append("".join(self.buf)); self.in_jsonld=False
    def handle_data(self,data):
        if self.in_jsonld: self.buf.append(data)

def audit(report_path="seo-audit-report.json", output_path="seo-audit-advanced.json"):
    base_report=json.load(open(report_path,encoding="utf-8"))
    start=base_report["start_url"]; parts=urllib.parse.urlsplit(start); host=parts.hostname or ""
    root=f"{parts.scheme}://{parts.netloc}"
    findings=[]; page_details=[]; status_checks={}
    # Test canonical target reachability and host consistency for every crawled page.
    for page in base_report.get("pages",[]):
        for canonical in page.get("canonical",[]):
            cp=urllib.parse.urlsplit(canonical)
            if (cp.hostname or "").lower() != host.lower():
                findings.append({"severity":"warning","check":"canonical_cross_host","url":page["url"],"message":"Canonical aponta para outro host","evidence":canonical})
            if canonical != page.get("final_url"):
                res=fetch(canonical)
                status_checks[canonical]=res.get("status")
                if res.get("status") != 200:
                    findings.append({"severity":"error","check":"canonical_target_status","url":page["url"],"message":f"Destino canonical respondeu {res.get('status')}","evidence":canonical})
        res=fetch(page["url"])
        parser=ResourceParser(); parser.feed(res.get("body",""))
        mixed=[]
        for ref in parser.refs:
            absolute=urllib.parse.urljoin(page["url"],ref["url"])
            if urllib.parse.urlsplit(page["url"]).scheme=="https" and absolute.lower().startswith("http://"):
                mixed.append({"tag":ref["tag"],"attribute":ref["attribute"],"url":absolute})
        schema_types=[]
        for raw in parser.jsonld:
            try:
                data=json.loads(raw)
                entities=data if isinstance(data,list) else [data]
                for entity in entities:
                    if isinstance(entity,dict):
                        typ=entity.get("@type")
                        if isinstance(typ,list): schema_types.extend(str(x) for x in typ)
                        elif typ: schema_types.append(str(typ))
            except Exception: pass
        if mixed: findings.append({"severity":"error","check":"mixed_content","url":page["url"],"message":f"{len(mixed)} referências HTTP inseguras em página HTTPS","evidence":json.dumps(mixed,ensure_ascii=False)})
        page_details.append({"url":page["url"],"mixed_content_count":len(mixed),"mixed_content":mixed,"schema_types":sorted(set(schema_types)),"hreflang":parser.hreflang})
    # Check each sitemap URL status, capped to protect the host.
    sitemap_results=[]
    for sm in base_report.get("sitemaps",[]):
        for url in sm.get("urls",[])[:MAX_URLS]:
            if url not in status_checks:
                status_checks[url]=fetch(url).get("status")
            status=status_checks[url]
            sitemap_results.append({"url":url,"status":status})
            if status != 200:
                findings.append({"severity":"error","check":"sitemap_url_status","url":url,"message":f"URL listada no sitemap respondeu {status}"})
    # Check canonical host preference for HTTP/www variants. Redirects are observed, never changed.
    hostname=parts.hostname or ""
    bare=hostname[4:] if hostname.lower().startswith("www.") else hostname
    variants=[f"http://{bare}/",f"http://www.{bare}/",f"https://www.{bare}/",f"https://{bare}/"]
    variant_results=[]
    seen=set()
    for variant in variants:
        if variant in seen: continue
        seen.add(variant)
        chain=redirect_chain(variant,limit=6); variant_results.append(chain)
        if chain.get("loop"): findings.append({"severity":"error","check":"redirect_loop","url":variant,"message":"Loop detectado na cadeia de redirecionamento"})
        if chain.get("hops",0)>2: findings.append({"severity":"warning","check":"redirect_long_chain","url":variant,"message":f"Cadeia com {chain['hops']} saltos"})
        final=chain.get("final","")
        if final.startswith("http://"): findings.append({"severity":"error","check":"redirect_https_downgrade","url":variant,"message":"A variante termina em HTTP","evidence":final})
        if chain.get("chain") and chain["chain"][-1].get("status") not in (200,):
            findings.append({"severity":"warning","check":"variant_final_status","url":variant,"message":f"Status final {chain['chain'][-1].get('status')}"})
    result={"tool":"Clinica SEO Gauntlet Advanced","version":"0.1.0","read_only":True,"start_url":start,
        "sitemap_url_status":sitemap_results,"canonical_target_status":status_checks,"url_variants":variant_results,
        "page_details":page_details,"findings":findings,
        "summary":{"sitemap_urls_checked":len(sitemap_results),"page_details_checked":len(page_details),
                   "url_variants_checked":len(variant_results),"findings":len(findings)}}
    with open(output_path,"w",encoding="utf-8") as f: json.dump(result,f,ensure_ascii=False,indent=2)
    print(json.dumps({"summary":result["summary"],"output":output_path},ensure_ascii=False,indent=2))
    return result

if __name__=="__main__":
    try: audit(sys.argv[1] if len(sys.argv)>1 else "seo-audit-report.json",sys.argv[2] if len(sys.argv)>2 else "seo-audit-advanced.json")
    except Exception as e:
        print(f"Advanced audit failed: {type(e).__name__}: {e}",file=sys.stderr); raise
