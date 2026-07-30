"""Good cause statement wording must match the JavaScript reference exactly.

It is printed on a document someone signs and sends to a state agency, so a
paraphrase is a defect, not a style difference.
"""

import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "docassemble", "MLRISnapAbawd")))
SPEC = os.path.join(HERE, "..", "..", "decision-spec.json")

import snap_abawd  # noqa: E402


class GoodCauseText(unittest.TestCase):
    def test_matches_reference(self):
        with open(SPEC, encoding="utf-8") as handle:
            spec = json.load(handle)
        for option in spec["goodCauseOptions"]:
            with self.subTest(option=option["id"]):
                self.assertEqual(
                    snap_abawd.good_cause_statement_text(option["id"]),
                    option["statementText"],
                    "statement wording differs from the reference for " + option["id"],
                )

    def test_none_and_missing_are_empty(self):
        self.assertEqual(snap_abawd.good_cause_statement_text(snap_abawd.NONE), "")
        self.assertEqual(snap_abawd.good_cause_statement_text(None), "")
        self.assertEqual(snap_abawd.good_cause_statement_text(""), "")

    def test_every_option_has_wording(self):
        with open(SPEC, encoding="utf-8") as handle:
            spec = json.load(handle)
        for option in spec["goodCauseOptions"]:
            self.assertTrue(
                snap_abawd.good_cause_statement_text(option["id"]),
                "no statement wording for " + option["id"],
            )


if __name__ == "__main__":
    unittest.main()
