#!/usr/bin/env python3
"""Read-only technical SEO audit for public websites. Python standard library only."""
from __future__ import annotations
import argparse, json, re, sys, time, urllib.error, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from collections import Counter, deque
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from typing import Any

UA = "ClinicaSEO-Gauntlet/0.1 (+read-only technical SEO audit)"
TIMEOUT = 12
MAX_SITEMAP_URLS = 100
MAX_CRAWL_PAGES = 30

@dataclass
class Finding:
    severity: str
    check: str
    url: str
    message: str
    evidence: str = ""

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts=[]; self.in_title=False
        self.meta={}; self.links=[]; self.images=[]; self.h1=[]; self.headings=[]
        self.lang=""; self.jsonld=[]; self.in_jsonld=False; self.jsonld_parts=[]
        self.canonical=[]; self.html_seen=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=="html": self.html_seen=True; self.lang=a.get("lang","")
        if tag=="title": self.in_title=True
        if tag=="meta" and a.get("name"): self.meta[a["name"].lower()]=a.get("content","")
        if tag=="meta" and a.get("property"): self.meta[a["property"].lower()]=a.get("content","")
        if tag=="link":
            rel=(a.get("rel") or "").lower().split()
            if "canonical" in rel and a.get("href"): self.canonical.append(a["href"])
        if tag=="a" and a.get("href"): self.links.append(a["href"])
        if tag=="img": self.images.append({"src":a.get("src",""),"alt":a.get("alt")})
        if tag in ("h1","h2","h3","h4","h5","h6"): self.headings.append({"tag":tag,"text":""})
        if tag=="h1": self.h1.append("")
        if tag=="script" and (a.get("type") or "").lower()=="application/ld+json":
            self.in_jsonld=True; self.jsonld_parts=[]
    def handle_endtag(self, tag):
        if tag=="title": self.in_title=False
        if tag=="script" and self.in_jsonld:
            self.jsonld.append("".join(self.jsonld_parts)); self.in_jsonld=False
    def handle_data(self, data):
        if self.in_title: self.title_parts.append(data)
        if self.in_jsonld: self.jsonld_parts.append(data)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

def fetch(url: str, timeout: int=TIMEOUT, redirects: bool=True) -> dict[str,Any]:
    opener=urllib.request.build_opener() if redirects else urllib.request.build_opener(NoRedirect)
    req=urllib.request.Request(url, headers={"User-Agent":UA,"Accept":"text/html,application/xml,text/plain,*/*"})
    started=time.monotonic()
    try:
        with opener.open(req, timeout=timeout) as r:
            body=r.read(2_500_000)
            return {"url":url,"final_url":r.geturl(),"status":r.status,"headers":dict(r.headers.items()),
                    "body":body.decode(r.headers.get_content_charset() or "utf-8",errors="replace"),
                    "elapsed_ms":round((time.monotonic()-started)*1000),"error":None}
    except urllib.error.HTTPError as e:
        try: body=e.read(500_000).decode("utf-8",errors="replace")
        except Exception: body=""
        return {"url":url,"final_url":e.geturl(),"status":e.code,"headers":dict(e.headers.items()),
                "body":body,"elapsed_ms":round((time.monotonic()-started)*1000),"error":None}
    except Exception as e:
        return {"url":url,"final_url":url,"status":None,"headers":{},"body":"",
                "elapsed_ms":round((time.monotonic()-started)*1000),"error":f"{type(e).__name__}: {e}"}

def redirect_chain(url: str, max_hops: int=8) -> dict[str,Any]:
    chain=[]; current=url
    for _ in range(max_hops+1):
        r=fetch(current,redirects=False)
        chain.append({k:r.get(k) for k in ("url","status","elapsed_ms","error")})
        if r.get("status") not in (301,302,303,307,308): break
        loc=next((v for k,v in r["headers"].items() if k.lower()=="location"),None)
        if not loc: break
        current=urllib.parse.urljoin(current,loc)
    return {"start":url,"final":current,"hops":max(0,len(chain)-1),"chain":chain,
            "loop":len({x["url"] for x in chain})!=len(chain)}

def parse_page(url: str, response: dict[str,Any], findings: list[Finding]) -> dict[str,Any]:
    p=PageParser(); p.feed(response.get("body",""))
    title=" ".join("".join(p.title_parts).split())
    desc=p.meta.get("description","").strip()
    robots=p.meta.get("robots","").strip().lower()
    canonical=[urllib.parse.urljoin(response.get("final_url",url),c) for c in p.canonical]
    if response.get("status")!=200: findings.append(Finding("error","page_http_status",url,f"Página respondeu {response.get('status')}",str(response.get("error") or "")))
    if not title: findings.append(Finding("error","title_missing",url,"Tag title ausente ou vazia"))
    elif len(title)>60: findings.append(Finding("warning","title_long",url,f"Title com {len(title)} caracteres",title)
    if not desc: findings.append(Finding("warning","meta_description_missing",url,"Meta description ausente ou vazia"))
    elif len(desc)>160: findings.append(Finding("info","meta_description_long",url,f"Descrição com {len(desc)} caracteres",desc)
    if not p.lang: findings.append(Finding("warning","html_lang_missing",url,"A tag html não declara lang"))
    if len(p.h1)==0: findings.append(Finding("warning","h1_missing",url,"Nenhum H1 encontrado"))
    if len(p.h1)>1: findings.append(Finding("warning","multiple_h1",url,f"Foram encontrados {len(p.h1)} H1"))
    if len(canonical)==0: findings.append(Finding("warning","canonical_missing",url,"Nenhuma tag canonical encontrada"))
    if len(canonical)>1: findings.append(Finding("error","canonical_multiple",url,f"Foram encontradas {len(canonical)} canonicals",", ".join(canonical)))
    if "noindex" in robots: findings.append(Finding("warning","noindex",url,"Meta robots contém noindex",robots))
    bad_alt=[i for i in p.images if i.get("alt") is None]
    if bad_alt: findings.append(Finding("warning","images_alt_missing",url,f"{len(bad_alt)} imagens sem atributo alt"))
    bad_json=[]
    for raw in p.jsonld:
        try: json.loads(raw)
        except Exception as e: bad_json.append(str(e))
    if bad_json: findings.append(Finding("warning","jsonld_invalid",url,f"{len(bad_json)} blocos JSON-LD inválidos",bad_json[0]))
    return {"url":url,"status":response.get("status"),"final_url":response.get("final_url"),"elapsed_ms":response.get("elapsed_ms"),
            "title":title,"title_length":len(title),"description":desc,"description_length":len(desc),"robots":robots,
            "canonical":canonical,"html_lang":p.lang,"h1_count":len(p.h1),"heading_tags":[x["tag"] for x in p.headings],
            "image_count":len(p.images),"images_missing_alt":len(bad_alt),"jsonld_blocks":len(p.jsonld),
            "og_title":p.meta.get("og:title",""),"og_description":p.meta.get("og:description",""),
            "links":p.links,"content_type":next((v for k,v in response.get("headers",{}).items() if k.lower()=="content-type"),"")}

def audit_robots(base: str, findings: list[Finding]) -> dict[str,Any]:
    url=urllib.parse.urljoin(base.rstrip("/")+"/","robots.txt")
    r=fetch(url); body=r.get("body",""); sitemaps=[]; disallows=[]
    for line in body.splitlines():
        line=line.split("#",1)[0].strip()
        if ":" not in line: continue
        k,v=(x.strip() for x in line.split(":",1))
        if k.lower()=="sitemap": sitemaps.append(v)
        if k.lower()=="disallow" and v: disallows.append(v)
    if r.get("status")!=200: findings.append(Finding("error","robots_unavailable",url,f"robots.txt respondeu {r.get('status')}",str(r.get("error") or "")))
    if not sitemaps: findings.append(Finding("warning","robots_sitemap_missing",url,"Nenhuma diretiva Sitemap encontrada"))
    return {"url":url,"status":r.get("status"),"sitemaps":sitemaps,"disallow_rules":disallows,"body":body}

def audit_sitemap(sitemap_url: str, findings: list[Finding], max_urls: int=MAX_SITEMAP_URLS) -> dict[str,Any]:
    r=fetch(sitemap_url); urls=[]; errors=[]
    if r.get("status")!=200:
        findings.append(Finding("error","sitemap_unavailable",sitemap_url,f"Sitemap respondeu {r.get('status')}",str(r.get("error") or "")))
        return {"url":sitemap_url,"status":r.get("status"),"url_count":0,"urls":[],"errors":["Sitemap inacessível"]}
    try:
        root=ET.fromstring(r.get("body",""))
        locs=[e.text.strip() for e in root.iter() if e.tag.split("}")[-1]=="loc" and e.text and e.text.strip()]
        urls=locs[:max_urls]
        if len(locs)>max_urls: errors.append(f"Limitado a {max_urls} de {len(locs)} URLs")
        if root.tag.split("}")[-1] not in ("urlset","sitemapindex"): errors.append(f"Raiz XML inesperada: {root.tag}")
        if root.tag.split("}")[-1]=="sitemapindex":
            errors.append("Sitemap index encontrado; os sitemaps filhos não são expandidos nesta versão")
    except Exception as e:
        errors.append(f"XML inválido: {e}")
    if errors: findings.append(Finding("warning","sitemap_xml_or_limit",sitemap_url,"; ".join(errors)))
    return {"url":sitemap_url,"status":r.get("status"),"url_count":len(urls),"urls":urls,"errors":errors}

def audit_site(start_url: str, crawl: bool=False, max_pages: int=MAX_CRAWL_PAGES) -> dict[str,Any]:
    findings=[]; started=time.monotonic()
    start_url=start_url.strip()
    if not urllib.parse.urlparse(start_url).scheme: start_url="https://"+start_url
    base_parts=urllib.parse.urlsplit(start_url)
    if base_parts.scheme not in ("http","https") or not base_parts.netloc: raise ValueError("Informe uma URL http(s) válida")
    base=f"{base_parts.scheme}://{base_parts.netloc}"
    host=(base_parts.hostname or "").lower()
    urls=[start_url]; page_results=[]; seen=set(); redirects=[]
    while urls and len(seen)<(max_pages if crawl else 1):
        url=urls.pop(0)
        if url in seen: continue
        seen.add(url)
        if urllib.parse.urlsplit(url).hostname!=host: continue
        response=fetch(url); redirects.append(redirect_chain(url))
        page=parse_page(url,response,findings); page_results.append(page)
        if crawl:
            for href in page["links"]:
                absolute=urllib.parse.urldefrag(urllib.parse.urljoin(page.get("final_url") or url,href))[0]
                u=urllib.parse.urlsplit(absolute)
                if u.scheme in ("http","https") and (u.hostname or "").lower()==host and absolute not in seen and absolute not in urls:
                    urls.append(absolute)
    if not start_url.startswith("https://"):
        findings.append(Finding("warning","https_start_url","start_url","A URL informada não usa HTTPS",start_url))
    rr=audit_robots(base,findings)
    sitemap_urls=rr["sitemaps"] or [urllib.parse.urljoin(base+"/","sitemap.xml")]
    sitemaps=[audit_sitemap(u,findings) for u in sitemap_urls[:5]]
    title_counts=Counter(p["title"].lower() for p in page_results if p["title"])
    for p in page_results:
        if p["title"] and title_counts[p["title"].lower()]>1:
            findings.append(Finding("warning","duplicate_title",p["url"],"Title duplicado dentro do conjunto rastreado",p["title"]))
    score=max(0,100-sum({"critical":25,"error":15,"warning":5,"info":1}.get(f.severity,0) for f in findings))
    return {"tool":"Clinica SEO Gauntlet","version":"0.1.0","read_only":True,"start_url":start_url,
            "generated_at_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"pages_checked":len(page_results),
            "robots":rr,"sitemaps":sitemaps,"redirect_checks":redirects,"pages":page_results,
            "findings":[asdict(f) for f in findings],"summary":{"score_heuristic":score,
            "critical":sum(f.severity=="critical" for f in findings),"errors":sum(f.severity=="error" for f in findings),
            "warnings":sum(f.severity=="warning" for f in findings),"info":sum(f.severity=="info" for f in findings),
            "duration_seconds":round(time.monotonic()-started,2)}}

def main():
    ap=argparse.ArgumentParser(description="Auditoria SEO técnica pública, somente leitura")
    ap.add_argument("url",help="URL inicial do site")
    ap.add_argument("--crawl",action="store_true",help="Rastreia links internos (máximo 30 páginas)")
    ap.add_argument("--max-pages",type=int,default=MAX_CRAWL_PAGES)
    ap.add_argument("--json",dest="json_path",default="seo-audit-report.json")
    ap.add_argument("--markdown",dest="md_path",default="seo-audit-report.md")
    args=ap.parse_args()
    try: report=audit_site(args.url,args.crawl,max(1,min(args.max_pages,MAX_CRAWL_PAGES)))
    except ValueError as e: print(f"Erro: {e}",file=sys.stderr); return 2
    with open(args.json_path,"w",encoding="utf-8") as f: json.dump(report,f,ensure_ascii=False,indent=2)
    lines=[f"# Relatório SEO Gauntlet", "",f"- URL: {report['start_url']}",f"- Páginas verificadas: {report['pages_checked']}",f"- Nota heurística: {report['summary']['score_heuristic']}/100","", "## Resumo", ""]
    lines += [f"- {k}: {v}" for k,v in report["summary"].items()]
    lines += ["","## Findings",""]
    lines += [f"- **{x['severity'].upper()} — {x['check']}** — {x['url']}: {x['message']} {('('+x['evidence']+')') if x['evidence'] else ''}" for x in report["findings"]] or ["Nenhum finding automático."]
    lines += ["","## Páginas",""]
    lines += [f"- {p['status']} — {p['url']} — title: {p['title'] or '(ausente)'} — canonical: {', '.join(p['canonical']) or '(ausente)'}" for p in report["pages"]]
    with open(args.md_path,"w",encoding="utf-8") as f: f.write("\n".join(lines)+"\n")
    print(json.dumps({"summary":report["summary"],"reports":[args.json_path,args.md_path]},ensure_ascii=False,indent=2))
    return 0
if __name__=="__main__": raise SystemExit(main())
