import sys, unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cloudflare_audit as cf

class CloudflareAuditTests(unittest.TestCase):
    def test_healthy_worker_zone_has_no_findings(self):
        zone={"name":"example.test","status":"active","paused":False,"plan":{"name":"Free"}}
        settings=[{"id":"ssl","value":"full"},{"id":"always_use_https","value":"on"},{"id":"automatic_https_rewrites","value":"on"},{"id":"brotli","value":"on"},{"id":"rocket_loader","value":"off"},{"id":"min_tls_version","value":"1.2"}]
        dns=[{"name":"example.test","type":"AAAA","proxied":True},{"name":"www.example.test","type":"AAAA","proxied":True}]
        domains=[{"hostname":"example.test","service":"site-worker","environment":"production"},{"hostname":"www.example.test","service":"site-worker","environment":"production"}]
        scripts=[{"id":"site-worker","etag":"same"}]
        r=cf.assess_cloudflare(zone,settings,dns,domains,scripts,"site-worker","example.test")
        self.assertEqual(r["summary"]["errors"],0)
        self.assertEqual(r["summary"]["warnings"],0)
        self.assertEqual(r["summary"]["info"],0)
        self.assertTrue(r["read_only"])

    def test_flags_flexible_ssl_and_worker_name_mismatch_without_mutations(self):
        zone={"name":"example.test","status":"active","paused":False,"plan":{"name":"Free"}}
        settings=[{"id":"ssl","value":"flexible"},{"id":"always_use_https","value":"on"},{"id":"automatic_https_rewrites","value":"on"},{"id":"brotli","value":"on"},{"id":"rocket_loader","value":"off"},{"id":"min_tls_version","value":"1.0"}]
        dns=[{"name":"example.test","type":"AAAA","proxied":True},{"name":"www.example.test","type":"AAAA","proxied":True}]
        domains=[{"hostname":"example.test","service":"temporary-worker","environment":"production"},{"hostname":"www.example.test","service":"temporary-worker","environment":"production"}]
        scripts=[{"id":"temporary-worker","etag":"same"},{"id":"site-worker","etag":"same"}]
        r=cf.assess_cloudflare(zone,settings,dns,domains,scripts,"site-worker","example.test")
        checks={x["check"] for x in r["findings"]}
        self.assertIn("ssl_mode_flexible_review",checks)
        self.assertIn("production_worker_name_mismatch",checks)
        self.assertIn("minimum_tls_version_legacy",checks)
        self.assertTrue(r["read_only"])

    def test_different_worker_etags_flag_mismatch(self):
        r=cf.assess_cloudflare({"name":"example.test","status":"active","paused":False},
          [{"id":"ssl","value":"full"},{"id":"always_use_https","value":"on"}],
          [{"name":"example.test","type":"A","proxied":True},{"name":"www.example.test","type":"A","proxied":True}],
          [{"hostname":"example.test","service":"public"},{"hostname":"www.example.test","service":"public"}],
          [{"id":"public","etag":"a"},{"id":"site-worker","etag":"b"}],"site-worker","example.test")
        self.assertIn("production_worker_content_mismatch",{x["check"] for x in r["findings"]})

    def test_actual_read_only_snapshot_detects_configuration_reviews(self):
        # Sanitized snapshot taken from Cloudflare's read-only API on 2026-10-17.
        zone={"name":"clinicasaopauloparnamirim.com.br","status":"active","paused":False,"plan":{"name":"Free Website"}}
        settings=[
          {"id":"ssl","value":"flexible"},{"id":"always_use_https","value":"on"},
          {"id":"automatic_https_rewrites","value":"on"},{"id":"brotli","value":"on"},
          {"id":"rocket_loader","value":"off"},{"id":"min_tls_version","value":"1.0"},
          {"id":"browser_cache_ttl","value":14400},{"id":"cache_level","value":"aggressive"}
        ]
        dns=[{"name":"clinicasaopauloparnamirim.com.br","type":"AAAA","proxied":True},
             {"name":"www.clinicasaopauloparnamirim.com.br","type":"AAAA","proxied":True},
             {"name":"clinicasaopauloparnamirim.com.br","type":"TXT","proxied":False}]
        domains=[{"hostname":"clinicasaopauloparnamirim.com.br","service":"weathered-tree-2839","environment":"production"},
                 {"hostname":"www.clinicasaopauloparnamirim.com.br","service":"weathered-tree-2839","environment":"production"}]
        scripts=[{"id":"clinica-sao-paulo-site","etag":"same-live-etag"},
                 {"id":"weathered-tree-2839","etag":"same-live-etag"}]
        r=cf.assess_cloudflare(zone,settings,dns,domains,scripts,"clinica-sao-paulo-site","clinicasaopauloparnamirim.com.br")
        checks={x["check"] for x in r["findings"]}
        self.assertIn("ssl_mode_flexible_review",checks)
        self.assertIn("minimum_tls_version_legacy",checks)
        self.assertIn("production_worker_name_mismatch",checks)
        self.assertEqual(r["summary"]["errors"],0)
        self.assertEqual(r["summary"]["warnings"],3)

    def test_dns_record_contents_are_not_in_report(self):
        r=cf.assess_cloudflare({"name":"example.test","status":"active","paused":False},
          [{"id":"ssl","value":"full"},{"id":"always_use_https","value":"on"}],
          [{"name":"example.test","type":"TXT","content":"sensitive-verification-token","proxied":False}],
          [{"hostname":"example.test","service":"site-worker"}], [{"id":"site-worker","etag":"a"}],"site-worker","example.test")
        self.assertNotIn("sensitive-verification-token",str(r))

if __name__ == "__main__":
    unittest.main(verbosity=2)
