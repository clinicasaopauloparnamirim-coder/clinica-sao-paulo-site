#!/usr/bin/env python3
"""Cross-page SEO checks: internal-link graph, link HTTP status, robots probes and sitemap hygiene."""
from __future__ import annotations
import json, sys, time, urllib.parse, urllib.robotparser
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from seo_audit import fetch, MAX_URLS

MAX_INTERNAL_LINKS=80

class LinkSchemaParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links=[]; self.meta={}; self.canonicals=[]; self.hreflang=[]; self.jsonld=[]
        self._in_script=False; self._script_type=""; self._buf=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="a" and a.get("href"):
            self.links.append({"href":a["href"],"rel":a.get("rel",""),"text":""})
        if tag=="meta":
            if a.get("name"): self.meta[a["name"].lower()]=a.get("content","")
            if a.get("property"): self.meta[a["property"].lower()]=a.get("content","")
        if tag=="link":
            if "canonical" in (a.get("rel") or "").lower().split() and a.get("href"): self.canonicals.append(a["href"])
            if "alternate" in (a.get("rel") or "").lower().split() and a.get("hreflang") and a.get("href"):
                self.hreflang.append({"lang":a["hreflang"],"href":a["href"]})
        if tag=="script":
            self._in_script=True; self._script_type=(a.get("type") or "").lower(); self._buf=[]
    def handle_endtag(self,tag):
        if tag=="script" and self._in_script:
            if self._script_type=="application/ld+json": self.jsonld.append("".join(self._buf))
            self._in_script=False; self._script_type=""; self._buf=[]
    def handle_data(self,data):
        if self._in_script: self._buf.append(data)
        if self.links: self.links[-1]["text"] += data

def walk_nodes(obj):
    if isinstance(obj,dict):
        yield obj
        for v in obj.values(): yield from walk_nodes(v)
    elif isinstance(obj,list):
        for v in obj: yield from walk_nodes(v)

def schema_issues(blobs):
    """Syntax-check JSON-LD and apply conservative, type-specific field checks."""
    types=set(); entities=[]; errors=[]
    for raw in blobs:
        try: payload=json.loads(raw)
        except Exception as e: errors.append(f"JSON-LD inválido: {e}"); continue
        for node in walk_nodes(payload):
            if not isinstance(node,dict): continue
            typ=node.get("@type")
            if isinstance(typ,str): type_names=[typ]
            elif isinstance(typ,list): type_names=[str(t) for t in typ]
            else: continue
            types.update(type_names)
            for type_name in type_names: entities.append((type_name,node))
    missing=[]
    for typ,node in entities:
        name=node.get("name")
        if typ in {"Dentist","MedicalClinic","LocalBusiness","Organization","WebSite","WebPage","Service","Product"} and not name:
            missing.append(f"{typ}: campo name ausente")
        if typ in {"Dentist","MedicalClinic","LocalBusiness"}:
            address=node.get("address")
            if not address or not isinstance(address,(dict,str)):
                missing.append(f"{typ}: campo address ausente")
            elif isinstance(address,dict):
                for field in ("streetAddress","addressLocality"):
                    if not address.get(field):
                        missing.append(f"{typ}.address: campo {field} ausente")
            if not node.get("telephone"):
                missing.append(f"{typ}: telefone ausente (recomendado para SEO local)")
        if typ=="BreadcrumbList" and not node.get("itemListElement"):
            missing.append("BreadcrumbList: itemListElement ausente")
        if typ=="FAQPage" and not node.get("mainEntity"):
            missing.append("FAQPage: mainEntity ausente")
        if typ=="Question":
            if not (node.get("name") or node.get("text")): missing.append("Question: name/text ausente")
            if not (node.get("acceptedAnswer") or node.get("suggestedAnswer")):
                missing.append("Question: acceptedAnswer/suggestedAnswer ausente")
        if typ=="Answer" and not node.get("text"): missing.append("Answer: text ausente")
        if typ=="GeoCoordinates":
            if node.get("latitude") is None: missing.append("GeoCoordinates: latitude ausente")
            if node.get("longitude") is None: missing.append("GeoCoordinates: longitude ausente")
        if typ=="OpeningHoursSpecification":
            for field in ("dayOfWeek","opens","closes"):
                if not node.get(field): missing.append(f"OpeningHoursSpecification: {field} ausente")
        if typ=="PostalAddress":
            for field in ("streetAddress","addressLocality"):
                if not node.get(field): missing.append(f"PostalAddress: {field} ausente")
        if typ=="ListItem" and node.get("position") is None:
            missing.append("ListItem: position ausente")
    return sorted(types), errors, sorted(set(missing))

def parse_sitemap(url):
    result=fetch(url)
    if result.get("status")!=200:
        return {"url":url,"status":result.get("status"),"entries":[],"errors":[f"HTTP {result.get('status')}"]}
    entries=[]; errors=[]
    try:
        root=ET.fromstring(result["body"]); kind=root.tag.split("}")[-1]
        for elem in root:
            tag=elem.tag.split("}")[-1]
            if kind=="urlset" and tag=="url":
                d={c.tag.split("}")[-1]:(c.text or "").strip() for c in elem}
                if d.get("loc"): entries.append(d)
            elif kind=="sitemapindex" and tag=="sitemap":
                d={c.tag.split("}")[-1]:(c.text or "").strip() for c in elem}
                if d.get("loc"): entries.append({"loc":d["loc"],"_entry_type":"sitemap"})
            if len(entries)>MAX_URLS: errors.append(f"Limitado a {MAX_URLS} entradas"); entries=entries[:MAX_URLS]; break
        if kind not in {"urlset","sitemapindex"}: errors.append(f"Elemento raiz inesperado: {kind}")
    except Exception as e: errors.append(f"XML inválido: {e}")
    return {"url":url,"status":result["status"],"entries":entries,"errors":errors}

def audit(report_path="seo-audit-report.json", output_path="seo-audit-crosspage.json"):
    with open(report_path,encoding="utf-8") as f: base=json.load(f)
    started=time.monotonic(); start=base["start_url"]; parts=urllib.parse.urlsplit(start)
    root=f"{parts.scheme}://{parts.netloc}"; host=(parts.hostname or "").lower()
    findings=[]; per_page=[]; graph={}; unique_internal={}
    robots=base.get("robots",{}); rp=urllib.robotparser.RobotFileParser()
    rp.set_url(robots.get("url",root+"/robots.txt")); rp.parse((robots.get("body") or "").splitlines())
    probes=[]
    for agent in ("Googlebot","Bingbot","GPTBot","ClaudeBot","PerplexityBot","*"):
        for path in ("/","/robots.txt","/sitemap.xml"):
            allowed=rp.can_fetch(agent,urllib.parse.urljoin(root,path))
            probes.append({"user_agent":agent,"path":path,"allowed":allowed})
            if path=="/" and not allowed:
                findings.append({"severity":"error","check":"robots_home_blocked","url":root+path,"message":f"robots.txt bloqueia a página inicial para {agent}"})
    sitemap_entries=[]; sitemap_errors=[]; sitemap_urls=[]
    for sm in base.get("sitemaps",[]):
        smdata=parse_sitemap(sm.get("url",root+"/sitemap.xml"))
        sitemap_errors.extend(smdata["errors"])
        for e in smdata["entries"]:
            loc=e["loc"]
            if e.get("_entry_type")=="sitemap":
                sitemap_errors.append(f"Sitemap index filho não expandido: {loc}")
                continue
            sitemap_entries.append(e); sitemap_urls.append(loc)
            if (urllib.parse.urlsplit(loc).hostname or "").lower()!=host:
                findings.append({"severity":"warning","check":"sitemap_cross_host","url":smdata["url"],"message":"Sitemap inclui URL de outro host","evidence":loc})
            if not e.get("lastmod"):
                findings.append({"severity":"info","check":"sitemap_lastmod_missing","url":loc,"message":"Entrada sem lastmod (opcional, mas útil para diagnóstico)"})
    counts={}
    checked_pages=base.get("pages",[])
    for pg in checked_pages:
        url=pg["url"]; response=fetch(url); parser=LinkSchemaParser(); parser.feed(response.get("body",""))
        outgoing=[]; external=[]; bad_links=[]; mixed=[]
        for link in parser.links:
            href=link["href"].strip()
            if not href or href.startswith(("#","mailto:","tel:","javascript:","data:")): continue
            dest=urllib.parse.urldefrag(urllib.parse.urljoin(url,href))[0]
            up=urllib.parse.urlsplit(dest)
            if up.scheme not in ("http","https"): continue
            if (up.hostname or "").lower()==host:
                outgoing.append(dest); counts[dest]=counts.get(dest,0)+1
                unique_internal.setdefault(dest,{"source":url,"anchor":link["text"].strip()[:140]})
            else: external.append(dest)
        typelist,jsonld_errors,schema_missing=schema_issues(parser.jsonld)
        if jsonld_errors:
            findings.append({"severity":"error","check":"jsonld_syntax","url":url,"message":"; ".join(jsonld_errors)})
        if schema_missing:
            findings.append({"severity":"warning","check":"schema_fields_missing","url":url,"message":"Campos de schema esperados ausentes","evidence":"; ".join(schema_missing)})
        if not parser.meta.get("og:title"): findings.append({"severity":"info","check":"og_title_missing","url":url,"message":"Open Graph og:title ausente"})
        if not parser.meta.get("og:description"): findings.append({"severity":"info","check":"og_description_missing","url":url,"message":"Open Graph og:description ausente"})
        if not parser.meta.get("twitter:card"): findings.append({"severity":"info","check":"twitter_card_missing","url":url,"message":"Twitter Card twitter:card ausente"})
        per_page.append({"url":url,"status":response.get("status"),"internal_outlinks":len(set(outgoing)),
            "outgoing_internal_urls":sorted(set(outgoing)),"external_links_count":len(set(external)),
            "schema_types":typelist,"jsonld_blocks":len(parser.jsonld),"hreflang":parser.hreflang,
            "canonical":parser.canonicals,"open_graph_title":parser.meta.get("og:title",""),
            "twitter_card":parser.meta.get("twitter:card","")})
    for dest,entry in unique_internal.items():
        u=urllib.parse.urlsplit(dest)
        # Avoid duplicative tracking or fragments: each normalized URL is checked once.
        check=fetch(dest)
        entry["status"]=check.get("status"); entry["final_url"]=check.get("final_url")
        if check.get("status") is None or check.get("status")>=400:
            findings.append({"severity":"error","check":"broken_internal_link","url":entry["source"],"message":f"Link interno responde {check.get('status')}","evidence":dest})
    sitemap_set=set(sitemap_urls); crawled_set={p["url"] for p in checked_pages}
    for loc in sitemap_set-crawled_set:
        # Don't classify sitemap pages as orphan automatically; unvisited is distinct from orphan.
        findings.append({"severity":"info","check":"sitemap_url_not_crawled","url":loc,"message":"URL está no sitemap, mas não entrou no conjunto de páginas visitadas"})
    for loc in sitemap_set:
        if counts.get(loc,0)==0 and loc!=start:
            findings.append({"severity":"warning","check":"orphan_or_unlinked_sitemap_url","url":loc,"message":"URL do sitemap sem links internos encontrados no conjunto rastreado; validar antes de classificar como órfã"})
    # Duplicate sitemap locations are an unambiguous hygiene issue.
    seen=set()
    for loc in sitemap_urls:
        if loc in seen: findings.append({"severity":"warning","check":"sitemap_duplicate_url","url":loc,"message":"URL repetida no sitemap"})
        seen.add(loc)
    severity_counts={k:sum(f["severity"]==k for f in findings) for k in ("critical","error","warning","info")}
    result={"tool":"Clinica SEO Gauntlet Cross-page","version":"0.1.0","read_only":True,"start_url":start,
        "robots_probes":probes,"sitemap_entries":sitemap_entries,"sitemap_errors":sitemap_errors,
        "pages":per_page,"internal_link_targets":unique_internal,
        "findings":findings,"summary":{"pages_checked":len(per_page),"unique_internal_targets_checked":len(unique_internal),
            "sitemap_entries":len(sitemap_entries),"robots_probes":len(probes),"duration_seconds":round(time.monotonic()-started,2),
            **severity_counts}}
    with open(output_path,"w",encoding="utf-8") as f: json.dump(result,f,ensure_ascii=False,indent=2)
    print(json.dumps({"summary":result["summary"],"output":output_path},ensure_ascii=False,indent=2))
    return result

if __name__=="__main__":
    try: audit(sys.argv[1] if len(sys.argv)>1 else "seo-audit-report.json",sys.argv[2] if len(sys.argv)>2 else "seo-audit-crosspage.json")
    except Exception as e:
        print(f"Cross-page audit failed: {type(e).__name__}: {e}",file=sys.stderr); raise
