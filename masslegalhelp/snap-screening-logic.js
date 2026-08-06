/**
 * SNAP ABAWD screening: shared decision logic for classic + v2 UIs.
 * Thresholds last verified against Mass.gov / MLH guidance: Nov 2025.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SnapScreening = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const NONE = '__none';
  /* SCREENING_HUB_URL was removed on 2026-07-30. It held '../screener/' for the
     Back button in the Court Forms styled preview, which is now frozen in archive/
     with its own copy of this file. Nothing in the shipping build read it, and a
     parent path in the module that ships is a 404 waiting for someone to use it.
     scripts/publish-mlh.js found it. */
  /** Production deploy: swap the top-bar Back button for Quick exit using this URL (neutral external site). See README. */
  const PRODUCTION_QUICK_EXIT_URL = 'https://www.weather.com/';

  /** Copy variants. 'classic2' carries the author's website copy draft (see README). */
  const VARIANTS = ['classic', 'v2', 'classic2'];
  function normVariant(variant) {
    return VARIANTS.indexOf(variant) !== -1 ? variant : 'classic';
  }

  /* ---- Outbound links, all sourced from the author's copy draft ---- */
  const LINKS = {
    abawd: 'https://www.masslegalhelp.org/public-benefits-ssi/snap-food-benefits/snap-3-month-time-limit-abawd-work-rules',
    goodCause: 'https://www.masslegalhelp.org/public-benefits-ssi/snap-food-benefits/snap-3-month-time-limit-abawd-work-rules#:~:text=What%20if%20I%20had%20a%20good%20reason%20for%20not%20meeting%20the%20Work%20Rules%3F',
    snapWorkNotice: 'https://eohhs.ehs.state.ma.us/DTA/PolicyOnline/olg%20docs/Consolidated%20Notice%20Sample.pdf',
    dtaConnect: 'https://dtaconnect.eohhs.mass.gov/',
    snapHousehold: 'https://www.masslegalhelp.org/public-benefits-ssi/snap-food-benefits/34-what-snap-household-or-assistance-unit',
    adultFosterCare: 'https://www.masslegalhelp.org/public-benefits-ssi/snap-food-benefits/adult-foster-care-and-snap',
    dvServices: 'https://www.mass.gov/info-details/dta-domestic-violence-services',
    exemptionForm: 'https://www.mass.gov/doc/snap-work-rules-exemption-self-declaration-form/download',
    reachDtaWorker: 'https://www.masslegalservices.org/system/files/library/Advocacy%20Tips_%20Reaching%20a%20DTA%20worker.pdf',
    dtaOffices: 'https://www.mass.gov/orgs/department-of-transitional-assistance/locations',
    reapply: 'https://www.mass.gov/how-to/supplemental-nutrition-assistance-program-snap-formerly-known-as-food-stamps',
    getSnapBack: 'https://www.masslegalhelp.org/sites/default/files/2025-11/Terminations%20OB3%20KYR%20SNAP%20ABAWDs%20Flyers%20.pdf',
    dtaTraining: 'https://snappathtowork.org/',
    advocacyEmail: 'info@masslegalservices.org'
  };

  /* ---- Work-rule thresholds (MA ABAWD) ---- */
  /* Two different jobs, and the difference is what the tool is about.
   *
   * WORK_INCOME_THRESHOLD and WORK_HOURS_COMPLIANCE are *exemption* limbs: earn this much a
   * week, or work this many hours, and the ABAWD rules do not apply to you. 217.50 is 30
   * hours at the federal minimum wage of 7.25, which is where the pairing comes from.
   *
   * Meeting the rules is a different and lower bar, 20 hours a week or 80 a month, and it
   * lives in RESULT_COPY.workOption1 rather than here because nothing decides on it: the
   * screening tells someone how to report it, it never concludes it. Do not add a constant
   * for 20 and wire it into a decision without reading that copy first.
   *
   * WORK_HOURS_AT_MIN_WAGE is derived, not declared. It was 14.5 as its own literal, which
   * is only correct while the other two are 217.5 and 15; a Massachusetts minimum wage rise
   * would have left it silently stale. Massachusetts raises it by statute, so that was a
   * matter of time rather than a hypothetical. */
  const WORK_INCOME_THRESHOLD = 217.5;
  const MA_MIN_WAGE = 15;
  const WORK_HOURS_AT_MIN_WAGE = WORK_INCOME_THRESHOLD / MA_MIN_WAGE;
  const WORK_HOURS_COMPLIANCE = 30;

  const WORK_REASON_INCOME = 'Earn enough income to be exempt from the work rules';
  const WORK_REASON_HOURS_30 = 'Work 30 or more hours a week while earning less than minimum wage';
  const DISABILITY_OTHER_REASON = 'Get another disability benefit or payment DTA should review';
  const HOUSING_EXEMPT_REASON = 'No regular place to sleep, and DTA should review unable-to-work factors';

  const HOUSING_OPTION_DEFS = [
    { id: 'diploma', labelClassic: 'I have a high school diploma (including GED or HiSet)', labelV2: 'I have a high school diploma (including GED or HiSet)' },
    { id: 'ongoing_care', labelClassic: 'I regularly see a health care provider for an ongoing illness, like a dentist, therapist, psychiatrist, or doctor for ongoing treatment', labelV2: 'I regularly see a health care provider for an ongoing illness (dentist, therapist, psychiatrist, or doctor)' },
    { id: 'steady_job', labelClassic: 'I have had a steady job for at least 6 months in the last year', labelV2: 'I have had a steady job for at least 6 months in the last year' },
    { id: 'full_time_student', labelClassic: 'I have been a full-time student for at least 6 months in the last year', labelV2: 'I have been a full-time student for at least 6 months in the last year' },
    { id: 'hospitalized', labelClassic: 'I have been hospitalized in the last 6 months', labelV2: 'I have been hospitalized in the last 6 months' }
  ];

  const WORK_OPTION_DEFS = [
    { id: 'income_weekly', kind: 'income', label: 'I make $217.50 a week or more (before taxes)', labelDraft: 'Yes, I am making $217.50 a week or more (before taxes)' },
    { id: 'hours_min_wage', kind: 'income', label: 'I work at least 14.5 hours a week at $15+ an hour', labelDraft: 'Yes, I am working at least 14.5 hours a week at $15 or more an hour' },
    { id: 'hours_30', kind: 'income', label: 'I work 30 hours or more a week (I make less than minimum wage)', labelDraft: 'Yes, I am working 30 hours or more a week (I make less than minimum wage)' }
  ];

  /* The five agencies, as answers rather than as a list to read. Ids are short and stable
   * because they go into stored answers; the labels are the author's wording and can change
   * without touching anyone's saved state.
   *
   * MassAbility carries its former name. The agency was the Massachusetts Rehabilitation
   * Commission until 2024 and Victoria asked for "formerly" so the parenthesis reads as
   * history rather than as an alternative name: someone whose paperwork still says Mass
   * Rehab has to recognise it here. */
  const STATE_AGENCY_OPTION_DEFS = [
    { id: 'massability', label: 'MassAbility (formerly Mass Rehab Commission)' },
    { id: 'dmh', label: 'Dept. of Mental Health' },
    { id: 'dds', label: 'Dept. of Developmental Services' },
    { id: 'mcb', label: 'MA Commission for the Blind' },
    { id: 'mcdhh', label: 'MA Commission for Deaf and Hard of Hearing' }
  ];

  const DISABILITY_OPTION_DEFS = [
    { id: 'eaedc', label: 'EAEDC', exempt: true },
    { id: 'veteran', label: 'Veteran\u2019s disability benefit', exempt: true },
    { id: 'workers_comp', label: 'Workers\u2019 compensation', exempt: true },
    { id: 'pfml', label: 'Paid Family Medical Leave', exempt: true },
    { id: 'std', label: 'Short-term disability', exempt: true },
    { id: 'ssi_ssdi', label: 'SSI or SSDI', exempt: true },
    { id: 'other', label: 'Other disability benefit or payment', exempt: true, other: true }
  ];

  const DISABILITY_OTHER_HELP = 'Choose Other only if you receive a disability benefit or payment that is not listed above. Tell DTA the name of the benefit or payment so they can review it.';

  const GOODCAUSE_DEFS = {
    classic: {
      text: 'Are there other reasons it\u2019s hard for you to work, go to school, or do community service right now?',
      help: 'These are situations where you missed work, school, or volunteering hours for one or more months because of an unexpected life event.',
      noneLabel: 'This doesn\u2019t apply to me / I\u2019m not sure',
      options: [
        { id: 'transport', label: 'Yes, I have temporary transportation issues', result: 'No transportation \u2014 a temporary loss of transportation, such as a broken-down car or a public transit shutdown.' },
        { id: 'emergency', label: 'Yes, I have a family or personal emergency', result: 'Emergency \u2014 any family or personal crisis, or a situation where you need to give care or support to others.' },
        { id: 'employment', label: 'Yes, I\u2019m dealing with an unreasonable employment situation', result: 'Employment issues \u2014 for example, a workplace that discriminates, or unreasonable job conditions.' }
      ]
    },
    v2: {
      text: 'Is something making it hard to work, go to school, or volunteer right now?',
      help: 'These are situations where you missed work, school, or volunteering hours for one or more months because of an unexpected life event.',
      noneLabel: 'No / I\u2019m not sure',
      options: [
        { id: 'transport', label: 'Yes \u2014 my ride or transportation broke down', result: 'No transportation \u2014 a temporary loss of transportation, such as a broken-down car or a public transit shutdown.' },
        { id: 'emergency', label: 'Yes \u2014 a family or personal emergency', result: 'Emergency \u2014 any family or personal crisis, or a situation where you need to give care or support to others.' },
        { id: 'employment', label: 'Yes \u2014 an unfair or unreasonable job situation', result: 'Employment issues \u2014 for example, a workplace that discriminates, or unreasonable job conditions.' }
      ]
    },
    /* Author's draft. `title` / `detail` drive the good-cause results screen,
     * which lists every category rather than only the one selected. */
    classic2: {
      text: 'Is something making it hard to work, go to school, or volunteer right now?',
      help: 'These are situations where you missed work, school, or volunteering hours for one or more months because of an unexpected life event.',
      noneLabel: 'This question does not apply to me / I\u2019m not sure',
      options: [
        {
          id: 'transport',
          label: 'Yes \u2014 my ride broke down or I have temporary transportation issues',
          result: 'No transportation \u2014 a temporary loss of transportation, like a broken down car or temporary public transportation shutdown.',
          title: 'No transportation',
          detail: ['A temporary loss of transportation, like a broken down car or temporary public transportation shutdown.']
        },
        {
          id: 'emergency',
          label: 'Yes, I have a family or personal emergency',
          result: 'Emergency \u2014 any family, personal crisis, or emergency situation, and/or if you need to give care or support to others.',
          title: 'Emergency',
          detail: ['Any family, personal crisis, or emergency situation, and/or if you need to give care or support to others.'],
          moreExamples: true
        },
        {
          id: 'employment',
          label: 'Yes, I\u2019m dealing with unreasonable employment',
          result: 'Employment issues \u2014 an employer or work environment that discriminates on the basis of age, sex, race, religion, ethnicity, or physical or mental disability.',
          title: 'Employment issues',
          detail: ['Employer or work environment discriminates on the basis of age, sex, race, religion, ethnicity, or physical or mental disability.'],
          moreExamples: true
        }
      ]
    }
  };

  const QUESTION_COPY = {
    classic: {
      child14: { text: 'Do you live with a child under 14 years old?', help: 'If you live with a child under 14 who should be part of your SNAP household \u2014 even if they are not eligible (for example, because of immigration status or if they are a foster child) \u2014 select "Yes."' },
      health: { text: 'Do you have a health reason or disability that makes it hard to work at least 30 hours a week?' },
      child6: { text: 'Do you take care of a child under 6 years old?', help: 'You do not need to be related to them, live with them, or provide care full-time.' },
      caretaker: { text: 'Do you take care of a child or adult who cannot care for themselves?', help: 'You do not need to be related to them, live with them, or provide care full-time.' },
      pregnant: { text: 'Are you pregnant?' },
      housing: { text: 'Do you have a regular place to sleep at night?', help: 'Choose "No" if you are experiencing homelessness or unstable housing.' },
      housingFollowup: { text: 'Please choose all that apply:', help: 'DTA looks at these when you do not have a regular place to sleep. They help decide whether you are unable to work under the ABAWD screening.', noneLabel: 'None of the above' },
      dv: { text: 'Has domestic violence, stalking, sexual harassment, sexual assault, or another safety situation made it hard for you to work?', help: 'DTA has domestic violence specialists in each local office who can help. Your answer stays private.' },
      tribe: { text: 'Are you an Alaska Native or a member of an American Indian, Urban Indian, or California Indian tribe?', help: 'Choose "Yes" if you have a parent or grandparent who is a member of one of these tribes.' },
      tafdc: { text: 'Do you get, or are you applying for, TAFDC cash assistance benefits?' },
      disability: { text: 'Do you get any of these disability benefits?', noneLabel: 'None of the above' },
      substanceUse: { text: 'Are you participating in a substance use treatment program?' },
      unemployment: { text: 'Do you get, or are you applying for, unemployment benefits?' },
      stateagency: { text: 'Do you get services from any of these state agencies?', help: 'MassAbility, Dept. of Mental Health, Dept. of Developmental Services, MA Commission for the Blind, or MA Commission for the Deaf and Hard of Hearing.' },
      school: { text: 'Are you enrolled in school half-time or more?', help: 'This includes high school, vocational/technical school, college, or any education and training program. You can ask your school if you\'re unsure if you are enrolled half-time or more.' },
      working: { text: 'Are you currently working for pay?', help: 'Choose the option that applies to you.', noneLabel: 'None of the above' }
    },
    v2: {
      child14: { text: 'Do you live with a child under 14 years old?', help: 'If you live with a child under 14 who should be part of your SNAP household \u2014 even if they are not eligible (for example, because of immigration status or if they are a foster child) \u2014 choose "Yes."' },
      health: { text: 'Is it hard to work 30 hours a week because of your health or a disability?' },
      child6: { text: 'Do you take care of a child under 6 years old?', help: 'You do not need to be related to them, live with them, or provide care full-time.' },
      caretaker: { text: 'Do you take care of a child or adult who cannot care for themselves?', help: 'You do not need to be related to them, live with them, or provide care full-time.' },
      pregnant: { text: 'Are you pregnant?' },
      housing: { text: 'Do you have a regular place to sleep at night?', help: 'Choose "No" if you do not have stable housing, or you are staying in a shelter, a car, or with different people.' },
      housingFollowup: { text: 'Which of these are true for you?', help: 'Pick every one that is true. DTA uses these when you do not have a regular place to sleep, to see if you are unable to work.', noneLabel: 'None of these' },
      dv: { text: 'Has abuse, stalking, harassment, assault, or another safety problem made it hard for you to work?', help: 'This can include domestic violence, sexual harassment, sexual assault, or stalking. DTA has domestic violence specialists in each local office who can help. Your answer stays private.' },
      tribe: { text: 'Are you an Alaska Native, or a member of an American Indian, Urban Indian, or California Indian tribe?', help: 'Choose "Yes" if you have a parent or grandparent who is a member of one of these tribes.' },
      tafdc: { text: 'Do you get, or are you applying for, TAFDC cash assistance?' },
      disability: { text: 'Do you get any of these disability benefits?', help: 'Pick every one that is true for you. If none are, choose "None of these."', noneLabel: 'None of these' },
      substanceUse: { text: 'Are you in a substance use treatment program?' },
      unemployment: { text: 'Do you get, or are you applying for, unemployment benefits?' },
      stateagency: { text: 'Do you get services from a Massachusetts state agency?', help: 'For example: MassAbility, Dept. of Mental Health, Dept. of Developmental Services, MA Commission for the Blind, or MA Commission for the Deaf and Hard of Hearing.' },
      school: { text: 'Are you in school half-time or more?', help: 'This includes high school, vocational/technical school, college, or any education and training program. You can ask your school if you\'re unsure if you are enrolled half-time or more.' },
      working: { text: 'Are you working for pay right now?', help: 'Pick the one that is true for you.', noneLabel: 'None of these' }
    },
    /* Author's website copy draft. `helpHtml`, `listItems`, `note`, and
     * `yesLabel` are optional fields the classic-v2 page knows how to render. */
    classic2: {
      /* Only classic2 defines this one. An age question and an `ageinfo` result were
       * removed from the start page in 62498cc; the author asked for it back on
       * 2026-08-06 as the first question in group 1, with an exempt result rather than
       * a gate. The archived guided build shares this module and never had it, so
       * leaving the copy out of the other variants keeps that record intact:
       * pageQuestionsFor already drops ids with no question behind them, and create()
       * only builds this question when its copy exists. */
      ageRange: { text: 'Are you 18 through 64 years old?' },
      child14: {
        text: 'Do you live with a child under 14 years old?',
        helpHtml: 'If you live with a child under 14 who should be part of your <a href="' + LINKS.snapHousehold + '" target="_blank" rel="noopener">SNAP household</a>, even if they are not eligible (for example, because of immigration status or if they are a foster child), select “Yes.”'
      },
      health: {
        text: 'Do you have a health reason or disability that makes it hard to work at least 30 hours a week?',
        help: 'It can be a physical or mental health reason, and short- or long-term.'
      },
      child6: { text: 'Do you take care of a child under 6 years old?', help: 'You do not need to be related to them, live with them, or provide care full-time.' },
      caretaker: {
        text: 'Do you take care of a child or adult who cannot care for themselves?',
        helpHtml: 'You do not need to be related to them, live with them, or provide care full-time.<br><br>Caring for someone means you regularly do things like make food, help with daily tasks like bathing and personal care, run errands for them, and monitor their health and wellbeing. If you are an <a href="' + LINKS.adultFosterCare + '" target="_blank" rel="noopener">Adult Foster Care provider</a>, answer “Yes.”'
      },
      pregnant: { text: 'Are you pregnant?' },
      housing: {
        text: 'Do you have a regular place to sleep at night?',
        help: 'Choose “No” if you are experiencing homelessness or unstable housing, like living in a shelter or couch surfing.'
      },
      housingFollowup: { text: 'Please choose all that apply:', noneLabel: 'None of the above' },
      dv: {
        text: 'Has a domestic violence or safety situation made it hard for you to work?',
        helpHtml: 'This includes stalking, harassment, abuse, assault, or any health/safety concerns that make it hard for you to work. DTA has domestic violence specialists in each local office who can help. Find their <a href="' + LINKS.dvServices + '" target="_blank" rel="noopener">contact info here</a>. Your answer stays private.'
      },
      tribe: { text: 'Are you an Alaska native or a member of an American Indian, Urban Indian, or California Indian tribe?', help: 'Choose “Yes” if you have a parent or grandparent who is a member of one of these tribes.' },
      tafdc: { text: 'Do you get, or are you applying for TAFDC cash assistance benefits?' },
      disability: { text: 'Do you get any of these disability benefits?', noneLabel: 'None of the above' },
      substanceUse: { text: 'Are you participating in a substance use treatment program?', help: 'This can be for drugs or alcohol. It does not have to be a daily program.' },
      unemployment: { text: 'Do you get, or are you applying for unemployment benefits?' },
      /* A checkbox list since 2026-08-06, and only in this variant. It was a yes/no with the
       * five agencies printed underneath as a plain bulleted list, which meant someone read
       * the names and then answered a question that did not refer to them, and the tool never
       * learned which agency it was. The author asked for the list to become the answer and
       * for the selections to show on the results page.
       *
       * `noneLabel` is "No", not "None of the above", because that is what she asked for and
       * because the question is phrased as one: "Do you get services from any of these state
       * agencies?" The separate Yes/No pair below the list went at the same time. */
      stateagency: {
        text: 'Do you get services from any of these state agencies?',
        options: STATE_AGENCY_OPTION_DEFS.map(o => ({ id: o.id, label: o.label })),
        noneLabel: 'No'
      },
      school: {
        text: 'Are you enrolled in school half-time or more?',
        help: 'This includes high school, vocational/technical school, college, or any education and training program. You can ask your school if you\'re unsure if you are enrolled half-time or more.'
      },
      working: { text: 'Are you currently working for pay?', help: 'Choose the option that applies to you.', noneLabel: 'None of the above' }
    }
  };

  const REASONS = {
    child14: 'Live with a child under 14 years old',
    health: 'Have a health reason that makes it hard to work 30 or more hours a week',
    child6: 'Take care of a child under 6 years old',
    caretaker: 'Take care of a child or adult who cannot care for themselves',
    pregnant: 'Pregnant',
    dv: 'Domestic violence, stalking, sexual harassment, sexual assault, or another safety situation that affects work',
    tribe: 'Alaska Native or member of a Tribe',
    tafdc: 'Get or applying for TAFDC cash assistance',
    disability: 'Get disability benefits',
    substanceUse: 'Participating in a substance use treatment program',
    unemployment: 'Get or applying for unemployment benefits',
    stateagency: 'Get services from a state agency',
    school: 'Enrolled in school half-time or more'
  };

  /* ---- Write-in prompts for the "Statement to DTA" form ----
   * The author's draft shows one labelled blank per exemption that needs
   * explaining. Reasons not listed here (pregnant, TAFDC, unemployment, and so
   * on) speak for themselves and get no blank. */
  const STATEMENT_PROMPT_GOODCAUSE = 'Explain why you had to miss work, school, or volunteer hours';
  const STATEMENT_PROMPT_FALLBACK = 'Explain your reasons in your own words';

  const STATEMENT_PROMPTS = [
    { reason: REASONS.health, prompt: 'Explain the health reason that makes it hard for you to work 30 or more hours a week' },
    { reason: REASONS.caretaker, prompt: 'Explain your caretaking responsibilities or arrangement' },
    { reason: REASONS.child6, prompt: 'Explain your caretaking arrangement for the child under 6' },
    { reason: WORK_REASON_INCOME, prompt: 'Explain your work hours, pay, and what proof you can send to DTA' },
    { reason: WORK_REASON_HOURS_30, prompt: 'Explain your work hours, pay, and what proof you can send to DTA' },
    { reason: DISABILITY_OTHER_REASON, prompt: 'Name the disability benefit or payment you receive' },
    { reason: HOUSING_EXEMPT_REASON, prompt: 'Explain where you sleep and any barriers that make it hard to work' }
  ];

  /** Prompts to show, in order. Always at least one so the form is never blank. */
  function statementPromptsFor(reasons, resultType) {
    if (resultType === 'goodcause') return [STATEMENT_PROMPT_GOODCAUSE];
    const rs = Array.isArray(reasons) ? reasons : [];
    const out = [];
    STATEMENT_PROMPTS.forEach(p => {
      if (rs.indexOf(p.reason) !== -1 && out.indexOf(p.prompt) === -1) out.push(p.prompt);
    });
    return out.length ? out : [STATEMENT_PROMPT_FALLBACK];
  }

  /* ---- Guided mode: pick-lists that compose the statement ------------------
   *
   * The write-in form above hands someone a blank box and a prompt. Guided mode
   * replaces each box with two or three pick-lists and writes the sentence from
   * the picks. Same exemptions, same letter, no typing.
   *
   * Every block below is gated on the same reason constant its write-in prompt
   * uses, and appears in the same order, so the two versions cover exactly the
   * same ground and can be compared honestly.
   *
   * Rules these compose functions all follow, because the output is a sentence
   * someone signs and sends to a state agency:
   *
   *   Nothing is asserted that was not picked. An unanswered question drops its
   *   clause; it never falls back to a likely-sounding default. Answering one of
   *   three questions produces a shorter true sentence, not a padded guess.
   *
   *   Every "I would rather not say" degrades to the general form the screening
   *   already established. Declining to say whether a health reason is physical
   *   or mental still yields "I have a health condition that makes it hard for
   *   me to work 30 or more hours a week", which is what the exemption rests on
   *   anyway.
   *
   * Question ids carry a `d_` prefix so they cannot collide with a screening
   * question id in the same flat answers object.
   */

  /** Join sentence fragments, dropping the ones that composed to nothing. */
  function joinSentences(parts) {
    return parts.filter(p => p && String(p).trim()).join(' ').trim();
  }

  /** The chosen option's id for a single-choice guided question. */
  function pickOne(answers, id) {
    const v = answers ? answers[id] : null;
    return (v == null || v === NONE) ? '' : v;
  }

  /** Chosen ids for a multi-choice guided question; the none sentinel is []. */
  function pickMany(answers, id) {
    const v = answers ? answers[id] : null;
    if (v == null || v === NONE || !Array.isArray(v)) return [];
    return v;
  }

  /** "a, b, and c" for a list already in the author's order. */
  function andList(items) {
    const xs = items.filter(Boolean);
    if (!xs.length) return '';
    if (xs.length === 1) return xs[0];
    if (xs.length === 2) return xs[0] + ' and ' + xs[1];
    return xs.slice(0, -1).join(', ') + ', and ' + xs[xs.length - 1];
  }

  /** Look up a composed fragment by option id from an [{id,label,text}] list. */
  function fragmentFor(options, id) {
    const found = (options || []).find(o => o.id === id);
    return found ? (found.text || '') : '';
  }

  const HOW_OFTEN_OPTIONS = [
    { id: 'daily', label: 'Every day', text: 'every day' },
    { id: 'most_days', label: 'Most days of the week', text: 'most days of the week' },
    { id: 'few_days', label: 'A few days a week', text: 'a few days a week' },
    { id: 'as_needed', label: 'Whenever they need me', text: 'whenever they need me' }
  ];

  /* No "rather not say" or "not sure" entries in these lists.
   *
   * Every single-choice question already renders a `noneLabel` after its
   * options, so an opt-out inside the list is a second one, and the pair read as
   * a distinction the person has to work out ("I do not know" above "I am not
   * sure"). There is only ever one way to decline, it is the last option, and
   * its wording is chosen per question. Declining composes nothing, which for
   * these lists degrades to the general sentence the screening already
   * established rather than to silence. */
  const GUIDED_HEALTH_KIND = [
    { id: 'physical', label: 'A physical health reason', text: 'a physical health condition' },
    { id: 'mental', label: 'A mental health reason', text: 'a mental health condition' },
    /* Singular, because the sentence continues "...that makes it hard for me to
     * work". "physical and mental health conditions that makes it" does not
     * agree, and this goes on a letter to a state agency. */
    { id: 'both', label: 'Both', text: 'both a physical and a mental health condition' }
  ];

  const GUIDED_HEALTH_LENGTH = [
    { id: 'short', label: 'Less than 6 months', text: 'I expect it to last less than 6 months.' },
    { id: 'long', label: '6 months or more', text: 'It has lasted 6 months or more, or I expect it to.' }
  ];

  const GUIDED_HEALTH_CARE = [
    { id: 'regularly', label: 'Yes, regularly', text: 'I see a health care provider for it regularly, and I can ask them for a letter if you need one.' },
    { id: 'sometimes', label: 'Yes, sometimes', text: 'I see a health care provider for it sometimes, and I can ask them for a letter if you need one.' },
    { id: 'no', label: 'No', text: 'I am not seeing a health care provider for it right now.' }
  ];

  const GUIDED_CARE_WHO = [
    { id: 'child', label: 'A child', text: 'a child who cannot care for themselves' },
    { id: 'adult', label: 'An adult', text: 'an adult who cannot care for themselves' },
    { id: 'more', label: 'More than one person', text: 'more than one person who cannot care for themselves' }
  ];

  const GUIDED_CARE_ALONE = [
    { id: 'alone', label: 'I am the only one', text: 'I am the only person providing this care.' },
    { id: 'shared', label: 'I share it with someone else', text: 'I share this care with someone else.' }
  ];

  const GUIDED_WORK_HOURS = [
    { id: 'lt10', label: 'Less than 10 hours', text: 'less than 10 hours a week' },
    { id: 'h10_19', label: 'About 10 to 19 hours', text: 'about 10 to 19 hours a week' },
    { id: 'h20_29', label: 'About 20 to 29 hours', text: 'about 20 to 29 hours a week' },
    { id: 'h30plus', label: '30 hours or more', text: '30 or more hours a week' },
    { id: 'varies', label: 'It changes week to week', text: 'a different number of hours each week' }
  ];

  const GUIDED_WORK_JOBS = [
    { id: 'one', label: 'One job', text: 'one job' },
    { id: 'more', label: 'More than one job', text: 'more than one job' }
  ];

  /* `help: true` marks the option that is a request rather than a document.
   * Picking it alone composes an ask; picking it alongside real proof composes
   * a caveat. Someone who can send pay stubs but not an employer letter should
   * not have the tool tell DTA they can send both. */
  const GUIDED_WORK_PROOF = [
    { id: 'paystubs', label: 'Pay stubs', text: 'my pay stubs' },
    { id: 'employer_letter', label: 'A letter from my employer', text: 'a letter from my employer' },
    { id: 'schedule', label: 'My work schedule', text: 'my work schedule' },
    { id: 'need_help', label: 'I need help getting proof', text: '', help: true }
  ];

  /* The one place a pick-list is weaker than the blank box it replaces. The
   * write-in version asks the person to name their benefit and can take any
   * answer; no list can hold every disability payment in the country, so the
   * last option composes a promise to bring paperwork instead of a name. Worth
   * showing the team rather than smoothing over. */
  const GUIDED_DISABILITY_OTHER = [
    { id: 'masshealth', label: 'MassHealth based on a disability determination', text: 'MassHealth based on a disability determination' },
    { id: 'private', label: 'Private or employer disability insurance', text: 'private or employer disability insurance' },
    { id: 'va_pension', label: 'A VA pension', text: 'a VA pension' },
    { id: 'railroad', label: 'Railroad Retirement disability benefits', text: 'Railroad Retirement disability benefits' },
    { id: 'tribal', label: 'A Tribal disability payment', text: 'a Tribal disability payment' },
    { id: 'other_state', label: 'A disability payment from another state', text: 'a disability payment from another state' }
  ];

  const GUIDED_HOUSING_WHERE = [
    { id: 'shelter', label: 'In a shelter', text: 'in a shelter' },
    { id: 'outside', label: 'Outside, or in a car', text: 'outside, or in a car' },
    { id: 'couch', label: 'At other people’s homes', text: 'at other people’s homes' },
    { id: 'motel', label: 'In a motel or hotel', text: 'in a motel or hotel' },
    { id: 'varies', label: 'Somewhere different from night to night', text: 'in a different place from night to night' }
  ];

  /* Composed as separate sentences rather than folded into a list, because each
   * is already a full first-person clause and reads as one in the letter. */
  const GUIDED_HOUSING_BARRIERS = [
    { id: 'no_address', label: 'I have no address or phone to give an employer', text: 'I have no address or phone to give an employer.' },
    { id: 'no_storage', label: 'I have no safe place to keep my things', text: 'I have no safe place to keep my things.' },
    { id: 'no_transport', label: 'I have no reliable way to get to a job', text: 'I have no reliable way to get to a job.' },
    { id: 'health', label: 'I have health problems', text: 'I have health problems.' },
    { id: 'moving', label: 'I have to move often', text: 'I have to move often.' },
    { id: 'unsafe', label: 'I do not feel safe', text: 'I do not feel safe.' }
  ];

  /* Good cause branches on the category already picked on the good-cause
   * screen, so nobody is shown transportation options for a family emergency. */
  const GUIDED_GOODCAUSE_WHAT = {
    transport: [
      { id: 'car_broke', label: 'My car broke down', text: 'My car broke down and I had no other way to get there.' },
      { id: 'lost_ride', label: 'I lost my ride', text: 'I lost the ride I had been depending on.' },
      { id: 'transit', label: 'Public transportation was not running', text: 'Public transportation was not running when I needed it.' },
      { id: 'afford', label: 'I could not afford to get there', text: 'I could not afford to get there.' }
    ],
    emergency: [
      { id: 'family_ill', label: 'Someone in my family got sick or was hurt', text: 'Someone in my family got sick or was hurt.' },
      { id: 'death', label: 'There was a death in my family', text: 'There was a death in my family.' },
      { id: 'caregiving', label: 'I had to take care of someone', text: 'I had to take care of someone who needed me.' },
      { id: 'housing', label: 'I lost my housing', text: 'I lost my housing.' },
      { id: 'other_emergency', label: 'Another emergency came up', text: 'Another emergency came up that I could not plan for.' }
    ],
    employment: [
      { id: 'discrimination', label: 'My employer treated me unfairly because of who I am', text: 'My employer treated me unfairly because of who I am.' },
      { id: 'hours_cut', label: 'My hours were cut', text: 'My hours were cut and I could not make them up.' },
      { id: 'unsafe', label: 'The working conditions were unsafe or unreasonable', text: 'The working conditions were unsafe or unreasonable.' },
      { id: 'harassment', label: 'I was harassed at work', text: 'I was harassed at work.' }
    ]
  };

  /* Relative labels, not month names.
   *
   * "June 2026" in an option label would make this module's copy change every
   * month, and SCREENER-COPY.md is regenerated and diffed in CI, so the build
   * would start failing on the first of every month for no reason anyone could
   * act on. The label stays relative and the month name is resolved against a
   * reference date only at compose time, where it belongs: the letter needs to
   * name the months, the question does not. */
  const GUIDED_GOODCAUSE_WHEN = [
    { id: 'this_month', label: 'This month', back: 0 },
    { id: 'last_month', label: 'Last month', back: 1 },
    { id: 'two_months', label: 'The month before that', back: 2 },
    { id: 'longer', label: 'More than three months', back: null }
  ];

  const GUIDED_GOODCAUSE_NOW = [
    { id: 'still', label: 'Yes, it is still going on', text: 'This is still going on.' },
    { id: 'over', label: 'No, it is over now', text: 'This has since been resolved.' }
  ];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /** The month `back` months before the reference date. */
  function monthBack(today, back) {
    const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
    return { name: MONTH_NAMES[d.getMonth()], year: d.getFullYear() };
  }

  /* "July and August 2026", not "July 2026 and August 2026". The year is
   * repeated only across a year boundary, where dropping it would be wrong. */
  function monthListPhrase(months) {
    if (!months.length) return '';
    const sameYear = months.every(m => m.year === months[0].year);
    if (sameYear) return andList(months.map(m => m.name)) + ' ' + months[0].year;
    return andList(months.map(m => m.name + ' ' + m.year));
  }

  function guidedMonthPhrase(answers, today) {
    const picked = pickMany(answers, 'd_gc_when');
    if (!picked.length) return '';
    if (picked.indexOf('longer') !== -1) return ' for more than three months';
    const months = GUIDED_GOODCAUSE_WHEN
      .filter(o => o.back != null && picked.indexOf(o.id) !== -1)
      .sort((a, b) => b.back - a.back)
      .map(o => monthBack(today, o.back));
    const phrase = monthListPhrase(months);
    return phrase ? ' in ' + phrase : '';
  }

  /**
   * The guided blocks, in the same order as `STATEMENT_PROMPTS`.
   *
   * `reasons` gates the block. `questions` are rendered with the same option
   * widgets the screening already uses, so the page needs no new question type.
   * `compose` turns the answers into the sentence that goes in the letter.
   */
  const GUIDED_BLOCKS = [
    {
      id: 'health',
      reasons: [REASONS.health],
      label: 'Your health reason',
      questions: [
        { id: 'd_health_kind', type: 'single', text: 'Is this a physical health reason, a mental health reason, or both?', options: GUIDED_HEALTH_KIND, noneLabel: 'I would rather not say' },
        { id: 'd_health_length', type: 'single', text: 'How long has this been going on, or how long do you expect it to last?', options: GUIDED_HEALTH_LENGTH, noneLabel: 'I do not know' },
        { id: 'd_health_care', type: 'single', text: 'Do you see a doctor, therapist, or other provider for it?', options: GUIDED_HEALTH_CARE, noneLabel: 'I am not sure' }
      ],
      compose: (a) => joinSentences([
        'I have ' + (fragmentFor(GUIDED_HEALTH_KIND, pickOne(a, 'd_health_kind')) || 'a health condition')
          + ' that makes it hard for me to work 30 or more hours a week.',
        fragmentFor(GUIDED_HEALTH_LENGTH, pickOne(a, 'd_health_length')),
        fragmentFor(GUIDED_HEALTH_CARE, pickOne(a, 'd_health_care'))
      ])
    },
    {
      id: 'caretaker',
      reasons: [REASONS.caretaker],
      label: 'The person you care for',
      questions: [
        { id: 'd_care_who', type: 'single', text: 'Who do you take care of?', options: GUIDED_CARE_WHO, noneLabel: 'I would rather not say' },
        /* GUIDED_CARE_WHO has no "rather not say" of its own; the noneLabel
           above is it, and declining still composes "someone who cannot care
           for themselves", which is the exemption itself. */
        { id: 'd_care_often', type: 'single', text: 'How often do you provide this care?', options: HOW_OFTEN_OPTIONS, noneLabel: 'I am not sure' },
        { id: 'd_care_alone', type: 'single', text: 'Is anyone else helping with this care?', options: GUIDED_CARE_ALONE, noneLabel: 'I am not sure' }
      ],
      compose: (a) => {
        const often = fragmentFor(HOW_OFTEN_OPTIONS, pickOne(a, 'd_care_often'));
        return joinSentences([
          'I take care of ' + (fragmentFor(GUIDED_CARE_WHO, pickOne(a, 'd_care_who')) || 'someone who cannot care for themselves') + '.',
          often ? 'I do this ' + often + '.' : '',
          fragmentFor(GUIDED_CARE_ALONE, pickOne(a, 'd_care_alone'))
        ]);
      }
    },
    {
      id: 'child6',
      reasons: [REASONS.child6],
      label: 'The child under 6 you care for',
      questions: [
        { id: 'd_child6_live', type: 'yn', text: 'Does this child live with you?' },
        { id: 'd_child6_often', type: 'single', text: 'How often do you take care of them?', options: HOW_OFTEN_OPTIONS, noneLabel: 'I am not sure' }
      ],
      compose: (a) => {
        const lives = a && a.d_child6_live;
        const often = fragmentFor(HOW_OFTEN_OPTIONS, pickOne(a, 'd_child6_often'));
        return joinSentences([
          'I take care of a child under 6 years old.',
          lives === 'yes' ? 'The child lives with me.' : (lives === 'no' ? 'The child does not live with me.' : ''),
          often ? 'I care for them ' + often + '.' : ''
        ]);
      }
    },
    {
      id: 'work',
      reasons: [WORK_REASON_INCOME, WORK_REASON_HOURS_30],
      label: 'Your work',
      /* The hours question is only asked of someone whose exemption rests on
       * pay rather than hours.
       *
       * "I work 30 hours or more a week" was already the screening answer for
       * the other path, so asking again is a question with a known answer, and
       * the bands on offer let them contradict it: picking "about 20 to 29
       * hours" produced a letter claiming 30 or more in one sentence and
       * something else in the next. One fewer question and no way to disagree
       * with yourself. */
      questions: (answers) => {
        const qs = [];
        if (!answers || answers.working !== 'hours_30') {
          qs.push({ id: 'd_work_hours', type: 'single', text: 'About how many hours a week do you usually work?', options: GUIDED_WORK_HOURS, noneLabel: 'I am not sure' });
        }
        qs.push({ id: 'd_work_jobs', type: 'single', text: 'How many jobs do you have?', options: GUIDED_WORK_JOBS, noneLabel: 'I am not sure' });
        qs.push({ id: 'd_work_proof', type: 'multi', text: 'What can you send DTA as proof of your work?', help: 'Pick every one you can send.', options: GUIDED_WORK_PROOF, noneLabel: 'None of these' });
        return qs;
      },
      /* Opens with the exemption claim itself, because in the letter this
       * paragraph replaces the fixed one that used to make the claim. Without
       * it the letter would give hours and proof and never say what they are
       * for. See the `composed` branch of buildStatementHTML. */
      compose: (a) => {
        const isHours30 = !!a && a.working === 'hours_30';
        const claim = isHours30
          ? 'I work 30 or more hours a week while earning less than minimum wage.'
          : 'I earn enough income to be exempt from the ABAWD work rules.';

        /* The hours question is not asked on the 30-hours path at all, so this
         * is normally empty there anyway. Guarded rather than assumed, because
         * a stale d_work_hours can still be in a restored session: someone can
         * answer the hours question, go back, and change how they work. */
        const hours = isHours30 ? '' : fragmentFor(GUIDED_WORK_HOURS, pickOne(a, 'd_work_hours'));
        const jobs = fragmentFor(GUIDED_WORK_JOBS, pickOne(a, 'd_work_jobs'));
        let detail = '';
        if (hours && jobs) detail = 'I usually work ' + hours + ' at ' + jobs + '.';
        else if (hours) detail = 'I usually work ' + hours + '.';
        else if (jobs) detail = 'I have ' + jobs + '.';

        const picked = pickMany(a, 'd_work_proof');
        const docs = GUIDED_WORK_PROOF.filter(o => !o.help && picked.indexOf(o.id) !== -1).map(o => o.text);
        const wantsHelp = picked.indexOf('need_help') !== -1;
        let proof = '';
        if (docs.length && wantsHelp) proof = 'I can send you ' + andList(docs) + '. I may need help getting the rest.';
        else if (docs.length) proof = 'I can send you ' + andList(docs) + '.';
        else if (wantsHelp) proof = 'I need help getting proof of my work hours and pay.';

        return joinSentences([claim, detail, proof]);
      }
    },
    {
      id: 'disabilityOther',
      reasons: [DISABILITY_OTHER_REASON],
      label: 'Your other disability benefit',
      questions: [
        { id: 'd_disability_other', type: 'single', text: 'Which benefit or payment is it?', options: GUIDED_DISABILITY_OTHER, noneLabel: 'Something not on this list' }
      ],
      /* "also" only when there is something for it to refer to.
       *
       * Picking a named benefit alongside "Other" leaves the named one in the
       * letter's bullet list, so "I also receive" follows on from it. Picking
       * "Other" on its own leaves no bullet at all in composed mode, and the
       * sentence opened by referring back to nothing. */
      compose: (a) => {
        const picked = (a && Array.isArray(a.disability)) ? a.disability : [];
        const hasNamedBenefit = DISABILITY_OPTION_DEFS
          .some(o => o.exempt && !o.other && picked.indexOf(o.id) !== -1);
        const lead = hasNamedBenefit ? 'I also receive ' : 'I receive ';
        const named = fragmentFor(GUIDED_DISABILITY_OTHER, pickOne(a, 'd_disability_other'));
        return named
          ? lead + named + '. Please review it as part of my exemption screening.'
          : lead + 'a disability benefit or payment that was not on the list. I will bring the paperwork so you can review it.';
      }
    },
    {
      id: 'housing',
      reasons: [HOUSING_EXEMPT_REASON],
      label: 'Where you sleep',
      questions: [
        { id: 'd_housing_where', type: 'single', text: 'Where do you usually sleep?', options: GUIDED_HOUSING_WHERE, noneLabel: 'I would rather not say' },
        { id: 'd_housing_barriers', type: 'multi', text: 'What makes it hard for you to work?', help: 'Pick every one that is true for you.', options: GUIDED_HOUSING_BARRIERS, noneLabel: 'None of these' }
      ],
      compose: (a) => {
        const where = fragmentFor(GUIDED_HOUSING_WHERE, pickOne(a, 'd_housing_where'));
        const picked = pickMany(a, 'd_housing_barriers');
        const barriers = GUIDED_HOUSING_BARRIERS.filter(o => picked.indexOf(o.id) !== -1).map(o => o.text);
        return joinSentences([
          'I do not have a regular place to sleep.',
          where ? 'I usually sleep ' + where + '.' : '',
          barriers.length ? 'This makes it hard for me to work.' : '',
          barriers.join(' '),
          /* Carries the ask that the fixed housing paragraph used to make. That
           * paragraph is suppressed in composed mode, and without this the
           * letter would describe the situation and never request anything. */
          'Please review my situation to decide whether I am unable to work under the ABAWD screening.'
        ]);
      }
    }
  ];

  /** Good cause is its own block: gated on the result, not on an exempt reason. */
  const GUIDED_GOODCAUSE_BLOCK = {
    id: 'goodcause',
    label: 'Why you missed hours',
    questions: (answers) => {
      const category = (answers && answers.goodcause) || '';
      const what = GUIDED_GOODCAUSE_WHAT[category];
      const qs = [];
      if (what) {
        qs.push({ id: 'd_gc_what', type: 'single', text: 'What happened?', options: what, noneLabel: 'Something else' });
      }
      qs.push({ id: 'd_gc_when', type: 'multi', text: 'Which months did this affect?', help: 'Pick every month you could not meet the work rules.', options: GUIDED_GOODCAUSE_WHEN, noneLabel: 'I am not sure' });
      qs.push({ id: 'd_gc_now', type: 'single', text: 'Is this still going on?', options: GUIDED_GOODCAUSE_NOW, noneLabel: 'I am not sure' });
      return qs;
    },
    /* What happened, then when, then whether it is over.
     *
     * This used to open "I could not meet the ABAWD work rules{months}.", which
     * is the letter's own first sentence: the good-cause letter already says "I
     * am writing to explain why I could not meet the ABAWD work rules for one or
     * more months" and then quotes the category. Saying it a third time read as
     * padding. The months are the only thing that paragraph adds, so it leads
     * with the person's own account and states them plainly.
     *
     * Composes to nothing when none of the three are answered, which leaves the
     * quoted category standing on its own rather than restating it. */
    compose: (a, today) => {
      const category = (a && a.goodcause) || '';
      const what = GUIDED_GOODCAUSE_WHAT[category] || [];
      const months = guidedMonthPhrase(a, today);
      return joinSentences([
        fragmentFor(what, pickOne(a, 'd_gc_what')),
        months ? 'I missed hours' + months + '.' : '',
        fragmentFor(GUIDED_GOODCAUSE_NOW, pickOne(a, 'd_gc_now'))
      ]);
    }
  };

  /** The blocks that apply, in author order. Good cause replaces the rest. */
  function guidedBlocksFor(reasons, resultType) {
    if (resultType === 'goodcause') return [GUIDED_GOODCAUSE_BLOCK];
    if (resultType !== 'exempt') return [];
    const rs = Array.isArray(reasons) ? reasons : [];
    return GUIDED_BLOCKS.filter(b => b.reasons.some(r => rs.indexOf(r) !== -1));
  }

  /**
   * Every guided question to ask, flattened and ready for the same option
   * widgets the screening questions use.
   *
   * Empty when the exemptions all speak for themselves (pregnant, TAFDC, tribe,
   * school, unemployment, domestic violence, substance use treatment, a named
   * disability benefit). Those need no explaining, so guided mode asks nothing
   * extra and the letter carries its reason list alone. This is the case where
   * the write-in form shows `STATEMENT_PROMPT_FALLBACK`: an empty box under
   * "Explain your reasons in your own words", which is the least answerable
   * prompt in the tool.
   */
  function guidedQuestionsFor(reasons, resultType, answers) {
    const out = [];
    guidedBlocksFor(reasons, resultType).forEach(b => {
      const qs = typeof b.questions === 'function' ? b.questions(answers || {}) : b.questions;
      qs.forEach(q => out.push(q));
    });
    return out;
  }

  /**
   * The composed statement, in the shape the write-in path already produces:
   * an array of `{ prompt, text }`. `prompt` is a short section label rather
   * than a write-in instruction, and the letter drops it entirely under
   * `composed: true`.
   *
   * `today` is passed in rather than read from the clock so the same answers
   * always compose the same sentence in tests and in generated documentation.
   */
  function composeStatementFor(reasons, resultType, answers, today) {
    const when = today instanceof Date ? today : new Date();
    const a = answers || {};
    const rs = Array.isArray(reasons) ? reasons : [];
    const out = [];
    guidedBlocksFor(reasons, resultType).forEach(b => {
      const text = b.compose(a, when);
      if (!text) return;
      /* Which exemptions this paragraph speaks for, so the letter can drop the
       * bullet and the fixed paragraph that would otherwise say the same thing
       * two more times. Only the reasons the person actually has, since a block
       * can be gated on either of the two work reasons. */
      const covers = (b.reasons || []).filter(r => rs.indexOf(r) !== -1);
      out.push({ prompt: b.label, text, reasons: covers });
    });
    return out;
  }

  const GROUPS = [
    { title: 'Children and people you care for', ids: ['ageRange', 'child14', 'child6', 'caretaker', 'pregnant'], classic2Title: 'Your Family and Household' },
    { title: 'Your health, housing, and safety', ids: ['health', 'housing', 'housingFollowup', 'dv'] },
    { title: 'Benefits, programs, and cash assistance', ids: ['tafdc', 'disability', 'substanceUse', 'unemployment', 'stateagency'], classic2Title: 'Public Benefits and Participating in Programs' },
    { title: 'School, work, and background', ids: ['school', 'working', 'tribe'] }
  ];

  function groupsForVariant(variant) {
    const v = normVariant(variant);
    return GROUPS.map(g => ({
      title: (v === 'classic2' && g.classic2Title) ? g.classic2Title : g.title,
      ids: g.ids
    }));
  }

  function housingOptions(variant) {
    const v = normVariant(variant) === 'v2' ? 'labelV2' : 'labelClassic';
    return HOUSING_OPTION_DEFS.map(o => ({ id: o.id, label: o[v] }));
  }

  function disabilityOptions() {
    return DISABILITY_OPTION_DEFS.map(o => ({ id: o.id, label: o.label }));
  }

  function workOptions(variant) {
    const draft = normVariant(variant) === 'classic2';
    return WORK_OPTION_DEFS.map(o => ({
      id: o.id,
      label: (draft && o.labelDraft) ? o.labelDraft : o.label,
      kind: o.kind
    }));
  }

  /** Optional per-variant rendering fields carried straight through to the UI.
   * Only filled in where the question definition below left the field unset, so
   * composed values (such as the disability help text) still win. */
  const COPY_PASSTHROUGH = ['help', 'helpHtml', 'listItems', 'note', 'yesLabel', 'noLabel'];

  function buildQuestions(variant) {
    const copy = QUESTION_COPY[normVariant(variant)];
    const housingOpts = housingOptions(variant);
    const disabilityOpts = disabilityOptions();
    const workOpts = workOptions(variant);

    const questions = [
      /* No exemptOn and no reason: "No" here does not add an exemption to the list, it
       * changes the result outright, because the letter every other exemption leads to
       * would be the wrong advice. DTA already holds the person's date of birth, so
       * there is nothing for them to tell DTA and nothing to sign. resultTypeFor
       * handles it; see 'ageexempt' there.
       *
       * Built only where its copy exists, which is classic2. The archived guided build
       * shares this module and never had an age question. */
      ...(copy.ageRange ? [{ id: 'ageRange', type: 'yn', text: copy.ageRange.text }] : []),
      { id: 'child14', type: 'yn', text: copy.child14.text, help: copy.child14.help, exemptOn: 'yes', reason: REASONS.child14 },
      { id: 'health', type: 'yn', text: copy.health.text, exemptOn: 'yes', reason: REASONS.health },
      { id: 'child6', type: 'yn', text: copy.child6.text, help: copy.child6.help, exemptOn: 'yes', reason: REASONS.child6 },
      { id: 'caretaker', type: 'yn', text: copy.caretaker.text, help: copy.caretaker.help, exemptOn: 'yes', reason: REASONS.caretaker },
      { id: 'pregnant', type: 'yn', text: copy.pregnant.text, exemptOn: 'yes', reason: REASONS.pregnant },
      { id: 'housing', type: 'yn', text: copy.housing.text, help: copy.housing.help },
      {
        id: 'housingFollowup', type: 'multi', text: copy.housingFollowup.text, help: copy.housingFollowup.help,
        options: housingOpts, noneLabel: copy.housingFollowup.noneLabel, showIf: { id: 'housing', val: 'no' }
      },
      { id: 'dv', type: 'yn', text: copy.dv.text, help: copy.dv.help, exemptOn: 'yes', reason: REASONS.dv },
      { id: 'tribe', type: 'yn', text: copy.tribe.text, help: copy.tribe.help, exemptOn: 'yes', reason: REASONS.tribe },
      { id: 'tafdc', type: 'yn', text: copy.tafdc.text, exemptOn: 'yes', reason: REASONS.tafdc },
      {
        id: 'disability', type: 'multi', text: copy.disability.text,
        help: copy.disability.help ? copy.disability.help + ' ' + DISABILITY_OTHER_HELP : DISABILITY_OTHER_HELP,
        options: disabilityOpts, noneLabel: copy.disability.noneLabel, reason: REASONS.disability
      },
      { id: 'substanceUse', type: 'yn', text: copy.substanceUse.text, exemptOn: 'yes', reason: REASONS.substanceUse },
      { id: 'unemployment', type: 'yn', text: copy.unemployment.text, exemptOn: 'yes', reason: REASONS.unemployment },
      /* Two shapes. classic2 asks it as a checkbox list of the five agencies; the archived
       * variants ask a plain yes/no and print the names in help text, which is what they
       * always did and what their copy still provides. Keyed off whether the copy supplies
       * options, the same way the age question is keyed off whether its copy exists.
       *
       * The multi form carries no exemptOn, so exemptReasonEntriesFor's generic loop skips it
       * and stateAgencyExempt handles it. The yn form still goes through the loop. Neither can
       * fire twice: stateAgencyExempt only looks at arrays. */
      copy.stateagency.options
        ? {
          id: 'stateagency', type: 'multi', text: copy.stateagency.text,
          options: copy.stateagency.options, noneLabel: copy.stateagency.noneLabel
        }
        : { id: 'stateagency', type: 'yn', text: copy.stateagency.text, help: copy.stateagency.help, exemptOn: 'yes', reason: REASONS.stateagency },
      { id: 'school', type: 'yn', text: copy.school.text, help: copy.school.help, exemptOn: 'yes', reason: REASONS.school },
      {
        id: 'working', type: 'single', text: copy.working.text, help: copy.working.help,
        options: workOpts, noneLabel: copy.working.noneLabel
      }
    ];

    questions.forEach(q => {
      const c = copy[q.id];
      if (!c) return;
      COPY_PASSTHROUGH.forEach(k => { if (c[k] != null && q[k] == null) q[k] = c[k]; });
    });

    return questions;
  }

  function buildGoodCause(variant) {
    const def = GOODCAUSE_DEFS[normVariant(variant)];
    return {
      id: 'goodcause',
      type: 'single',
      text: def.text,
      help: def.help,
      noneLabel: def.noneLabel,
      options: def.options.map(o => ({ id: o.id, label: o.label }))
    };
  }

  function buildGcText(variant) {
    const def = GOODCAUSE_DEFS[normVariant(variant)];
    const out = {};
    def.options.forEach(o => { out[o.id] = o.result; });
    return out;
  }

  /** Every good-cause category, for screens that list them all rather than
   * only the one the visitor picked. */
  function goodCauseCategories(variant) {
    const def = GOODCAUSE_DEFS[normVariant(variant)];
    return def.options.map(o => ({
      id: o.id,
      title: o.title || o.label,
      detail: o.detail || [],
      moreExamplesUrl: o.moreExamples ? LINKS.goodCause : ''
    }));
  }

  function normalizeHousingFollowup(value, variant) {
    if (value == null || value === NONE) return value;
    if (!Array.isArray(value)) return value;
    const opts = housingOptions(variant);
    const labelToId = {};
    opts.forEach(o => { labelToId[o.label] = o.id; });
    HOUSING_OPTION_DEFS.forEach(o => {
      labelToId[o.labelClassic] = o.id;
      labelToId[o.labelV2] = o.id;
    });
    return value.map(v => labelToId[v] || v);
  }

  function normalizeWorking(value) {
    if (value == null || value === NONE) return value;
    for (const o of WORK_OPTION_DEFS) {
      if (value === o.id || value === o.label || value === o.labelDraft) return o.id;
    }
    return value;
  }

  function normalizeDisability(value) {
    if (value == null || value === NONE) return value;
    if (!Array.isArray(value)) return value;
    const labelToId = {};
    DISABILITY_OPTION_DEFS.forEach(o => { labelToId[o.label] = o.id; labelToId['Other'] = 'other'; });
    return value.map(v => labelToId[v] || v);
  }

  function normalizeGoodcause(value, variant) {
    if (value == null || value === NONE) return value;
    const def = GOODCAUSE_DEFS[normVariant(variant)];
    for (const o of def.options) {
      if (value === o.id || value === o.label) return o.id;
    }
    for (const v of Object.values(GOODCAUSE_DEFS)) {
      for (const o of v.options) {
        if (value === o.label) return o.id;
      }
    }
    return value;
  }

  function migrateAnswers(answers, variant) {
    if (!answers || typeof answers !== 'object') return {};
    const out = { ...answers };
    if (out.housingFollowup != null) out.housingFollowup = normalizeHousingFollowup(out.housingFollowup, variant);
    if (out.working != null) out.working = normalizeWorking(out.working);
    if (out.disability != null) out.disability = normalizeDisability(out.disability);
    if (out.goodcause != null) out.goodcause = normalizeGoodcause(out.goodcause, variant);
    return out;
  }

  function housingFollowupIds(answers) {
    const v = answers.housingFollowup;
    if (v == null) return null;
    if (v === NONE) return NONE;
    return Array.isArray(v) ? v : [];
  }

  function housingUnableExempt(answers) {
    if (answers.housing !== 'no') return false;
    const v = housingFollowupIds(answers);
    if (v == null) return false;
    if (v === NONE) return true;
    if (!v.length) return false;
    const has = (id) => v.includes(id);
    const hasDiploma = has('diploma');
    const hasJobOrSchool = has('steady_job') || has('full_time_student');
    if (has('hospitalized') || has('ongoing_care')) return true;
    if (!hasDiploma || !hasJobOrSchool) return true;
    return false;
  }

  /**
   * The housing follow-up selections as labels.
   *
   * The author asked on 2026-08-06 for these to show on the results page and in the
   * letter, so DTA sees what the person actually ticked rather than only the summary
   * line. Note that "I have a high school diploma" and the like can read as arguing
   * against the exemption; showing them anyway is the point, because DTA is being asked
   * to review the whole picture and the tool should not curate which answers it passes on.
   *
   * Returned in the order the options are listed, not the order they were ticked, so two
   * people who chose the same things get the same letter. Empty for "None of the above"
   * and for an unanswered question: neither has a selection to show.
   */
  function housingFollowupLabels(answers, questions) {
    const picked = housingFollowupIds(answers);
    if (!Array.isArray(picked) || !picked.length) return [];
    const qs = questions || buildQuestions('classic');
    const q = qs.find(x => x.id === 'housingFollowup');
    if (!q || !Array.isArray(q.options)) return [];
    return q.options.filter(o => picked.indexOf(o.id) !== -1).map(o => o.label);
  }

  function disabilityExempt(answers) {
    const v = answers.disability;
    if (!Array.isArray(v) || !v.length) return false;
    const exemptIds = DISABILITY_OPTION_DEFS.filter(o => o.exempt).map(o => o.id);
    return v.some(id => exemptIds.includes(id));
  }

  /* Exempt on any agency ticked. "No" is the none sentinel and exempts nobody, which is the
   * same shape as the disability question rather than the housing follow-up: here every option
   * points one way, so there is no combination to weigh. */
  function stateAgencyExempt(answers) {
    const v = answers.stateagency;
    return Array.isArray(v) && v.length > 0;
  }

  /**
   * Selected labels for a multi-select question, in option order rather than tick order.
   *
   * Shared by the state agency and disability questions, both of which the author asked to
   * show their selections on the results page on 2026-08-06, and by nothing else: the housing
   * follow-up has its own function because it also feeds a paragraph in the letter.
   */
  function selectedLabels(answers, qId, questions, filter) {
    const v = answers[qId];
    if (!Array.isArray(v) || !v.length) return [];
    const qs = questions || buildQuestions('classic');
    const q = qs.find(x => x.id === qId);
    if (!q || !Array.isArray(q.options)) return [];
    return q.options
      .filter(o => v.indexOf(o.id) !== -1 && (!filter || filter(o)))
      .map(o => o.label);
  }

  function stateAgencyLabels(answers, questions) {
    return selectedLabels(answers, 'stateagency', questions);
  }

  /* Named benefits only. "Other" is its own reason with its own write-in prompt, so listing it
   * here as well would have someone explain it in one place and see it in two. */
  function disabilityNamedLabels(answers, questions) {
    return selectedLabels(answers, 'disability', questions, o => o.id !== 'other');
  }

  function disabilityReasons(answers) {
    const v = answers.disability;
    if (!Array.isArray(v) || !v.length) return [];
    const hasStandardBenefit = DISABILITY_OPTION_DEFS.some(o => o.exempt && !o.other && v.includes(o.id));
    const out = [];
    if (hasStandardBenefit) out.push(REASONS.disability);
    if (v.includes('other')) out.push(DISABILITY_OTHER_REASON);
    return out;
  }

  function isIncomeWorkExempt(answers) {
    const w = answers.working;
    return w === 'income_weekly' || w === 'hours_min_wage';
  }

  function isHours30WorkExempt(answers) {
    return answers.working === 'hours_30';
  }

  /* ---- Every reason the screening can reach, keyed by a stable id ----
   *
   * This exists for the email endpoint. The browser cannot be trusted to supply
   * the words that go in an email sent from our own domain: an endpoint that
   * accepts arbitrary text addressed to an arbitrary recipient is a spam relay
   * that authenticates as MassLegalHelp, and a listing against the sending
   * subdomain would be earned honestly. So the client posts ids and the server
   * resolves them here, which means the body can only ever contain wording that
   * is already in this file and already in SCREENER-COPY.md.
   *
   * Twelve of these ids are question ids, which is not a coincidence worth
   * relying on, so they are written out rather than derived from QUESTIONS. The
   * remaining five name reasons assembled from answers rather than a single
   * question. */
  const REASON_TEXT_BY_ID = {
    child14: REASONS.child14,
    health: REASONS.health,
    child6: REASONS.child6,
    caretaker: REASONS.caretaker,
    pregnant: REASONS.pregnant,
    dv: REASONS.dv,
    tribe: REASONS.tribe,
    tafdc: REASONS.tafdc,
    disability: REASONS.disability,
    substanceUse: REASONS.substanceUse,
    unemployment: REASONS.unemployment,
    stateagency: REASONS.stateagency,
    school: REASONS.school,
    disabilityOther: DISABILITY_OTHER_REASON,
    housing: HOUSING_EXEMPT_REASON,
    workIncome: WORK_REASON_INCOME,
    workHours30: WORK_REASON_HOURS_30
  };

  /**
   * The exempt reasons that apply, as `{ id, text }`.
   *
   * `exemptReasonsFor` is the text-only view of this, built from the same
   * traversal rather than a second one, so an id and its wording cannot drift
   * apart. Anything that adds a reason has to add it here and gets both.
   */
  function exemptReasonEntriesFor(answers, questions) {
    const qs = questions || buildQuestions('classic');
    const r = [];
    const add = (id) => { r.push({ id, text: REASON_TEXT_BY_ID[id] }); };
    for (const q of qs) {
      if (q.id === 'housing' || q.id === 'housingFollowup' || q.id === 'working' || q.id === 'disability') continue;
      const v = answers[q.id];
      if (q.exemptOn && v === q.exemptOn) r.push({ id: q.id, text: q.reason });
    }
    const dis = disabilityReasons(answers);
    /* Sub-items on the named-benefit reason: the author asked for the ticked benefits to show
     * on the results page. The reason text says only that someone gets a disability-based
     * benefit, so without these DTA cannot tell EAEDC from Workers' compensation. */
    if (dis.indexOf(REASONS.disability) !== -1) {
      r.push({
        id: 'disability',
        text: REASON_TEXT_BY_ID.disability,
        subItems: disabilityNamedLabels(answers, qs)
      });
    }
    if (dis.indexOf(DISABILITY_OTHER_REASON) !== -1) add('disabilityOther');
    /* Only fires for the classic2 checkbox form; the archived yes/no variants are picked up by
     * the generic loop above and carry no sub-items, having no ids to carry. */
    if (stateAgencyExempt(answers)) {
      r.push({
        id: 'stateagency',
        text: REASON_TEXT_BY_ID.stateagency,
        subItems: stateAgencyLabels(answers, qs)
      });
    }
    /* The housing reason is the only one that carries sub-items: the follow-up question
     * is the only place someone ticks several specifics under one exemption. */
    if (housingUnableExempt(answers)) {
      r.push({
        id: 'housing',
        text: REASON_TEXT_BY_ID.housing,
        subItems: housingFollowupLabels(answers, qs)
      });
    }
    if (isIncomeWorkExempt(answers)) add('workIncome');
    if (isHours30WorkExempt(answers)) add('workHours30');
    return r;
  }

  function exemptReasonsFor(answers, questions) {
    return exemptReasonEntriesFor(answers, questions).map(e => e.text);
  }

  /**
   * Reason ids to their wording, dropping anything unrecognised.
   *
   * The email endpoint's only input filter. Silently dropping rather than
   * throwing is deliberate: a stale client that posts a retired id should still
   * get an email listing the reasons that are still real, not a failure.
   */
  function resolveReasonIds(ids) {
    if (!Array.isArray(ids)) return [];
    const seen = {};
    const out = [];
    for (const id of ids) {
      const text = REASON_TEXT_BY_ID[id];
      if (!text || seen[id]) continue;
      seen[id] = true;
      out.push(text);
    }
    return out;
  }

  /* Checked before the exemption list on purpose. Someone outside 18 through 64 is
   * outside the rules altogether, so the reasons the rest of the screening collects do
   * not change the answer and listing them would imply DTA needs to hear about them.
   * The author asked for "No" to take the person straight to this result. */
  function isAgeExempt(answers) {
    return answers.ageRange === 'no';
  }

  function resultTypeFor(answers, questions) {
    if (isAgeExempt(answers)) return 'ageexempt';
    const exempt = exemptReasonsFor(answers, questions);
    if (exempt.length) return 'exempt';
    const g = answers.goodcause;
    if (g && g !== NONE) return 'goodcause';
    return 'notexempt';
  }

  /* True when the remaining questions cannot change the result, so the screening should
   * stop asking. 'exempt' skips only the good-cause question; 'ageexempt' skips the rest
   * of the screening, which is why endsScreeningEarly exists separately below. */
  function shouldSkipGoodCause(answers, questions) {
    const rt = resultTypeFor(answers, questions);
    return rt === 'exempt' || rt === 'ageexempt';
  }

  /* Next and Skip to results both jump straight to the result when this is true. Nothing
   * after group 1 applies to someone the rules do not cover, and asking anyway would
   * suggest the answers still matter. */
  function endsScreeningEarly(answers) {
    return isAgeExempt(answers);
  }

  function goodCauseText(answers, gcText) {
    const g = answers.goodcause;
    if (!g || g === NONE) return '';
    return gcText[g] || '';
  }

  function pageQuestionsFor(answers, step, gc, groups, qById, goodcause) {
    if (gc) return [goodcause];
    const ids = groups[step].ids;
    return ids.map(id => qById[id]).filter(q => {
      if (!q || !q.showIf) return !!q;
      return answers[q.showIf.id] === q.showIf.val;
    });
  }

  function optionLabel(q, stored) {
    if (!q || stored == null || stored === NONE) return stored;
    if (q.type === 'multi' || q.type === 'single') {
      const opts = q.options || [];
      const found = opts.find(o => o.id === stored);
      if (found) return found.label;
    }
    return stored;
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const DTA_SUBMISSION = {
    connectUrl: 'https://dtaconnect.eohhs.mass.gov/',
    phone: '(877) 382-2363',
    mail: 'DTA Document Processing Center, P.O. Box 4406, Taunton, MA 02780-0420',
    fax: '(617) 887-8765'
  };

  /* The reviewer's formatting markup bolds only "exempt" and "do not need to
   * meet the ABAWD work rules", so it is stored in segments. The plain
   * `exemptHeading` string below is joined from these, which keeps the wording
   * and the emphasis from drifting apart.
   *
   * 2026-07-30: the author dropped "Good news:" and softened "You are exempt"
   * to "You may be exempt". The screening cannot confirm an exemption, only
   * suggest one, so the heading must not assert it. */
  const EXEMPT_HEADING_PARTS = [
    { text: 'You may be ' },
    { text: 'exempt', bold: true },
    { text: ' and ' },
    { text: 'do not need to meet the ABAWD work rules', bold: true },
    { text: ' because of these reasons:' }
  ];
  const EXEMPT_HEADING_TEXT = EXEMPT_HEADING_PARTS.map(p => p.text).join('');

  /** Shared results-screen copy (author's website draft). Used by all UI variants. */
  const RESULT_COPY = {
    resultsHeadTitle: 'ABAWD Screening Tool Results',
    resultsHeadLead: 'Based on your answers,',
    learnMoreLabel: 'Learn more about the ABAWD work rules',
    lostSnapIntro: 'If you lost your SNAP or are about to lose your SNAP because of the ABAWD rules, email us at',
    privacyIntroLead: 'Your information is private.',
    privacyIntroBody: 'MLRI will not save any personal information you share on this form.',
    privacyNote: 'Your information is private. MLRI will not save any personal information you share on this form.',
    /* Same sentence as the start page uses to explain "exempt". Shown again on hover
     * over that word in the exempt results heading. */
    introExemptExplain: 'Being "exempt" means that you don\u2019t have to meet the work rules to keep getting SNAP.',
    exemptTermHintLabel: 'What does exempt mean?',
    /* The acronym is in the page heading before anything defines it, and outside
     * DTA nobody knows it. Attached to the first "ABAWD" in the intro, the same
     * dotted-underline hint the word "exempt" gets. */
    abawdTermExplain: 'ABAWD stands for Able-Bodied Adults With/Without Dependents. If DTA tells you that you are an ABAWD, you may need to meet certain work rules. You may also be exempt from (don\u2019t need to meet) these rules, and this online tool can help you figure that out.',
    abawdTermHintLabel: 'What does ABAWD mean?',
    /* The age result, author's wording, 2026-08-06. Split into three parts for the same
     * reason notExemptReapplyLead/Link/End is: one sentence carries an emphasis and a
     * mailto in the middle, and esc() cannot pass markup through. The emphasis on
     * "still" is the author's, marked "(italicize)" in her note, and it is the point of
     * the sentence: DTA holding your date of birth and sending the notice anyway is the
     * thing worth reporting.
     *
     * The author wrote this as one block. It is split at the first sentence because that
     * sentence is the result and the rest is the explanation, which is the shape every
     * other result screen already uses: a sentence in the coloured header, detail in the
     * white panel below. Every word is hers and the order is unchanged. Putting all three
     * sentences in the header would have made a paragraph into an h2.
     *
     * No letter. The screening cannot tell anyone their exact age, so the body restates
     * the range rather than asserting which side of it they are on. */
    ageExemptHeading: 'You are exempt and do not need to meet the ABAWD work rules because of your age.',
    ageExemptBody: 'If you are younger than 18 or 65 years and older, the ABAWD Work Rules don’t apply to you. DTA should already have your age and date of birth information on file, so you don’t have to take any further action.',
    ageExemptNoticeLead: 'If you are exempt because of age and DTA',
    ageExemptNoticeEmphasis: 'still',
    ageExemptNoticeEnd: 'sent you a SNAP and Work notice, please email',
    /* The three sentences below are the letter's own words, in the person's voice, and are
     * named rather than left inline in buildStatementHTML so they land in SCREENER-COPY.md.
     * The rest of the letter's fixed prose is still inline and absent from that document;
     * see the note in copy-doc.js.
     *
     * None of them mentions this tool. That was the point of the 2026-08-06 rewrite: the
     * letter is from the person to their caseworker, and a reference to a screening they
     * filled in elsewhere reads as software talking, invites DTA to weigh the tool's
     * opinion instead of the person's own account, and in "not listed above" pointed at a
     * list of options that is nowhere in the letter. */
    /* Shortened 2026-08-06, from "Please review the information I provide about my situation
     * to decide whether I am unable to work under the ABAWD work rules." Twelve words of
     * hedge before the sentence said anything, and a caseworker skimming a page of these
     * reads the ask, not the run-up.
     *
     * The ask itself stays, and should. This is the only exemption the screening cannot
     * assert: every other one is a fact, while no regular place to sleep is evidence toward
     * being unable to work, which is why the reason text says DTA should review. Cut the
     * request entirely and the letter states a fact and then a list with nothing saying what
     * the person wants, and the list can contain "I have a high school diploma" and "I have
     * had a steady job", which without framing read as arguing the other way. The ask is
     * what makes those bullets evidence rather than filler. */
    statementHousingLead: 'I do not have a regular place to sleep. Please review whether I am unable to work under the ABAWD work rules.',
    statementHousingPicksLead: 'The following is also true for me:',
    statementDisabilityOtherLead: 'I receive a disability benefit or payment. Please review it when you decide whether I am exempt from the ABAWD work rules.',
    printLead: 'Download or print these results to get a signed letter you can send to DTA. (More info on how to contact DTA in the box below)',
    exemptHeading: EXEMPT_HEADING_TEXT,
    /* Emptied 2026-07-30 at the author's direction. The exempt heading now ends
     * with "because of these reasons:", so this sentence said it twice. Kept as
     * an empty string rather than deleted because the retired variants still
     * render it; every render site must treat empty as "omit the paragraph". */
    exemptReasonsIntro: '',
    exemptProofWork: 'Send DTA proof of your income and hours, such as pay stubs or a letter.',
    exemptProofHousing: 'Tell DTA the details about your housing so they can review your exemption.',
    exemptProofDisability: 'Tell DTA the details about your disability benefit so they can review your exemption.',
    goodCauseHeading: 'You may have a good reason for missing hours',
    goodCauseIntro: 'This includes missing work, school, or volunteer hours before or after your start date.',
    goodCauseLead: 'Tell DTA as soon as you can if you could not meet the work rules for one or more months because of a hard life event, like:',
    notExemptHeading: 'You may need to meet the ABAWD work rules',
    notExemptIntro: 'Based on your responses, you may not be exempt from the ABAWD work rules.',
    notExemptStartOver: 'Click here to start the form over',
    notExemptReapplyLead: 'Already lost your SNAP because of the work rules? You can',
    notExemptReapplyLink: 'reapply',
    notExemptReapplyEnd: 'at any time.',
    notExemptSnapBack: 'See here for more information on how you may be able to get your SNAP back',
    notExemptEmail: 'Email',
    notExemptEmailSuffix: 'if you lost or are about to lose SNAP because of these rules.',
    workRulesHeading: 'To keep getting SNAP, you can meet the ABAWD work rules by doing one of these:',
    workOption1: 'Paid work, unpaid work, or training program for 20 hours a week (80 hours a month).',
    workOption1Unpaid: 'Examples of unpaid work can include internships or caring for family or friends who are not disabled or under age 6.',
    workOption1Training: 'Find a DTA training program',
    workOption2: 'Community service for a set number of hours each month. The number depends on how much SNAP you get. DTA will tell you how many hours to volunteer.',
    meetingDtaHeading: 'How to tell DTA you are meeting the work rules:',
    meetingDtaPaid: 'For paid work, send DTA proof of income and hours, such as pay stubs or an employer letter. For unpaid work, tell DTA how you are meeting the work rules and your hours.',
    meetingDtaStatement: 'Upload a written, signed statement (handwritten note is fine) onto',
    goodCauseInNotExemptBold: 'You may have a good reason for missing work, school, or volunteer hours.',
    goodCauseInNotExemptIntro: 'This includes missing hours before or after your start date.',
    goodCauseInNotExemptBody: 'Tell DTA as soon as possible if you couldn\u2019t meet the work rules for one or more months because of an unexpected life situation like temporary transportation issues, a personal or family emergency, or employment issues.',
    goodCauseInNotExemptLink: 'Learn more here',
    formTitleExempt: 'Tell DTA that you are exempt as soon as you can.',
    formLeadExempt: 'To tell DTA you are exempt, you can fill in the blanks below with your results and send it to DTA.',
    formLeadGoodCause: 'To tell DTA why you missed work hours, you can fill in the blanks below with your results and send it to DTA.',
    formExplainHeading: 'In a few sentences:',
    btnNext: 'Next →',
    btnSeeResults: 'See my results →',
    btnGuidedDetailsNext: 'A few more details →',
    btnSeeLetter: 'See my letter →',
    /* ---- Guided mode ----
     * Every string below belongs to the version that composes the statement
     * from pick-lists instead of asking for it in a blank box. The write-in
     * strings above stay untouched, because both versions are in front of the
     * team at once and the comparison is only fair if neither has drifted. */
    detailsStepHeading: 'A few more details for your letter',
    detailsStepLead: 'These answers write your letter for you. Every question is optional, and anything you skip is simply left out.',
    detailsStepPrivacy: 'Your answers stay on this device. MLRI does not see them.',
    composedStatementHeading: 'What your letter says:',
    composedFormLeadExempt: 'We wrote this from your answers. Read it over, then print or download it to send to DTA.',
    composedFormLeadGoodCause: 'We wrote this from your answers. Read it over, then print or download it to send to DTA.',
    composedChangeLabel: 'Change my answers',
    composedWhyInfoExempt: 'Telling DTA about why you missed hours can help them update your SNAP case more quickly.',
    composedWhyInfoGoodCause: 'Telling DTA about why you missed hours can help them update your SNAP case more quickly.',
    whyInfoLabel: 'Why are we asking for more information?',
    whyInfoExempt: 'Telling DTA about why you missed hours can help them update your SNAP case more quickly.',
    whyInfoGoodCause: 'Telling DTA about why you missed hours can help them update your SNAP case more quickly.',
    printFormLabel: 'Print or save this form',
    downloadWordLabel: 'Download as Word',
    savingTipsTitle: 'Tips for printing or saving',
    savingTipsBody: 'Print or save this form opens your browser’s print menu. Pick your printer, or choose "Save as PDF" to keep a copy on your device. If the menu is slow to open, use Download as Word instead.',
    emailSelfLabel: 'Email myself a copy',
    /* The subject names SNAP, which is a disclosure to anyone who can see the
     * inbox list. It is kept because a subject vague enough to hide the topic
     * ("The information you asked for") reads as spam and gets deleted unread.
     * The body is where the choice was made to hold back: see
     * buildResultsEmailContent. */
    emailSelfSubject: 'Your SNAP work rules screening',
    emailModalTitle: 'Email yourself a copy',
    /* This lead is a consent notice, so it is longer than house style would
     * normally allow. It has to say three things before someone types an
     * address: what arrives, what does not, and that the email outlives the
     * tab when nothing else in this tool does. */
    emailModalLead: 'We will email your result and the reasons that applied. What you wrote in your own words is not included. The email stays in your inbox until you delete it, so if someone else can read your email, use Print or save this form instead.',
    emailModalLabel: 'Your email address',
    emailModalSendLabel: 'Send email',
    emailModalSendingLabel: 'Sending…',
    emailSentHeading: 'Email sent.',
    emailSentBody: 'Check your inbox. If it is not there in a few minutes, look in your spam folder.',
    emailErrorBody: 'We could not send the email just now. Use Print or save this form, or open the summary in your email app.',
    emailInvalidAddressBody: 'That does not look like an email address. Check it and try again.',
    emailModalMailAppLabel: 'Open in my email app instead',
    emailModalCloseLabel: 'Close',
    /* Body strings for the emailed summary. Separate keys rather than inline
     * text so they appear in SCREENER-COPY.md and the author can edit them
     * without reading the builder. */
    emailBodyResultExempt: 'You may be exempt from the SNAP work rules (ABAWD rules).',
    emailBodyResultGoodCause: 'You may have good cause for not meeting the SNAP work rules (ABAWD rules).',
    emailBodyResultNotExempt: 'This screening did not find a reason you would be exempt from the SNAP work rules (ABAWD rules).',
    emailBodyReasonsHeading: 'Reasons that applied:',
    emailBodyNextSteps: 'To finish, open the screening again to print and sign your letter to DTA. This email is not the letter.',
    emailFallbackHeading: 'If your email app did not open',
    emailFallbackBody: 'Some computers have no email app set up. Copy the summary below and paste it into your email instead. This is a text summary, not the signed letter. Use "Print or save this form" for the copy you send to DTA.',
    emailCopyLabel: 'Copy the text',
    emailCopiedLabel: 'Copied.',
    emailSelectedLabel: 'Text selected. Press Ctrl+C (or Command+C) to copy it.',
    emailTruncatedNote: 'This summary was shortened to fit in an email. Use "Copy the text" in the screening tool to get the full version.',
    otherWaysHeading: 'Other ways to tell DTA',
    otherWaysExemptLead: 'Fill out and send in DTA\u2019s exemption form or explain the information to DTA in a written, signed statement (handwritten note is fine):',
    otherWaysGoodCauseLead: 'Explain the information to DTA in a written, signed statement (handwritten note is fine):'
  };

  /**
   * Proof-and-detail sentences to show under the exempt reasons, in draft order.
   *
   * The reviewer asked that these only appear when they are actually relevant to
   * the person, so each is gated on the reason that makes it relevant rather
   * than shown to everyone behind an "If this is based on..." clause. Someone
   * exempt only because they live with a young child now gets none of them.
   *
   * A standard, named disability benefit (SSI and the like) does not get a
   * sentence: it speaks for itself. Only the "Other" pick, which needs DTA to
   * hear what the benefit is, does. This mirrors `statementPromptsFor`.
   */
  function exemptProofNotes(reasons, copy) {
    const c = copy || RESULT_COPY;
    const rs = Array.isArray(reasons) ? reasons : [];
    const out = [];
    if (rs.includes(WORK_REASON_INCOME) || rs.includes(WORK_REASON_HOURS_30)) out.push(c.exemptProofWork);
    if (rs.includes(HOUSING_EXEMPT_REASON)) out.push(c.exemptProofHousing);
    if (rs.includes(DISABILITY_OTHER_REASON)) out.push(c.exemptProofDisability);
    return out;
  }

  /**
   * Exempt heading as HTML, with only "Good news:", "exempt", and "do not"
   * bolded. The element holding it must be set to normal weight, since headings
   * are bold by default. Use `RESULT_COPY.exemptHeading` where plain text is
   * needed (the email summary, the letter).
   */
  function exemptHeadingHtml() {
    return EXEMPT_HEADING_PARTS
      .map(p => (p.bold ? '<strong>' + escHtml(p.text) + '</strong>' : escHtml(p.text)))
      .join('');
  }

  /**
   * HTML list of DTA contact options (author's draft order).
   * `opts.uploadPrefix` replaces the default "Upload on" lead-in of the first
   * bullet, so the must-meet-the-rules screen can fold its "written, signed
   * statement" sentence into the DTAConnect line.
   */
  function buildDtaContactsHtml(links, opts) {
    const L = links || LINKS;
    const uploadPrefix = (opts && opts.uploadPrefix) || 'Upload on';
    return '<ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#3a424e">'
      + '<li>' + uploadPrefix + ' <a href="' + L.dtaConnect + '" target="_blank" rel="noopener">DTAConnect</a></li>'
      + '<li>Mail: DTA Document Processing Center, P.O. Box 4406, Taunton, MA 02780-0420</li>'
      + '<li>Fax: (617) 887-8765</li>'
      + '<li>Call the DTA Assistance line at <a href="tel:8773822363">(877) 382-2363</a>'
      + '<ul style="margin:4px 0 0;padding-left:20px"><li><a href="' + L.reachDtaWorker + '" target="_blank" rel="noopener">Click here</a> to see how to get help if you can\'t reach DTA by phone</li></ul>'
      + '</li>'
      + '<li>Go to a <a href="' + L.dtaOffices + '" target="_blank" rel="noopener">local DTA office</a> to speak with a SNAP worker</li>'
      + '</ul>';
  }

  /** Printable / downloadable letter to DTA (print, PDF, Word). */
  function buildStatementHTML(opts) {
    const {
      name = '',
      agency = '',
      explain = '',
      sigImg = '',
      rt = 'exempt',
      rs = [],
      gcText = '',
      today = '',
      composed = false,
      /* Labels, not ids, and passed in rather than derived: this builder takes a result
       * and a reason list, never the raw answers, so it has no way to look them up.
       * Defaults to empty, which is also what an unanswered follow-up and "None of the
       * above" produce, so an older caller that does not pass it still builds a correct
       * letter with no housing sub-list. */
      housingPicks = [],
      /* Reason text to the specifics ticked under it, for the reasons that have any: the
       * disability benefits and the state agencies. Keyed by the reason's own wording rather
       * than by id because that is what `rs` carries, and this builder has never been given
       * ids. Empty by default, so a caller that does not pass it gets the letter it always
       * got. housingPicks stays separate: that one is not a sub-list under a bullet, it is a
       * paragraph of its own in the housing section. */
      subItemsByReason = {}
    } = opts || {};
    const esc = escHtml;
    const blank = (w) => `<span style="border-bottom:1px solid #111;display:inline-block;min-width:${w};padding:0 2px 2px">${'&nbsp;'.repeat(8)}</span>`;

    const addrRow = (label, value) =>
      `<tr>
        <td style="width:108px;padding:5px 12px 5px 0;font-weight:700;vertical-align:top;color:#222">${esc(label)}</td>
        <td style="padding:5px 0;border-bottom:1px solid #bbb;color:#111">${value ? esc(value) : blank('280px')}</td>
      </tr>`;

    /* `explain` is either a plain string or, for pages that show one labelled
     * blank per exemption, an array of { prompt, text }. Composed entries also
     * carry { reasons }, which is what the coverage check below reads. Resolved
     * here rather than further down because the body needs it. */
    const explainEntries = Array.isArray(explain)
      ? explain.filter(e => e && (e.prompt || e.text))
      : [{ prompt: '', text: explain }];

    /* Which reasons a composed paragraph already speaks for.
     *
     * The letter states a reason in up to three places: the bulleted list, a
     * fixed paragraph for the four reasons that need one, and the person's own
     * explanation. In the write-in version the third is a blank box, so the
     * repetition never showed. Composed, it does: a letter came out saying "I do
     * not have a regular place to sleep" twice, and listing "Take care of a
     * child under 6 years old" as a bullet directly above a paragraph opening
     * with the same words.
     *
     * So in composed mode the paragraph is the only statement of its reason,
     * and the bullet and the fixed paragraph both drop out. The compose
     * functions carry the claim and the request the fixed paragraphs used to
     * make, which is why the work block opens by stating the exemption and the
     * housing block closes by asking for a review.
     *
     * Reasons with no composed paragraph, which is most of them, are untouched
     * and still appear as bullets. */
    const covered = new Set();
    if (composed) {
      explainEntries.forEach(e => {
        if (String(e.text == null ? '' : e.text).trim()) {
          (e.reasons || []).forEach(r => covered.add(r));
        }
      });
    }

    const explainBox = (text) => {
      const inner = String(text == null ? '' : text).trim() ? esc(text) : '&nbsp;';
      return `<div style="margin:8px 0 0 18px;border:1px solid #999;padding:12px 14px;min-height:48px;white-space:pre-wrap;background:#fafafa">${inner}</div>`;
    };

    function explainTextForPrompt(prompt) {
      const entry = explainEntries.find(e => e.prompt === prompt);
      return entry ? String(entry.text == null ? '' : entry.text) : '';
    }

    function explainTextForReason(reason) {
      for (const p of STATEMENT_PROMPTS) {
        if (p.reason === reason) return explainTextForPrompt(p.prompt);
      }
      for (const e of explainEntries) {
        if (Array.isArray(e.reasons) && e.reasons.includes(reason)) {
          return String(e.text == null ? '' : e.text);
        }
      }
      return '';
    }

    function needsExplainBox(reason) {
      return STATEMENT_PROMPTS.some(p => p.reason === reason);
    }

    const workPrompt = STATEMENT_PROMPTS.find(p => p.reason === WORK_REASON_INCOME).prompt;

    let body;
    if (rt === 'exempt') {
      const specialReasons = [WORK_REASON_INCOME, WORK_REASON_HOURS_30, DISABILITY_OTHER_REASON, HOUSING_EXEMPT_REASON];
      const exemptReasons = rs.filter(r => !specialReasons.includes(r) && !covered.has(r));
      let inner = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to ask that you update my SNAP case. I believe I am exempt from the ABAWD work rules and should not have to meet them for the following reason(s):</p>`;
      if (exemptReasons.length) {
        const items = exemptReasons.map(r => {
          /* Which benefit, or which agency. The reason alone says someone gets a
           * disability-based benefit or uses a state agency, which leaves a caseworker
           * unable to tell EAEDC from Workers' compensation, or DMH from the Commission
           * for the Blind, without ringing them. */
          const subs = (subItemsByReason[r] || []).length
            ? `<ul style="margin:6px 0 0;padding-left:22px">${
                subItemsByReason[r].map(s => `<li style="margin:0 0 4px">${esc(s)}</li>`).join('')
              }</ul>`
            : '';
          if (!composed && needsExplainBox(r)) {
            return `<li style="margin:0 0 10px">${esc(r)}${subs}${explainBox(explainTextForReason(r))}</li>`;
          }
          return `<li style="margin:0 0 6px">${esc(r)}${subs}</li>`;
        }).join('');
        inner += `<ul style="margin:0 0 16px;padding-left:22px">${items}</ul>`;
      }
      /* Each of these four is skipped when a composed paragraph already covers
       * the reason, because that paragraph says the same thing and more. In
       * write-in mode `covered` is always empty and all four behave as before. */
      const fixedFor = (reason) => rs.includes(reason) && !covered.has(reason);
      const showWorkExplain = !composed && (fixedFor(WORK_REASON_INCOME) || fixedFor(WORK_REASON_HOURS_30));
      if (fixedFor(WORK_REASON_INCOME)) {
        inner += `<p style="margin:0 0 14px">I earn enough income to be exempt from the ABAWD work rules. I can send proof of my income and hours, such as pay stubs or a letter from my employer.</p>`;
      }
      if (fixedFor(WORK_REASON_HOURS_30)) {
        inner += `<p style="margin:0 0 14px">I work 30 or more hours per week while earning less than minimum wage. I can send proof of my hours and pay.</p>`;
      }
      if (showWorkExplain) {
        inner += explainBox(explainTextForPrompt(workPrompt));
      }
      if (fixedFor(DISABILITY_OTHER_REASON)) {
        inner += `<p style="margin:0 0 14px">${esc(RESULT_COPY.statementDisabilityOtherLead)}</p>`;
        if (!composed) inner += explainBox(explainTextForReason(DISABILITY_OTHER_REASON));
      }
      if (fixedFor(HOUSING_EXEMPT_REASON)) {
        inner += `<p style="margin:0 0 14px">${esc(RESULT_COPY.statementHousingLead)}</p>`;
        /* The follow-up selections, the author's request of 2026-08-06. Above the
         * write-in box, not below it: these are the checkbox answers the screening
         * already has, and the box is the person's own account, which should be the last
         * thing DTA reads in this section. Printed as the option wording verbatim, first
         * person, because that is how the options are written and it reads as the
         * person's statement rather than as a form dump. */
        if (housingPicks.length) {
          inner += `<p style="margin:0 0 6px">${esc(RESULT_COPY.statementHousingPicksLead)}</p>
            <ul style="margin:0 0 14px;padding-left:22px">${
              housingPicks.map(p => `<li style="margin:0 0 6px">${esc(p)}</li>`).join('')
            }</ul>`;
        }
        if (!composed) inner += explainBox(explainTextForReason(HOUSING_EXEMPT_REASON));
      }
      if (!composed && explainEntries.some(e => e.prompt === STATEMENT_PROMPT_FALLBACK)) {
        inner += explainBox(explainTextForPrompt(STATEMENT_PROMPT_FALLBACK));
      }
      if (!composed) {
        explainEntries.forEach(e => {
          if (!e.prompt) inner += explainBox(String(e.text == null ? '' : e.text));
        });
      }
      body = inner;
    } else if (rt === 'goodcause') {
      body = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to explain why I could not meet the ABAWD work rules for one or more months. My good-cause reason is:</p>
        <p style="margin:0 0 14px;padding:12px 14px;border-left:3px solid #333;background:#f7f7f7">${esc(gcText)}</p>`;
      if (!composed) body += explainBox(explainTextForPrompt(STATEMENT_PROMPT_GOODCAUSE));
    } else {
      body = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing about my SNAP case and the ABAWD work rules.</p>`;
    }

    /* Guided mode composed these sentences from pick-lists, so they are prose
     * and have to look like it. A caption above a ruled box is right for
     * something handwritten and wrong here: it makes a finished letter read as
     * a form someone filled in, which is the opposite of what this version is
     * trying to show. Captions and borders both go, and an entry that composed
     * to nothing is dropped rather than printed as an empty box to write in. */
    let explainContent;
    if (composed) {
      const paras = explainEntries
        .map(e => String(e.text == null ? '' : e.text).trim())
        .filter(Boolean);
      explainContent = paras
        .map(t => `<p style="margin:0 0 14px">${esc(t)}</p>`)
        .join('');
    } else {
      explainContent = '';
    }

    const sigBlock = sigImg
      ? `<img src="${sigImg}" alt="Signature" width="320" height="72" style="display:block;width:320px;height:72px;max-width:100%;margin:0 0 4px">`
      : `<div style="border-bottom:1px solid #111;height:56px;width:320px;max-width:100%;margin:0 0 4px"></div>`;

    return `<div style="font-family:Georgia,'Times New Roman',serif;color:#111;max-width:6.5in;margin:0 auto;font-size:12pt;line-height:1.55">
      <table style="width:100%;border-collapse:collapse;margin:0 0 28px;font-size:11pt;break-inside:avoid;page-break-inside:avoid">
        ${addrRow('Date', today)}
        ${addrRow('To', 'Massachusetts Department of Transitional Assistance (DTA)')}
        ${addrRow('From', name)}
        ${agency ? addrRow('Client / Agency ID', agency) : ''}
        ${addrRow('Re', 'SNAP benefits, ABAWD work rules')}
      </table>

      ${body}

      ${explainContent ? `<div style="margin:0;break-inside:avoid;page-break-inside:avoid">${explainContent}</div>` : ''}

      <div style="margin:28px 0 0;break-inside:avoid;page-break-inside:avoid">
        <p style="margin:0 0 18px">Sincerely,</p>
        ${sigBlock}
        <div style="font-size:11pt;margin:0 0 2px">${name ? esc(name) : 'Printed name: _________________________________'}</div>
        <div style="font-size:10.5pt;color:#444">Date signed: ${today ? esc(today) : '________________'}</div>
      </div>
    </div>`;
  }

  /**
   * Plain-text summary for "email yourself a copy".
   *
   * Carries the result and the reasons that applied, and stops there. What it
   * deliberately leaves out is what the person wrote in their own words, their
   * name, and their Client/Agency ID. Until 2026-08-04 it included all three.
   *
   * The reason is that the email is the only artefact this tool produces that
   * outlives the tab and cannot be taken back. Everything else is built to
   * assume a shared or monitored device: answers live in sessionStorage, Quick
   * exit leaves no history entry, and the questions cover pregnancy,
   * disability, substance use treatment and domestic violence. A paragraph in
   * someone's own words about a domestic violence incident, sitting in an inbox
   * they may not control, is a worse outcome than a slightly less useful email.
   * Nothing is lost that matters: the free text, the name, and the ID all
   * appear in Print or save this form, which is the copy DTA actually needs
   * and which never leaves the device.
   *
   * The reasons themselves are still sensitive, and a bare "You are a survivor
   * of domestic violence" is close to as exposing as the paragraph. Making the
   * reasons non-specific was raised and is an author decision, not settled
   * here.
   *
   * `toolUrl` is passed in rather than derived, so this module holds no path of
   * its own and the link stays right at any deploy subpath.
   */
  function buildResultsEmailContent(opts) {
    const {
      rt = 'exempt',
      rs = [],
      gcText = '',
      toolUrl = '',
      copy = RESULT_COPY
    } = opts || {};
    const lines = [];
    if (rt === 'exempt') {
      lines.push(copy.emailBodyResultExempt);
      if (rs.length) {
        lines.push('');
        lines.push(copy.emailBodyReasonsHeading);
        rs.forEach(r => { lines.push('- ' + r); });
      }
    } else if (rt === 'goodcause') {
      lines.push(copy.emailBodyResultGoodCause);
      if (gcText) {
        lines.push('');
        lines.push(copy.emailBodyReasonsHeading);
        lines.push('- ' + gcText);
      }
    } else {
      lines.push(copy.emailBodyResultNotExempt);
    }
    lines.push('');
    lines.push(copy.emailBodyNextSteps);
    if (toolUrl) {
      lines.push('');
      lines.push(toolUrl);
    }
    return {
      subject: copy.emailSelfSubject,
      body: lines.join('\n').trim()
    };
  }

  /* A mailto: URL is not allowed to be as long as we want. Windows refuses to
   * hand off anything past roughly 2048 characters and several mail clients
   * truncate without saying so, which with the free-text boxes filled in means
   * a half-empty draft or no draft at all. Stay well under the cap. */
  const MAILTO_MAX_URL = 1800;

  function encodedLength(text) {
    /* A slice can split a surrogate pair, and encodeURIComponent throws on a
     * lone surrogate. Reporting that candidate as too long makes the search
     * below back off to the previous character instead of crashing. */
    try { return encodeURIComponent(text).length; } catch (e) { return Infinity; }
  }

  /** Longest prefix of `text` that survives encoding within `limit` characters. */
  function trimToEncodedLength(text, limit) {
    if (encodedLength(text) <= limit) return text;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (encodedLength(text.slice(0, mid)) <= limit) lo = mid;
      else hi = mid - 1;
    }
    let cut = text.slice(0, lo);
    // Prefer a line boundary, but not at the cost of most of the text.
    const nl = cut.lastIndexOf('\n');
    if (nl > lo * 0.6) cut = cut.slice(0, nl);
    return cut.replace(/\s+$/, '');
  }

  /**
   * mailto: URL for the results summary, trimmed to a length mail clients
   * accept. `truncated` tells the caller the draft is not the whole summary.
   */
  function buildResultsMailto(opts) {
    const {
      subject = '',
      body = '',
      max = MAILTO_MAX_URL,
      copy = RESULT_COPY
    } = opts || {};
    const prefix = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=';
    const room = max - prefix.length;
    if (room <= 0) return { url: prefix, truncated: Boolean(body) };
    if (encodedLength(body) <= room) {
      return { url: prefix + encodeURIComponent(body), truncated: false };
    }
    const note = '\n\n' + copy.emailTruncatedNote;
    const text = trimToEncodedLength(body, Math.max(0, room - encodedLength(note))) + note;
    return { url: prefix + encodeURIComponent(text), truncated: true };
  }

  function create(variant) {
    const v = normVariant(variant);
    const GROUPS_V = groupsForVariant(v);
    const QUESTIONS = buildQuestions(v);
    const GOODCAUSE = buildGoodCause(v);
    const GC_TEXT = buildGcText(v);
    const GOODCAUSE_CATEGORIES = goodCauseCategories(v);
    const Q_BY_ID = {};
    QUESTIONS.forEach(q => { Q_BY_ID[q.id] = q; });

    return {
      NONE,
      PRODUCTION_QUICK_EXIT_URL,
      LINKS,
      WORK_INCOME_THRESHOLD,
      MA_MIN_WAGE,
      WORK_HOURS_AT_MIN_WAGE,
      WORK_HOURS_COMPLIANCE,
      WORK_REASON_INCOME,
      WORK_REASON_HOURS_30,
      DISABILITY_OTHER_REASON,
      HOUSING_EXEMPT_REASON,
      QUESTIONS,
      GOODCAUSE,
      GC_TEXT,
      GOODCAUSE_CATEGORIES,
      GROUPS: GROUPS_V,
      Q_BY_ID,
      migrateAnswers: (answers) => migrateAnswers(answers, v),
      housingUnableExempt: (answers) => housingUnableExempt(answers),
      exemptReasons: (answers) => exemptReasonsFor(answers, QUESTIONS),
      exemptReasonEntries: (answers) => exemptReasonEntriesFor(answers, QUESTIONS),
      housingFollowupLabels: (answers) => housingFollowupLabels(answers, QUESTIONS),
      stateAgencyLabels: (answers) => stateAgencyLabels(answers, QUESTIONS),
      disabilityNamedLabels: (answers) => disabilityNamedLabels(answers, QUESTIONS),
      resultType: (answers) => resultTypeFor(answers, QUESTIONS),
      shouldSkipGoodCause: (answers) => shouldSkipGoodCause(answers, QUESTIONS),
      endsScreeningEarly: (answers) => endsScreeningEarly(answers),
      goodCauseText: (answers) => goodCauseText(answers, GC_TEXT),
      statementPrompts: (answers) => statementPromptsFor(exemptReasonsFor(answers, QUESTIONS), resultTypeFor(answers, QUESTIONS)),
      /* Guided mode. Both read the same reasons the write-in prompts do, so a
       * change to who counts as exempt moves the two versions together. */
      guidedQuestions: (answers) => guidedQuestionsFor(
        exemptReasonsFor(answers, QUESTIONS), resultTypeFor(answers, QUESTIONS), answers),
      composeStatement: (answers, today) => composeStatementFor(
        exemptReasonsFor(answers, QUESTIONS), resultTypeFor(answers, QUESTIONS), answers, today),
      pageQuestions: (answers, step, gc) => pageQuestionsFor(answers, step, gc, GROUPS_V, Q_BY_ID, GOODCAUSE),
      qById: (id) => (id === 'goodcause' ? GOODCAUSE : Q_BY_ID[id]),
      workOptionKind: (id) => {
        const o = WORK_OPTION_DEFS.find(x => x.id === id);
        return o ? o.kind : null;
      }
    };
  }

  return {
    NONE,
    PRODUCTION_QUICK_EXIT_URL,
    LINKS,
    VARIANTS,
    WORK_INCOME_THRESHOLD,
    MA_MIN_WAGE,
    WORK_HOURS_AT_MIN_WAGE,
    WORK_HOURS_COMPLIANCE,
    WORK_REASON_INCOME,
    WORK_REASON_HOURS_30,
    DISABILITY_OTHER_REASON,
    HOUSING_EXEMPT_REASON,
    HOUSING_OPTION_DEFS,
    WORK_OPTION_DEFS,
    DISABILITY_OPTION_DEFS,
    STATE_AGENCY_OPTION_DEFS,
    create,
    migrateAnswers,
    housingUnableExempt,
    disabilityExempt,
    disabilityReasons,
    isIncomeWorkExempt,
    isHours30WorkExempt,
    exemptReasonsFor,
    exemptReasonEntriesFor,
    REASON_TEXT_BY_ID,
    resolveReasonIds,
    resultTypeFor,
    shouldSkipGoodCause,
    buildQuestions,
    buildGoodCause,
    buildGcText,
    goodCauseCategories,
    statementPromptsFor,
    GUIDED_BLOCKS,
    GUIDED_GOODCAUSE_BLOCK,
    guidedBlocksFor,
    guidedQuestionsFor,
    composeStatementFor,
    buildStatementHTML,
    DTA_SUBMISSION,
    RESULT_COPY,
    exemptHeadingHtml,
    exemptProofNotes,
    buildDtaContactsHtml,
    buildResultsEmailContent,
    buildResultsMailto,
    MAILTO_MAX_URL,
    escHtml
  };
});
