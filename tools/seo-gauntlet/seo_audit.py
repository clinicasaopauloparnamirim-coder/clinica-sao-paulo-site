#!/usr/bin/env python3
"""Read-only technical SEO audit. Python standard library only."""
from __future__ import annotations
import argparse, json, sys, time, urllib.error, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from html.parser import HTMLParser

UA = "ClinicaSEO-Gauntlet/0.1 (+read-only technical SEO audit)"
TIMEOUT = 12
MAX_URLS = 100

@dataclass
class Finding:
    severity: str
    check: str
    url: str
    message: str
    evidence: str = ""

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = []; self.in_title = False; self.meta = {}; self.canonical = []
        self.links = []; self.images = []; self.headings = []; self.lang = ""
        self.jsonld = []; self.in_jsonld = False; self.jsonld_buf = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html": self.lang = a.get("lang", "")
        if tag == "title": self.in_title = True
        if tag == "meta":
            if a.get("name"): self.meta[a["name"].lower()] = a.get("content", "")
            if a.get("property"): self.meta[a["property"].lower()] = a.get("content", "")
        if tag == "link" and "canonical" in (a.get("rel") or "").lower().split() and a.get("href"):
            self.canonical.append(a["href"])
        if tag == "a" and a.get("href"): self.links.append(a["href"])
        if tag == "img": self.images.append({"src": a.get("src", ""), "alt": a.get("alt")})
        if tag in ("h1","h2","h3","h4","h5","h6"): self.headings.append(tag)
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self.in_jsonld = True; self.jsonld_buf = []
    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
        if tag == "script" and self.in_jsonld:
            self.jsonld.append("".join(self.jsonld_buf)); self.in_jsonld = False
    def handle_data(self, data):
        if self.in_title: self.title.append(data)
        if self.in_jsonld: self.jsonld_buf.append(data)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

def fetch(url, redirects=True):
    opener = urllib.request.build_opener() if redirects else urllib.request.build_opener(NoRedirect)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xml,text/plain,*/*"})
    t = time.monotonic()
    try:
        with opener.open(req, timeout=TIMEOUT) as r:
            body = r.read(2_000_000).decode(r.headers.get_content_charset() or "utf-8", errors="replace")
            return {"url": url, "final_url": r.geturl(), "status": r.status, "headers": dict(r.headers.items()), "body": body, "elapsed_ms": round((time.monotonic()-t)*1000), "error": None}
    except urllib.error.HTTPError as e:
        try: body = e.read(250_000).decode("utf-8", errors="replace")
        except Exception: body = ""
        return {"url": url, "final_url": e.geturl(), "status": e.code, "headers": dict(e.headers.items()), "body": body, "elapsed_ms": round((time.monotonic()-t)*1000), "error": None}
    except Exception as e:
        return {"url": url, "final_url": url, "status": None, "headers": {}, "body": "", "elapsed_ms": round((time.monotonic()-t)*1000), "error": f"{type(e).__name__}: {e}"}

def redirect_chain(url, limit=8):
    chain=[]; current=url
    for _ in range(limit+1):
        r=fetch(current, redirects=False)
        chain.append({k:r.get(k) for k in ("url","status","elapsed_ms","error")})
        if r["status"] not in (301,302,303,307,308): break
        location=next((v for k,v in r["headers"].items() if k.lower()=="location"), None)
        if not location: break
        current=urllib.parse.urljoin(current, location)
    return {"start":url,"final":current,"hops":max(0,len(chain)-1),"loop":len({x["url"] for x in chain})!=len(chain),"chain":chain}

def page_audit(url, response, findings):
    p=Parser(); p.feed(response["body"])
    title=" ".join("".join(p.title).split()); desc=p.meta.get("description","").strip()
    robots=p.meta.get("robots","").lower(); canonical=[urllib.parse.urljoin(response["final_url"],x) for x in p.canonical]
    def add(sev, check, msg, ev=""): findings.append(Finding(sev,check,url,msg,ev))
    if response["status"] != 200: add("error","http_status",f"HTTP {response['status']}",response.get("error") or "")
    if not title: add("error","title_missing","Title ausente/vazio")
    elif len(title)>60: add("warning","title_long",f"Title tem {len(title)} caracteres",title)
    if not desc: add("warning","description_missing","Meta description ausente/vazia")
    elif len(desc)>160: add("info","description_long",f"Descrição tem {len(desc)} caracteres",desc)
    if not p.lang: add("warning","html_lang_missing","A tag html não declara lang")
    h1=sum(h=="h1" for h in p.headings)
    if h1==0: add("warning","h1_missing","Nenhum H1 encontrado")
    if h1>1: add("warning","multiple_h1",f"{h1} tags H1 encontradas")
    if not canonical: add("warning","canonical_missing","Canonical não encontrada")
    if len(canonical)>1: add("error","canonical_multiple",f"{len(canonical)} canonicals",", ".join(canonical))
    if "noindex" in robots: add("warning","noindex","Meta robots contém noindex",robots)
    missing_alt=sum(img["alt"] is None for img in p.images)
    if missing_alt: add("warning","image_alt_missing",f"{missing_alt} imagens sem atributo alt")
    invalid_jsonld=[]
    for raw in p.jsonld:
        try: json.loads(raw)
        except Exception as e: invalid_jsonld.append(str(e))
    if invalid_jsonld: add("warning","jsonld_invalid",f"{len(invalid_jsonld)} blocos JSON-LD inválidos",invalid_jsonld[0])
    return {"url":url,"status":response["status"],"final_url":response["final_url"],"elapsed_ms":response["elapsed_ms"],
        "title":title,"title_length":len(title),"description":desc,"description_length":len(desc),"robots":robots,
        "canonical":canonical,"html_lang":p.lang,"h1_count":h1,"headings":p.headings,"image_count":len(p.images),
        "images_missing_alt":missing_alt,"jsonld_blocks":len(p.jsonld),"og_title":p.meta.get("og:title",""),
        "og_description":p.meta.get("og:description",""),"links":p.links,"content_type":next((v for k,v in response["headers"].items() if k.lower()=="content-type"),""),
        "response_headers":{k.lower():v for k,v in response.get("headers",{}).items() if k.lower() in {"strict-transport-security","x-content-type-options","content-security-policy","x-frame-options","referrer-policy","permissions-policy","server","content-type","cache-control"}}}

def audit_security_headers(url, headers, findings):
    """Check key response security headers on the public HTTPS response (not just zone settings)."""
    normalized={str(k).lower():str(v).strip() for k,v in (headers or {}).items()}
    scheme=urllib.parse.urlsplit(url).scheme.lower()
    keys=("strict-transport-security","x-content-type-options","content-security-policy","x-frame-options","referrer-policy","permissions-policy","cache-control","server")
    reported={k:normalized.get(k) for k in keys if normalized.get(k) is not None}
    if scheme=="https":
        if not normalized.get("strict-transport-security"):
            findings.append(Finding("warning","hsts_response_header_missing",url,"Resposta HTTPS não enviou Strict-Transport-Security; validar a configuração gerenciada e os headers do Worker antes de ativar HSTS.", ""))
        if normalized.get("x-content-type-options","").lower()!="nosniff":
            findings.append(Finding("info","nosniff_response_header_missing",url,"Resposta pública não envia X-Content-Type-Options: nosniff."))
    return reported

def robots_audit(base, findings):
    url=base.rstrip("/")+"/robots.txt"; r=fetch(url); sitemaps=[]; disallow=[]
    for line in r["body"].splitlines():
        line=line.split("#",1)[0].strip()
        if ":" not in line: continue
        k,v=(x.strip() for x in line.split(":",1))
        if k.lower()=="sitemap": sitemaps.append(v)
        if k.lower()=="disallow" and v: disallow.append(v)
    if r["status"]!=200: findings.append(Finding("error","robots_http",url,f"robots.txt respondeu {r['status']}",r.get("error") or ""))
    if not sitemaps: findings.append(Finding("warning","robots_sitemap_missing",url,"Diretiva Sitemap não encontrada"))
    return {"url":url,"status":r["status"],"sitemaps":sitemaps,"disallow_rules":disallow,"body":r["body"]}

def sitemap_audit(url, findings):
    r=fetch(url)
    if r["status"]!=200:
        findings.append(Finding("error","sitemap_http",url,f"Sitemap respondeu {r['status']}",r.get("error") or ""))
        return {"url":url,"status":r["status"],"url_count":0,"urls":[],"errors":["Sitemap inacessível"]}
    try:
        root=ET.fromstring(r["body"])
        kind=root.tag.split("}")[-1]
        urls=[e.text.strip() for e in root.iter() if e.tag.split("}")[-1]=="loc" and e.text and e.text.strip()]
        errors=[]
        if kind not in ("urlset","sitemapindex"): errors.append(f"Elemento raiz inesperado: {kind}")
        if kind=="sitemapindex": errors.append("Sitemap index: filhos ainda não expandidos")
        if len(urls)>MAX_URLS: errors.append(f"Limitado a {MAX_URLS} de {len(urls)} URLs"); urls=urls[:MAX_URLS]
    except Exception as e:
        urls=[]; errors=[f"XML inválido: {e}"]
    if errors: findings.append(Finding("warning","sitemap_xml",url,"; ".join(errors)))
    return {"url":url,"status":r["status"],"url_count":len(urls),"urls":urls,"errors":errors}

def audit_site(url, crawl=False, max_pages=30):
    if not urllib.parse.urlsplit(url if "://" in url else "https://"+url).netloc: raise ValueError("URL inválida")
    if "://" not in url: url="https://"+url
    parts=urllib.parse.urlsplit(url)
    if parts.scheme not in ("http","https"): raise ValueError("Use uma URL HTTP ou HTTPS")
    base=f"{parts.scheme}://{parts.netloc}"; host=(parts.hostname or "").lower()
    findings=[]; pages=[]; redirect_checks=[]; queue=[url]; seen=set()
    while queue and len(seen)<(max_pages if crawl else 1):
        current=queue.pop(0)
        if current in seen: continue
        if (urllib.parse.urlsplit(current).hostname or "").lower()!=host: continue
        seen.add(current); response=fetch(current); redirect_checks.append(redirect_chain(current))
        page=page_audit(current,response,findings); pages.append(page)
        if crawl:
            for href in page["links"]:
                dest=urllib.parse.urldefrag(urllib.parse.urljoin(response["final_url"],href))[0]
                u=urllib.parse.urlsplit(dest)
                if u.scheme in ("http","https") and (u.hostname or "").lower()==host and dest not in seen and dest not in queue: queue.append(dest)
    if parts.scheme!="https": findings.append(Finding("warning","https_preferred","start_url","URL inicial não usa HTTPS",url))
    security_headers={}
    collected_header_findings=[]
    for page in pages:
        local_findings=[]
        security_headers[page["url"]]=audit_security_headers(page["final_url"],page.get("response_headers",{}),local_findings)
        collected_header_findings.extend(local_findings)
    # Aggregate a zone/Worker-wide header gap instead of subtracting the score once per URL.
    for check in ("hsts_response_header_missing","nosniff_response_header_missing"):
        affected=[f for f in collected_header_findings if f.check==check]
        if affected:
            first=affected[0]
            msg=first.message if len(affected)==1 else f"{first.message} Ausente em {len(affected)}/{len(pages)} páginas rastreadas."
            evidence=", ".join(f.url for f in affected)
            findings.append(Finding(first.severity,check,first.url,msg,evidence))
    robots=robots_audit(base,findings)
    sitemap_urls=robots["sitemaps"] or [base+"/sitemap.xml"]
    sitemaps=[sitemap_audit(s,findings) for s in sitemap_urls[:5]]
    title_map={}
    for p in pages:
        if p["title"]: title_map.setdefault(p["title"].lower(),[]).append(p["url"])
    for title,urls in title_map.items():
        if len(urls)>1:
            for u in urls: findings.append(Finding("warning","duplicate_title",u,"Title duplicado no conjunto rastreado",title))
    weights={"critical":25,"error":15,"warning":5,"info":1}
    score=max(0,100-sum(weights.get(f.severity,0) for f in findings))
    return {"tool":"Clinica SEO Gauntlet","version":"0.1.0","read_only":True,"start_url":url,
        "generated_at_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"pages_checked":len(pages),
        "robots":robots,"sitemaps":sitemaps,"redirect_checks":redirect_checks,"security_headers":security_headers,"pages":pages,
        "findings":[asdict(f) for f in findings],"summary":{"score_heuristic":score,
        "critical":sum(f.severity=="critical" for f in findings),"errors":sum(f.severity=="error" for f in findings),
        "warnings":sum(f.severity=="warning" for f in findings),"info":sum(f.severity=="info" for f in findings)}}

def main():
    ap=argparse.ArgumentParser(description="Auditoria SEO técnica pública, somente leitura")
    ap.add_argument("url"); ap.add_argument("--crawl",action="store_true")
    ap.add_argument("--max-pages",type=int,default=30); ap.add_argument("--json",default="seo-audit-report.json")
    ap.add_argument("--markdown",default="seo-audit-report.md"); args=ap.parse_args()
    try: report=audit_site(args.url,args.crawl,max(1,min(args.max_pages,30)))
    except ValueError as e: print(f"Erro: {e}",file=sys.stderr); return 2
    with open(args.json,"w",encoding="utf-8") as f: json.dump(report,f,ensure_ascii=False,indent=2)
    lines=["# Relatório SEO Gauntlet","",f"- URL: {report['start_url']}",f"- Páginas verificadas: {report['pages_checked']}",f"- Nota heurística: {report['summary']['score_heuristic']}/100","","## Resumo",""]
    lines += [f"- {k}: {v}" for k,v in report["summary"].items()]
    lines += ["","## Achados",""] + [f"- **{x['severity'].upper()} — {x['check']}** — {x['url']}: {x['message']} {('('+x['evidence']+')') if x['evidence'] else ''}" for x in report["findings"]]
    if not report["findings"]: lines.append("Nenhum achado automático.")
    lines += ["","## Páginas",""] + [f"- HTTP {p['status']} — {p['url']} — title: {p['title'] or '(ausente)'} — canonical: {', '.join(p['canonical']) or '(ausente)'}" for p in report["pages"]]
    with open(args.markdown,"w",encoding="utf-8") as f: f.write("\n".join(lines)+"\n")
    print(json.dumps({"summary":report["summary"],"reports":[args.json,args.markdown]},ensure_ascii=False,indent=2))
    return 0
if __name__=="__main__": raise SystemExit(main())
