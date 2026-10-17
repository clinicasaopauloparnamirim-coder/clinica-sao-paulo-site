import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import seo_audit

class SEOAuditUnitTests(unittest.TestCase):
    def test_parser_extracts_title_meta_canonical_and_lang(self):
        p = seo_audit.Parser()
        p.feed('<html lang="pt-BR"><head><title>Clínica Teste</title><meta name="description" content="Descrição"><link rel="canonical" href="/"></head><body><h1>Principal</h1></body></html>')
        self.assertEqual(p.lang, "pt-BR")
        self.assertEqual("".join(p.title), "Clínica Teste")
        self.assertEqual(p.meta["description"], "Descrição")
        self.assertEqual(p.canonical, ["/"])
        self.assertEqual(p.headings, ["h1"])

    def test_page_audit_accepts_basic_valid_page(self):
        html = '<html lang="pt-BR"><head><title>Clínica Teste</title><meta name="description" content="Descrição útil"><link rel="canonical" href="https://example.test/"></head><body><h1>Olá</h1><img src="x.jpg" alt="Foto"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist"}</script></body></html>'
        findings = []
        result = seo_audit.page_audit("https://example.test/", {"status":200,"final_url":"https://example.test/","body":html,"headers":{"Content-Type":"text/html"},"elapsed_ms":1}, findings)
        self.assertEqual(result["title"], "Clínica Teste")
        self.assertEqual(result["canonical"], ["https://example.test/"])
        self.assertEqual(result["jsonld_blocks"], 1)
        self.assertEqual(findings, [])

    def test_missing_title_canonical_and_alt_are_flagged(self):
        html = '<html><head><meta name="description" content="Desc"></head><body><h1>Olá</h1><img src="x.jpg"></body></html>'
        findings = []
        seo_audit.page_audit("https://example.test/", {"status":200,"final_url":"https://example.test/","body":html,"headers":{},"elapsed_ms":1}, findings)
        checks = {f.check for f in findings}
        self.assertIn("title_missing", checks)
        self.assertIn("canonical_missing", checks)
        self.assertIn("html_lang_missing", checks)
        self.assertIn("image_alt_missing", checks)

    def test_noindex_and_multiple_canonicals_flagged(self):
        html = '<html lang="pt-BR"><head><title>T</title><meta name="robots" content="noindex"><link rel="canonical" href="/a"><link rel="canonical" href="/b"></head><body><h1>H</h1></body></html>'
        findings = []
        seo_audit.page_audit("https://example.test/", {"status":200,"final_url":"https://example.test/","body":html,"headers":{},"elapsed_ms":1}, findings)
        checks = {f.check for f in findings}
        self.assertIn("noindex", checks)
        self.assertIn("canonical_multiple", checks)

    def test_invalid_jsonld_flagged(self):
        html = '<html lang="pt-BR"><head><title>T</title></head><body><script type="application/ld+json">{bad}</script></body></html>'
        findings = []
        seo_audit.page_audit("https://example.test/", {"status":200,"final_url":"https://example.test/","body":html,"headers":{},"elapsed_ms":1}, findings)
        self.assertIn("jsonld_invalid", {f.check for f in findings})

    def test_security_header_audit_flags_missing_hsts_and_nosniff(self):
        findings=[]
        result=seo_audit.audit_security_headers("https://example.test/",{},findings)
        self.assertNotIn("strict-transport-security",result)
        self.assertIn("hsts_response_header_missing",{f.check for f in findings})
        self.assertIn("nosniff_response_header_missing",{f.check for f in findings})

    def test_security_header_audit_accepts_hsts_and_nosniff(self):
        findings=[]
        result=seo_audit.audit_security_headers("https://example.test/",{
            "Strict-Transport-Security":"max-age=31536000; includeSubDomains",
            "X-Content-Type-Options":"nosniff"
        },findings)
        self.assertIn("strict-transport-security",result)
        self.assertEqual(findings,[])

    def test_http_url_does_not_get_hsts_failure(self):
        findings=[]
        seo_audit.audit_security_headers("http://example.test/",{},findings)
        self.assertEqual(findings,[])

    def test_rejects_non_http_scheme(self):
        with self.assertRaises(ValueError):
            seo_audit.audit_site("ftp://example.test/")

if __name__ == "__main__":
    unittest.main(verbosity=2)
