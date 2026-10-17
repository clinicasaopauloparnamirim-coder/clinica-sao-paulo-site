#!/usr/bin/env python3
"""Read-only Cloudflare SEO/edge audit. Uses GET requests only and never serializes token values."""
from __future__ import annotations
import argparse, json, os, sys, time, urllib.parse, urllib.request, urllib.error
from typing import Any

API="https://api.cloudflare.com/client/v4"
SITE_DOMAIN="clinicasaopauloparnamirim.com.br"
DEFAULT_WORKER="clinica-sao-paulo-site"

class CloudflareAPI:
    def __init__(self, token: str, timeout: int=15):
        if not token: raise ValueError("CF_API_TOKEN ausente")
        self.token=token; self.timeout=timeout
    def get(self,path: str, query: dict[str,Any]|None=None) -> dict[str,Any]:
        url=API+path
        if query: url += "?"+urllib.parse.urlencode({k:v for k,v in query.items() if v is not None})
        req=urllib.request.Request(url,headers={"Authorization":"Bearer "+self.token,"Accept":"application/json","User-Agent":"ClinicaSEO-Gauntlet/0.1"},method="GET")
        try:
            with urllib.request.urlopen(req,timeout=self.timeout) as response:
                data=json.loads(response.read(4_000_000).decode("utf-8"))
                return {"http_status":response.status,"success":bool(data.get("success")),"result":data.get("result"),"errors":data.get("errors",[]),"result_info":data.get("result_info")}
        except urllib.error.HTTPError as e:
            try: data=json.loads(e.read(500_000).decode("utf-8"))
            except Exception: data={}
            return {"http_status":e.code,"success":False,"result":data.get("result"),"errors":data.get("errors",[]),"error":"Cloudflare API HTTP error"}
        except Exception as e:
            return {"http_status":None,"success":False,"result":None,"errors":[],"error":f"{type(e).__name__}: {e}"}

def assess_cloudflare(zone: dict[str,Any], settings: dict[str,Any], dns_records: list[dict[str,Any]],
                      worker_domains: list[dict[str,Any]], worker_scripts: list[dict[str,Any]],
                      expected_worker: str=DEFAULT_WORKER, domain: str=SITE_DOMAIN) -> dict[str,Any]:
    findings=[]; setting_map={s.get("id"):s.get("value") for s in settings if isinstance(s,dict)}
    domain_map={d.get("hostname"):d for d in worker_domains if d.get("hostname")}
    scripts={s.get("id") or s.get("script"):s for s in worker_scripts if (s.get("id") or s.get("script"))}
    def add(severity,check,message,evidence=None):
        findings.append({"severity":severity,"check":check,"message":message,**({"evidence":evidence} if evidence is not None else {})})
    if zone.get("status")!="active" or zone.get("paused"):
        add("error","zone_not_active","A zona não está ativa ou está pausada",{"status":zone.get("status"),"paused":zone.get("paused")})
    ssl=setting_map.get("ssl")
    if ssl=="flexible":
        add("warning","ssl_mode_flexible_review","SSL/TLS está em Flexible. Revisar se há origem HTTP real e se Full (strict) é aplicável; não alterar automaticamente.",{"ssl":ssl,"context":"Custom Worker domains may not use a conventional origin."})
    elif ssl in ("off",None):
        add("error","ssl_mode_weak","SSL/TLS não está em um modo seguro reconhecido",{"ssl":ssl})
    if setting_map.get("always_use_https")!="on":
        add("warning","always_https_off","Always Use HTTPS não está ligado",{"value":setting_map.get("always_use_https")})
    if setting_map.get("automatic_https_rewrites")!="on":
        add("info","https_rewrites_off","Automatic HTTPS Rewrites está desligado",{"value":setting_map.get("automatic_https_rewrites")})
    if setting_map.get("brotli")!="on":
        add("info","brotli_off","Brotli está desligado",{"value":setting_map.get("brotli")})
    if setting_map.get("rocket_loader")=="on":
        add("info","rocket_loader_on","Rocket Loader está ligado; verificar scripts/tags e conversões",{"value":"on"})
    tls_version=setting_map.get("min_tls_version")
    try:
        if tls_version is not None and float(tls_version)<1.2:
            add("warning","minimum_tls_version_legacy","A versão mínima de TLS está abaixo de 1.2; avaliar elevação após validar compatibilidade dos clientes.",{"min_tls_version":tls_version})
    except (TypeError,ValueError):
        add("info","minimum_tls_version_unknown","A versão mínima de TLS não pôde ser interpretada",{"min_tls_version":tls_version})
    apex=domain
    www="www."+domain
    apex_domain=domain_map.get(apex); www_domain=domain_map.get(www)
    if not apex_domain:
        add("error","apex_worker_domain_missing","Domínio raiz não aparece entre os custom domains de Worker",{"hostname":apex})
    if not www_domain:
        add("warning","www_worker_domain_missing","www não aparece entre os custom domains de Worker",{"hostname":www})
    if apex_domain and www_domain and apex_domain.get("service")!=www_domain.get("service"):
        add("error","worker_domain_service_mismatch","Domínio raiz e www apontam para Workers diferentes",{"apex_service":apex_domain.get("service"),"www_service":www_domain.get("service")})
    served_worker=apex_domain.get("service") if apex_domain else None
    if served_worker and expected_worker and served_worker!=expected_worker:
        served_etag=(scripts.get(served_worker) or {}).get("etag")
        expected_etag=(scripts.get(expected_worker) or {}).get("etag")
        evidence={"served_worker":served_worker,"expected_worker":expected_worker}
        if served_etag and expected_etag: evidence["same_etag"]=served_etag==expected_etag
        add("warning","production_worker_name_mismatch","O domínio público está associado a um Worker diferente do nome esperado pelo repositório; confirmar o destino do pipeline antes de novos deploys.",evidence)
        if served_etag and expected_etag and served_etag!=expected_etag:
            add("error","production_worker_content_mismatch","ETags dos Workers de produção e do repositório diferem",evidence)
    records_by_name={}
    for r in dns_records:
        if r.get("name"): records_by_name.setdefault(r["name"],[]).append(r)
    for hostname in (apex,www):
        recs=records_by_name.get(hostname,[])
        if not recs: add("warning","dns_record_not_found",f"Nenhum registro DNS direto encontrado para {hostname}",{"hostname":hostname})
        elif not any(bool(x.get("proxied")) for x in recs):
            add("info","dns_not_proxied",f"Nenhum registro de {hostname} está proxied",{"types":sorted({x.get("type","") for x in recs})})
    # DNS content is intentionally omitted from the report.
    safe_dns=[{"type":r.get("type"),"name":r.get("name"),"proxied":r.get("proxied"),"ttl":r.get("ttl")} for r in dns_records]
    safe_settings={k:setting_map.get(k) for k in ("ssl","always_use_https","automatic_https_rewrites","brotli","browser_cache_ttl","cache_level","rocket_loader","http2","http3","min_tls_version","tls_1_3","security_level")}
    return {"tool":"Clinica SEO Gauntlet Cloudflare Read-only","version":"0.1.0","read_only":True,"domain":domain,
        "zone":{"name":zone.get("name"),"status":zone.get("status"),"paused":zone.get("paused"),"plan":(zone.get("plan") or {}).get("name")},
        "settings":safe_settings,"worker_domains":[{"hostname":d.get("hostname"),"service":d.get("service"),"environment":d.get("environment")} for d in worker_domains],
        "worker_inventory":[{"name":s.get("id") or s.get("script"),"etag":s.get("etag")} for s in worker_scripts],
        "dns_records":safe_dns,"findings":findings,
        "summary":{"errors":sum(x["severity"]=="error" for x in findings),"warnings":sum(x["severity"]=="warning" for x in findings),"info":sum(x["severity"]=="info" for x in findings)}}

def run_live(domain=SITE_DOMAIN,expected_worker=DEFAULT_WORKER):
    token=os.environ.get("CF_API_TOKEN","")
    api=CloudflareAPI(token)
    zones_resp=api.get("/zones",{"name":domain,"per_page":50})
    if not zones_resp.get("success"): raise RuntimeError("Não foi possível listar zonas Cloudflare: "+str(zones_resp.get("errors") or zones_resp.get("error")))
    zones=zones_resp.get("result") or []
    zone=next((z for z in zones if z.get("name")==domain),None)
    if not zone: raise RuntimeError(f"Zona {domain} não encontrada na conta conectada")
    zone_id=zone["id"]; account_id=(zone.get("account") or {}).get("id") or os.environ.get("CF_ACCOUNT_ID")
    if not account_id: raise RuntimeError("CF_ACCOUNT_ID ausente e zona não informou account.id")
    settings_resp=api.get(f"/zones/{zone_id}/settings")
    dns=[]; page=1
    while page<=5:
        dr=api.get(f"/zones/{zone_id}/dns_records",{"per_page":100,"page":page})
        if not dr.get("success"): raise RuntimeError("Falha lendo DNS records")
        dns.extend(dr.get("result") or [])
        total_pages=(dr.get("result_info") or {}).get("total_pages",1)
        if page>=total_pages: break
        page+=1
    domains_resp=api.get(f"/accounts/{account_id}/workers/domains",{"zone_id":zone_id})
    scripts_resp=api.get(f"/accounts/{account_id}/workers/scripts",{"per_page":100})
    for name,resp in (("settings",settings_resp),("worker domains",domains_resp),("worker scripts",scripts_resp)):
        if not resp.get("success"): raise RuntimeError(f"Falha lendo {name} na Cloudflare")
    report=assess_cloudflare(zone,settings_resp.get("result") or [],dns,domains_resp.get("result") or [],scripts_resp.get("result") or [],expected_worker,domain)
    report["generated_at_utc"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    return report

def main():
    ap=argparse.ArgumentParser(description="Auditoria somente leitura de Cloudflare: DNS, SSL/HTTPS e Worker bindings.")
    ap.add_argument("--domain",default=os.environ.get("CF_ZONE_NAME",SITE_DOMAIN))
    ap.add_argument("--expected-worker",default=os.environ.get("CF_EXPECTED_WORKER",DEFAULT_WORKER))
    ap.add_argument("--json",default="cloudflare-audit-report.json")
    ap.add_argument("--markdown",default="cloudflare-audit-report.md")
    args=ap.parse_args()
    report=run_live(args.domain,args.expected_worker)
    with open(args.json,"w",encoding="utf-8") as f: json.dump(report,f,ensure_ascii=False,indent=2)
    lines=["# Cloudflare SEO/Edge Audit","",f"- Domínio: {report['domain']}","- Modo: somente leitura","", "## Settings", ""]
    lines += [f"- {k}: {v}" for k,v in report["settings"].items()]
    lines += ["","## Achados",""]+[f"- **{x['severity'].upper()} — {x['check']}**: {x['message']} {json.dumps(x.get('evidence',{}),ensure_ascii=False)}" for x in report["findings"]]
    with open(args.markdown,"w",encoding="utf-8") as f: f.write("\n".join(lines)+"\n")
    print(json.dumps({"summary":report["summary"],"settings":report["settings"],"workers":report["worker_domains"],"reports":[args.json,args.markdown]},ensure_ascii=False,indent=2))
    return 0
if __name__=="__main__": raise SystemExit(main())
