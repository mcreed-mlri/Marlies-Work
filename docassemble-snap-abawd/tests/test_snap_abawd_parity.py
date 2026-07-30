"""Proves the Python port decides the same things as the JavaScript reference.

Run from the repository root:

    python -m unittest discover -s docassemble-snap-abawd/tests -v

The cases are not written here. They are read from decision-spec.json, which is
generated from court-forms/snap-screening-logic.js by scripts/decision-spec.js.
So the expectations cannot drift from the reference: regenerate the spec and this
test starts checking the new behaviour.

This is the only thing separating "ported" from "ported and known to agree". The
Docassemble interview around it cannot be tested here, since there is no
Docassemble server; that part is reviewed code, not verified code.
"""

import itertools
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PACKAGE = os.path.join(HERE, "..", "docassemble", "MLRISnapAbawd")
REPO_ROOT = os.path.join(HERE, "..", "..")

sys.path.insert(0, os.path.abspath(PACKAGE))

import snap_abawd  # noqa: E402

SPEC_PATH = os.path.join(REPO_ROOT, "decision-spec.json")


def load_spec():
    with open(SPEC_PATH, encoding="utf-8") as handle:
        return json.load(handle)


class SpecPresent(unittest.TestCase):
    def test_spec_exists(self):
        self.assertTrue(
            os.path.exists(SPEC_PATH),
            "decision-spec.json is missing. Generate it with scripts/decision-spec.js; "
            "without it this suite proves nothing.",
        )


class WorkedExamples(unittest.TestCase):
    """Every example in the spec, outcome and reasons, in order."""

    def test_examples(self):
        spec = load_spec()
        self.assertGreater(len(spec["examples"]), 0, "spec carries no examples")
        for case in spec["examples"]:
            with self.subTest(case=case["name"]):
                answers = case["answers"]
                self.assertEqual(
                    snap_abawd.result_type(answers),
                    case["expect"]["outcome"],
                    "outcome differs from the reference for: " + case["name"],
                )
                self.assertEqual(
                    snap_abawd.exempt_reasons(answers),
                    case["expect"]["reasons"],
                    "reasons differ from the reference for: " + case["name"],
                )


class HousingTruthTable(unittest.TestCase):
    """All 32 follow-up combinations plus the explicit none-of-these answer.

    This branch is the one most likely to be ported wrong, because it decides by
    absence and because an empty selection and "none of these" mean opposite things.
    """

    def test_every_combination(self):
        spec = load_spec()
        rows = spec["housingTruthTable"]
        self.assertEqual(len(rows), 33, "expected 32 subsets plus the none sentinel")
        for row in rows:
            selected = row["selected"]
            with self.subTest(selected=selected):
                answers = {"housing": "no", "housingFollowup": selected}
                self.assertEqual(
                    snap_abawd.housing_unable_exempt(answers),
                    row["exempt"],
                    "housing_unable_exempt differs from the reference for: "
                    + repr(selected),
                )

    def test_empty_selection_differs_from_none_sentinel(self):
        """The distinction a port is most likely to lose."""
        empty = {"housing": "no", "housingFollowup": []}
        sentinel = {"housing": "no", "housingFollowup": snap_abawd.NONE}
        self.assertFalse(snap_abawd.housing_unable_exempt(empty))
        self.assertTrue(snap_abawd.housing_unable_exempt(sentinel))

    def test_not_reached_unless_housing_is_no(self):
        for housing in ("yes", None):
            answers = {"housing": housing, "housingFollowup": snap_abawd.NONE}
            self.assertFalse(snap_abawd.housing_unable_exempt(answers))


class SingleAnswerExemptions(unittest.TestCase):
    def test_each_yes_no_exemption(self):
        spec = load_spec()
        for entry in spec["simpleExemptions"]:
            with self.subTest(question=entry["id"]):
                answers = {entry["id"]: entry["exemptOn"]}
                self.assertEqual(snap_abawd.exempt_reasons(answers), entry["reasons"])
                self.assertEqual(snap_abawd.result_type(answers), "exempt")

    def test_no_answer_exempts_nobody(self):
        self.assertEqual(snap_abawd.exempt_reasons({}), [])
        self.assertEqual(snap_abawd.result_type({}), "notexempt")

    def test_answering_no_does_not_exempt(self):
        spec = load_spec()
        answers = {entry["id"]: "no" for entry in spec["simpleExemptions"]}
        self.assertEqual(snap_abawd.exempt_reasons(answers), [])


class WorkAndDisability(unittest.TestCase):
    def test_work_options(self):
        spec = load_spec()
        for option in spec["workOptions"]:
            with self.subTest(option=option["id"]):
                answers = {"working": option["id"]}
                self.assertEqual(snap_abawd.exempt_reasons(answers), option["reasons"])

    def test_disability_options(self):
        spec = load_spec()
        for option in spec["disabilityOptions"]:
            with self.subTest(option=option["id"]):
                answers = {"disability": [option["id"]]}
                self.assertEqual(snap_abawd.exempt_reasons(answers), option["reasons"])

    def test_named_plus_other_records_both(self):
        answers = {"disability": ["ssi_ssdi", "other"]}
        self.assertEqual(
            snap_abawd.exempt_reasons(answers),
            [snap_abawd.REASONS["disability"], snap_abawd.DISABILITY_OTHER_REASON],
        )

    def test_disability_none_sentinel_exempts_nobody(self):
        self.assertEqual(snap_abawd.exempt_reasons({"disability": snap_abawd.NONE}), [])


class Precedence(unittest.TestCase):
    def test_age_outranks_an_exemption(self):
        answers = {"ageRange": "no", "pregnant": "yes", "goodcause": "transport"}
        self.assertEqual(snap_abawd.result_type(answers), "ageinfo")

    def test_exemption_outranks_good_cause(self):
        answers = {"pregnant": "yes", "goodcause": "transport"}
        self.assertEqual(snap_abawd.result_type(answers), "exempt")

    def test_good_cause_none_is_not_good_cause(self):
        self.assertEqual(
            snap_abawd.result_type({"goodcause": snap_abawd.NONE}), "notexempt"
        )

    def test_good_cause_skipped_only_for_exempt_and_age(self):
        self.assertTrue(snap_abawd.should_skip_good_cause({"ageRange": "no"}))
        self.assertTrue(snap_abawd.should_skip_good_cause({"pregnant": "yes"}))
        self.assertFalse(snap_abawd.should_skip_good_cause({}))


class ReasonOrderIsStable(unittest.TestCase):
    """Reason order is user-visible: it is the order of the list on screen."""

    def test_order_follows_question_order_then_specials(self):
        answers = {
            "working": "income_weekly",
            "pregnant": "yes",
            "child14": "yes",
            "disability": ["ssi_ssdi"],
            "housing": "no",
            "housingFollowup": snap_abawd.NONE,
        }
        self.assertEqual(
            snap_abawd.exempt_reasons(answers),
            [
                snap_abawd.REASONS["child14"],
                snap_abawd.REASONS["pregnant"],
                snap_abawd.REASONS["disability"],
                snap_abawd.HOUSING_EXEMPT_REASON,
                snap_abawd.WORK_REASON_INCOME,
            ],
        )


class ThresholdsMatchTheSpec(unittest.TestCase):
    def test_constants(self):
        spec = load_spec()["thresholds"]
        self.assertEqual(snap_abawd.WORK_INCOME_THRESHOLD, spec["weeklyIncome"])
        self.assertEqual(snap_abawd.MA_MIN_WAGE, spec["minimumWage"])
        self.assertEqual(snap_abawd.WORK_HOURS_AT_MIN_WAGE, spec["hoursAtMinimumWage"])
        self.assertEqual(
            snap_abawd.WORK_HOURS_COMPLIANCE, spec["hoursBelowMinimumWage"]
        )


class ExhaustiveCrossCheck(unittest.TestCase):
    """Beyond the spec's own cases: every yes/no exemption in every combination
    with the work options, checking that combining them never loses a reason."""

    def test_combinations(self):
        spec = load_spec()
        ids = [e["id"] for e in spec["simpleExemptions"]]
        for size in (1, 2):
            for combo in itertools.combinations(ids, size):
                for work in ("income_weekly", "hours_30", None):
                    answers = {i: "yes" for i in combo}
                    if work:
                        answers["working"] = work
                    with self.subTest(combo=combo, work=work):
                        got = snap_abawd.exempt_reasons(answers)
                        for i in combo:
                            self.assertIn(snap_abawd.REASONS[i], got)
                        self.assertEqual(snap_abawd.result_type(answers), "exempt")


if __name__ == "__main__":
    unittest.main()
