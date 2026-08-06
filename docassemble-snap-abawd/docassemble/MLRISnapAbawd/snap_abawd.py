"""SNAP ABAWD screening: the decision logic, ported from JavaScript.

The reference implementation is ``court-forms/snap-screening-logic.js`` in the
MLRI source repository. This module is a port of the decision half of it, kept
deliberately free of Docassemble imports so it can be tested with plain Python.

Parity with the reference is verified, not assumed. ``tests/test_snap_abawd_parity.py``
runs every case in ``decision-spec.json``, which is generated from the JavaScript,
against the functions here. That includes all 32 combinations of the housing
follow-up. If you change a rule in one implementation and not the other, that test
fails.

Nothing here is legal review. See DECISION-SPEC.md for what still needs a subject
matter expert, particularly the age range and the 30-hours-below-minimum-wage route.
"""

# The "none of these apply to me" answer. This is a real value and is NOT the same
# as leaving a question blank; the two produce opposite outcomes on the housing
# follow-up. Any port that collapses them into an empty set is wrong.
NONE = "__none"

# Thresholds. Last verified November 2025 against Mass.gov and MassLegalHelp
# guidance. These move when state or federal rules change, which is why they are
# named constants in one place rather than inline in question text.
WORK_INCOME_THRESHOLD = 217.50
MA_MIN_WAGE = 15
WORK_HOURS_AT_MIN_WAGE = 14.5
WORK_HOURS_COMPLIANCE = 30

# Reason text, recorded on the results screen and in the printable statement.
REASONS = {
    "child14": "Live with a child under 14 years old",
    "health": "Have a health reason that makes it hard to work 30 or more hours a week",
    "child6": "Take care of a child under 6 years old",
    "caretaker": "Take care of a child or adult who cannot care for themselves",
    "pregnant": "Pregnant",
    "dv": (
        "Domestic violence, stalking, sexual harassment, sexual assault, or "
        "another safety situation that affects work"
    ),
    # Widened 2026-08-06 with the question, which now asks about a parent or grandparent
    # too. See the note in the JavaScript reference; the old wording had people attest to
    # membership they may not have.
    "tribe": "Alaska Native or Tribe member, including through a parent or grandparent",
    "tafdc": "Get or applying for TAFDC cash assistance",
    "substanceUse": "Participating in a substance use treatment program",
    "unemployment": "Get or applying for unemployment benefits",
    "stateagency": "Get services from a state agency",
    "school": "Enrolled in school half-time or more",
    "disability": "Get disability benefits",
}

DISABILITY_OTHER_REASON = "Get another disability benefit or payment DTA should review"
HOUSING_EXEMPT_REASON = (
    "No regular place to sleep, and DTA should review unable-to-work factors"
)
WORK_REASON_INCOME = "Earn enough income to be exempt from the work rules"
WORK_REASON_HOURS_30 = (
    "Work 30 or more hours a week while earning less than minimum wage"
)

# Questions answered yes/no where "yes" alone points to an exemption, in the order
# they are asked. housing, housingFollowup, working and disability are absent on
# purpose: their answers are not a plain yes or no and each is handled below.
YES_NO_EXEMPTIONS = (
    "child14",
    "health",
    "child6",
    "caretaker",
    "pregnant",
    "dv",
    "tribe",
    "tafdc",
    "substanceUse",
    "unemployment",
    "school",
)

# stateagency was in the tuple above until 2026-08-06, when the shipping build turned it
# into a checkbox list of the five agencies. Its answer is a list of ids now, never "yes",
# so the tuple entry had stopped matching anything: dead rather than wrong. It is handled
# by state_agency_exempt below instead.
#
# That handler sits after the disability reasons deliberately, because that is where the
# JavaScript records this one. Position would matter to anyone who reintroduces a
# yes-shaped answer here, so there is a worked example combining a disability benefit with
# a state agency to pin the order.

# Every disability option exempts. "other" records a different reason, because it
# asks DTA to review something the screening cannot classify.
DISABILITY_NAMED = ("eaedc", "veteran", "workers_comp", "pfml", "std", "ssi_ssdi")
DISABILITY_OTHER = "other"

# Housing follow-up options. These describe things suggesting someone can work, so
# the logic below is inverted: lacking them is what points to an exemption.
HOUSING_HEALTH = ("hospitalized", "ongoing_care")
HOUSING_DIPLOMA = "diploma"
HOUSING_JOB_OR_SCHOOL = ("steady_job", "full_time_student")

WORK_INCOME_OPTIONS = ("income_weekly", "hours_min_wage")
WORK_HOURS_30_OPTION = "hours_30"


def _multi(answers, key):
    """Read a check-all-that-apply answer.

    Returns NONE for the explicit none-of-these answer, otherwise a list. An
    unanswered question and an answered-but-empty one both come back as [], which
    is why housing_unable_exempt checks for NONE separately.
    """
    value = answers.get(key)
    if value == NONE:
        return NONE
    if isinstance(value, (list, tuple, set)):
        return list(value)
    return []


def housing_unable_exempt(answers):
    """Whether no-regular-place-to-sleep plus the follow-up points to an exemption.

    Only reached when housing is answered "no". Homelessness on its own does not
    produce an exemption here; the follow-up is what decides, and it decides by
    absence. See the exhaustive table in DECISION-SPEC.md.
    """
    if answers.get("housing") != "no":
        return False
    if "housingFollowup" not in answers or answers.get("housingFollowup") is None:
        return False

    selected = _multi(answers, "housingFollowup")
    if selected == NONE:
        return True
    if not selected:
        # Answered, nothing checked. Treated as unanswered, not as "none apply".
        return False

    if any(opt in selected for opt in HOUSING_HEALTH):
        return True
    has_diploma = HOUSING_DIPLOMA in selected
    has_job_or_school = any(opt in selected for opt in HOUSING_JOB_OR_SCHOOL)
    return not has_diploma or not has_job_or_school


def disability_reasons(answers):
    """Reasons recorded for the disability question. Named benefits collapse to one."""
    selected = _multi(answers, "disability")
    if selected == NONE or not selected:
        return []
    out = []
    if any(opt in selected for opt in DISABILITY_NAMED):
        out.append(REASONS["disability"])
    if DISABILITY_OTHER in selected:
        out.append(DISABILITY_OTHER_REASON)
    return out


def is_income_work_exempt(answers):
    return answers.get("working") in WORK_INCOME_OPTIONS


def is_hours_30_work_exempt(answers):
    return answers.get("working") == WORK_HOURS_30_OPTION


def state_agency_exempt(answers):
    """Any of the five agencies ticked exempts.

    "No" is the none sentinel and exempts nobody. Every option points the same way, so
    unlike the housing follow-up there is no combination to weigh. Mirrors
    stateAgencyExempt in the JavaScript reference.

    List-only on purpose: the archived builds still ask this as a yes/no, but the spec
    this port is checked against is generated from the shipping build, where it is a
    checkbox list.
    """
    v = answers.get("stateagency")
    return isinstance(v, list) and len(v) > 0


def exempt_reasons(answers):
    """Every exemption reason the answers support, in the order they are recorded."""
    out = []
    for key in YES_NO_EXEMPTIONS:
        if answers.get(key) == "yes":
            out.append(REASONS[key])
    out.extend(disability_reasons(answers))
    # After the disability reasons, matching the order the JavaScript records them in.
    if state_agency_exempt(answers):
        out.append(REASONS["stateagency"])
    if housing_unable_exempt(answers):
        out.append(HOUSING_EXEMPT_REASON)
    if is_income_work_exempt(answers):
        out.append(WORK_REASON_INCOME)
    if is_hours_30_work_exempt(answers):
        out.append(WORK_REASON_HOURS_30)
    return out


def is_age_exempt(answers):
    """Outside 18 through 64, so the rules do not apply at all.

    Checked before the exemption list, matching isAgeExempt in the JavaScript
    reference. Someone outside the range is outside the rules, so the reasons the
    rest of the screening collects cannot change the answer.
    """
    return answers.get("ageRange") == "no"


def result_type(answers):
    """One of 'ageexempt', 'exempt', 'goodcause', 'notexempt'."""
    if is_age_exempt(answers):
        return "ageexempt"
    if exempt_reasons(answers):
        return "exempt"
    good_cause = answers.get("goodcause")
    if good_cause and good_cause != NONE:
        return "goodcause"
    return "notexempt"


def should_skip_good_cause(answers):
    """Good cause cannot change an exempt outcome, so it is not asked."""
    return result_type(answers) in ("exempt", "ageexempt")


def ends_screening_early(answers):
    """The age result stops the screening where it stands; nothing after applies."""
    return is_age_exempt(answers)


# Longer phrasing for the printable statement, one per good cause answer. Author
# copy: propose changes rather than editing here, and keep it identical to
# GC_TEXT in the JavaScript reference.
GOOD_CAUSE_TEXT = {
    "transport": (
        "No transportation — a temporary loss of transportation, like a broken "
        "down car or temporary public transportation shutdown."
    ),
    "emergency": (
        "Emergency — any family, personal crisis, or emergency situation, "
        "and/or if you need to give care or support to others."
    ),
    "employment": (
        "Employment issues — an employer or work environment that discriminates "
        "on the basis of age, sex, race, religion, ethnicity, or physical or mental "
        "disability."
    ),
}


def good_cause_statement_text(good_cause):
    """The statement wording for a good cause answer. Empty when there is none."""
    if not good_cause or good_cause == NONE:
        return ""
    return GOOD_CAUSE_TEXT.get(good_cause, "")
