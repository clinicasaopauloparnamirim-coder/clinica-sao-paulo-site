import json, sys, unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crosspage_checks as cross

class CrossPageTests(unittest.TestCase):
    def test_collects_hreflang_open_graph_and_links(self):
        p=cross.LinkSchemaParser()
        p.feed('<html><head><meta property="og:title" content="Title"><link rel="alternate" hreflang="pt-BR" href="/pt/"></head><body><a href="/dentista/">Dentista</a><script type="application/ld+json">{"@graph":[{"@type":"Dentist","name":"Dr X","address":{"streetAddress":"Rua"}}]}</script></body></html>')
        self.assertEqual(p.meta["og:title"],"Title")
        self.assertEqual(p.hreflang,[{"lang":"pt-BR","href":"/pt/"}])
        self.assertEqual(p.links[0]["href"],"/dentista/")
        self.assertEqual(len(p.jsonld),1)
        types, errors, missing=cross.schema_issues(p.jsonld)
        self.assertIn("Dentist",types)
        self.assertEqual(errors,[])
        self.assertEqual(missing,[])

    def test_schema_missing_address_flag(self):
        types, errors, missing=cross.schema_issues(['{"@type":"MedicalClinic","name":"Clinic"}'])
        self.assertIn("MedicalClinic",types)
        self.assertTrue(any("address ausente" in m for m in missing))

    def test_schema_bad_json_reported(self):
        types, errors, missing=cross.schema_issues(["{bad"])
        self.assertEqual(types,[])
        self.assertTrue(errors)

    def test_sitemap_parse_checks_status_and_extracts_lastmod(self):
        fake={"status":200,"body":'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.test/</loc><lastmod>2026-10-13</lastmod></url></urlset>'}
        with patch.object(cross,"fetch",return_value=fake):
            sm=cross.parse_sitemap("https://example.test/sitemap.xml")
        self.assertEqual(sm["status"],200)
        self.assertEqual(sm["entries"][0]["loc"],"https://example.test/")
        self.assertEqual(sm["entries"][0]["lastmod"],"2026-10-13")

    def test_sitemap_index_is_distinguished(self):
        fake={"status":200,"body":'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.test/sub.xml</loc></sitemap></sitemapindex>'}
        with patch.object(cross,"fetch",return_value=fake):
            sm=cross.parse_sitemap("https://example.test/sitemap.xml")
        self.assertEqual(sm["entries"][0]["_entry_type"],"sitemap")

if __name__ == "__main__":
    unittest.main(verbosity=2)
