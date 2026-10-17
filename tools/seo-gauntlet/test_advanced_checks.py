import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from advanced_checks import ResourceParser, extract_schema_types

class AdvancedSEOTests(unittest.TestCase):
    def test_detects_http_resources_on_parser_input(self):
        p=ResourceParser()
        p.feed('<html><body><img src="http://cdn.example.test/a.jpg"><script src="https://cdn.example.test/app.js"></script><source srcset="http://cdn.example.test/a.webp 1x, https://cdn.example.test/b.webp 2x"></body></html>')
        urls=[x["url"] for x in p.refs]
        self.assertIn("http://cdn.example.test/a.jpg",urls)
        self.assertIn("http://cdn.example.test/a.webp",urls)
        self.assertIn("https://cdn.example.test/app.js",urls)

    def test_extracts_hreflang_and_jsonld_blocks(self):
        p=ResourceParser()
        p.feed('<html><head><link rel="alternate" hreflang="pt-BR" href="https://example.test/pt/"></head><body><script type="application/ld+json">{"@type":"Dentist"}</script></body></html>')
        self.assertEqual(p.hreflang,[{"lang":"pt-BR","url":"https://example.test/pt/"}])
        self.assertEqual(len(p.jsonld),1)
        self.assertIn("Dentist",p.jsonld[0])

    def test_extracts_types_from_nested_schema_graph(self):
        payload={"@context":"https://schema.org","@graph":[{"@type":"Dentist"},{"@type":["LocalBusiness","Organization"]}]}
        self.assertEqual(sorted(extract_schema_types(payload)),["Dentist","LocalBusiness","Organization"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
