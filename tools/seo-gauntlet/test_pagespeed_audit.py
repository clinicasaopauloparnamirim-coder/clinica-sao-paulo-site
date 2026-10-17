import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pagespeed_audit as psi

class PageSpeedTests(unittest.TestCase):
    def test_parses_lighthouse_scores_and_metrics(self):
        payload={
          "lighthouseResult":{
            "lighthouseVersion":"13.0.0","fetchTime":"2026-10-17T12:00:00Z",
            "categories":{"performance":{"score":0.84},"accessibility":{"score":0.94},"best-practices":{"score":1},"seo":{"score":1}},
            "audits":{"largest-contentful-paint":{"title":"Largest Contentful Paint","displayValue":"2.5 s","numericValue":2500,"numericUnit":"millisecond","score":0.9,"scoreDisplayMode":"numeric"}}
          },
          "loadingExperience":{"overall_category":"AVERAGE","metrics":{"LARGEST_CONTENTFUL_PAINT_MS":{"percentile":2500,"category":"AVERAGE"}}}
        }
        r=psi.normalize_psi_response("https://example.test/","mobile",200,payload)
        self.assertEqual(r["status"],"measured")
        self.assertEqual(r["scores"],{"performance":84,"accessibility":94,"best-practices":100,"seo":100})
        self.assertEqual(r["lab_metrics"]["largest-contentful-paint"]["numericValue"],2500)
        self.assertTrue(r["summary"]["field_data_available"])

    def test_429_quota_is_not_reported_as_zero_score(self):
        payload={"error":{"code":429,"message":"Quota exceeded for quota metric Queries per day"}}
        r=psi.normalize_psi_response("https://example.test/","mobile",429,payload)
        self.assertEqual(r["status"],"quota_limited")
        self.assertEqual(r["scores"],{})
        self.assertEqual(r["summary"]["score_count"],0)

    def test_no_crux_data_is_distinguished_from_failure(self):
        payload={"lighthouseResult":{"categories":{"performance":{"score":0.7}}}}
        r=psi.normalize_psi_response("https://example.test/","mobile",200,payload)
        self.assertEqual(r["status"],"measured")
        self.assertIsNone(r["field_data"])
        self.assertFalse(r["summary"]["field_data_available"])
        self.assertEqual(r["summary"]["field_data_status"],"no_data")

    def test_invalid_url_strategy_rejected(self):
        with self.assertRaises(ValueError): psi.run_psi("file:///etc/passwd")
        with self.assertRaises(ValueError): psi.run_psi("https://example.test/","smart")

if __name__=="__main__":
    unittest.main(verbosity=2)
