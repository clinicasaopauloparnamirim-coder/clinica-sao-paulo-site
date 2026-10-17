#!/usr/bin/env python3
"""Read-only Google PageSpeed Insights adapter. Requires PSI_API_KEY for reliable quota; never invents scores."""
from __future__ import annotations
import argparse, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from typing import Any

API="https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
CATEGORIES=("performance","accessibility","best-practices","seo")
LAB_KEYS=("first-contentful-paint","largest-contentful-paint","speed-index","total-blocking-time","cumulative-layout-shift","time-to-interactive","server-response-time","interactive")

def normalize_psi_response(url: str, strategy: str, http_status: int|None, payload: dict[str,Any], error: str|None=None) -> dict[str,Any]:
    error_obj=payload.get("error") if isinstance(payload,dict) else None
    if http_status != 200 or error_obj:
        code=(error_obj or {}).get("code",http_status)
        message=(error_obj or {}).get("message") or error or "PageSpeed Insights indisponível"
        quota_limited=code==429 or "quota exceeded" in str(message).lower() or "rate limit" in str(message).lower()
        return {"tool":"Clinica SEO Gauntlet PageSpeed","version":"0.1.0","url":url,"strategy":strategy,
            "status":"quota_limited" if quota_limited else "unavailable","http_status":http_status,
            "error":{"code":code,"message":str(message)[:800]},"scores":{},"lab_metrics":{},"field_data":None,
            "summary":{"score_count":0,"field_data_available":False,"status":"not_measured"}}
    lr=payload.get("lighthouseResult") or {}
    categories=lr.get("categories") or {}
    scores={}
    for key in CATEGORIES:
        value=(categories.get(key) or {}).get("score")
        scores[key]=round(float(value)*100) if isinstance(value,(int,float)) else None
    audits=lr.get("audits") or {}
    lab={}
    for key in LAB_KEYS:
        a=audits.get(key)
        if isinstance(a,dict):
            lab[key]={"title":a.get("title"),"displayValue":a.get("displayValue"),"numericValue":a.get("numericValue"),
                      "numericUnit":a.get("numericUnit"),"score":a.get("score"),"scoreDisplayMode":a.get("scoreDisplayMode")}
    field=(payload.get("loadingExperience") or {}).get("metrics")
    origin_field=(payload.get("originLoadingExperience") or {}).get("metrics")
    field_data={"url_metrics":field,"origin_metrics":origin_field,
        "url_status":(payload.get("loadingExperience") or {}).get("overall_category"),
        "origin_status":(payload.get("originLoadingExperience") or {}).get("overall_category")}
    available=bool(field or origin_field)
    return {"tool":"Clinica SEO Gauntlet PageSpeed","version":"0.1.0","url":url,"strategy":strategy,
        "status":"measured" if lr else "no_lighthouse_result","http_status":http_status,
        "requested_categories":list(CATEGORIES),"scores":scores,"lab_metrics":lab,
        "field_data":field_data if available else None,
        "summary":{"score_count":sum(v is not None for v in scores.values()),"field_data_available":available,
                   "field_data_status":field_data["url_status"] or field_data["origin_status"] or ("no_data" if not available else "unknown"),
                   "lighthouse_version":lr.get("lighthouseVersion"),"fetch_time":lr.get("fetchTime")}}

def run_psi(url: str, strategy: str="mobile", api_key: str|None=None, timeout: int=90) -> dict[str,Any]:
    if strategy not in ("mobile","desktop"): raise ValueError("strategy deve ser mobile ou desktop")
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme not in ("https","http") or not parsed.netloc: raise ValueError("Informe uma URL pública HTTP/HTTPS válida")
    params=[("url",url),("strategy",strategy)]+[("category",c) for c in CATEGORIES]
    if api_key: params.append(("key",api_key))
    request_url=API+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(request_url,headers={"Accept":"application/json","User-Agent":"ClinicaSEO-Gauntlet/0.1"},method="GET")
    started=time.monotonic()
    try:
        with urllib.request.urlopen(req,timeout=timeout) as res:
            payload=json.loads(res.read(12_000_000).decode("utf-8"))
            report=normalize_psi_response(url,strategy,res.status,payload)
    except urllib.error.HTTPError as e:
        try: payload=json.loads(e.read(1_000_000).decode("utf-8"))
        except Exception: payload={}
        report=normalize_psi_response(url,strategy,e.code,payload,str(e))
    except Exception as e:
        report=normalize_psi_response(url,strategy,None,{},f"{type(e).__name__}: {e}")
    report["duration_seconds"]=round(time.monotonic()-started,2)
    report["api_key_configured"]=bool(api_key)
    # A generic HTTP error string may echo the request URL, which contains the key query parameter.
    # Never persist an API key into a JSON report or CI artifact.
    if api_key and isinstance(report.get("error"),dict):
        message=str(report["error"].get("message",""))
        report["error"]["message"]=message.replace(api_key,"[REDACTED]")
        report["error"]["message"]=report["error"]["message"].replace(urllib.parse.quote(api_key,safe=""),"[REDACTED]")
    return report

def main():
    p=argparse.ArgumentParser(description="PageSpeed Insights / lab + field data (GET only)")
    p.add_argument("url"); p.add_argument("--strategy",choices=("mobile","desktop"),default="mobile")
    p.add_argument("--json",default="pagespeed-report.json")
    args=p.parse_args()
    report=run_psi(args.url,args.strategy,os.environ.get("PSI_API_KEY"))
    with open(args.json,"w",encoding="utf-8") as f: json.dump(report,f,ensure_ascii=False,indent=2)
    print(json.dumps({"status":report["status"],"scores":report["scores"],"field_data":report["summary"],"error":report.get("error"),"output":args.json},ensure_ascii=False,indent=2))
    return 0 if report["status"]=="measured" else 1
if __name__=="__main__": raise SystemExit(main())
