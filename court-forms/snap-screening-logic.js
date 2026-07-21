/**
 * SNAP ABAWD screening — shared decision logic for classic + v2 UIs.
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
  const QUICK_EXIT_URL = 'snap-screening.html';

  /* ---- Work-rule thresholds (MA ABAWD) ---- */
  const WORK_INCOME_THRESHOLD = 217.5;
  const MA_MIN_WAGE = 15;
  const WORK_HOURS_AT_MIN_WAGE = 14.5;
  const WORK_HOURS_COMPLIANCE = 30;

  const WORK_REASON_INCOME = 'Earn enough income to be exempt from the work rules';
  const WORK_REASON_MEETING = 'Already working enough hours to meet the work rules';
  const HOUSING_EXEMPT_REASON = 'No regular place to sleep, and DTA\u2019s unable-to-work factors apply';

  const HOUSING_OPTION_DEFS = [
    { id: 'diploma', labelClassic: 'I have a high school diploma (including GED or HiSet)', labelV2: 'I have a high school diploma (including GED or HiSet)' },
    { id: 'ongoing_care', labelClassic: 'I regularly see a health care provider for an ongoing illness, like a dentist, therapist, psychiatrist, or doctor for ongoing treatment', labelV2: 'I regularly see a health care provider for an ongoing illness (dentist, therapist, psychiatrist, or doctor)' },
    { id: 'steady_job', labelClassic: 'I have had a steady job for at least 6 months in the last year', labelV2: 'I have had a steady job for at least 6 months in the last year' },
    { id: 'full_time_student', labelClassic: 'I have been a full-time student for at least 6 months in the last year', labelV2: 'I have been a full-time student for at least 6 months in the last year' },
    { id: 'hospitalized', labelClassic: 'I have been hospitalized in the last 6 months', labelV2: 'I have been hospitalized in the last 6 months' }
  ];

  const WORK_OPTION_DEFS = [
    { id: 'income_weekly', kind: 'income', label: 'I make $217.50 a week or more (before taxes)' },
    { id: 'hours_min_wage', kind: 'income', label: 'I work at least 14.5 hours a week at $15+ an hour' },
    { id: 'hours_30', kind: 'meeting', label: 'I work 30 hours or more a week (I make less than minimum wage)' }
  ];

  const DISABILITY_OPTION_DEFS = [
    { id: 'eaedc', label: 'EAEDC', exempt: true },
    { id: 'veteran', label: 'Veteran\u2019s disability benefit', exempt: true },
    { id: 'workers_comp', label: 'Workers\u2019 compensation', exempt: true },
    { id: 'pfml', label: 'Paid Family Medical Leave', exempt: true },
    { id: 'std', label: 'Short-term disability', exempt: true },
    { id: 'ssi_ssdi', label: 'SSI or SSDI', exempt: true },
    { id: 'other', label: 'Other', exempt: false }
  ];

  const DISABILITY_OTHER_HELP = 'Only choose Other if you receive a disability benefit that is not listed above. Other alone does not count as an exemption.';

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
      dv: { text: 'Has a domestic violence or safety situation made it hard for you to work?', help: 'DTA has domestic violence specialists in each local office who can help. Your answer stays private.' },
      tribe: { text: 'Are you an Alaska Native or a member of an American Indian, Urban Indian, or California Indian tribe?', help: 'Choose "Yes" if you have a parent or grandparent who is a member of one of these tribes.' },
      tafdc: { text: 'Do you get, or are you applying for, TAFDC cash assistance benefits?' },
      disability: { text: 'Do you get any of these disability benefits?', noneLabel: 'None of the above' },
      unemployment: { text: 'Do you get, or are you applying for, unemployment benefits?' },
      stateagency: { text: 'Do you get services from any of these state agencies?', help: 'MassAbility, Dept. of Mental Health, Dept. of Developmental Services, MA Commission for the Blind, or MA Commission for the Deaf and Hard of Hearing.' },
      school: { text: 'Are you enrolled in school half-time or more?', help: 'This includes high school, vocational/technical school, college, or any education and training program.' },
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
      dv: { text: 'Has a safety problem at home made it hard for you to work?', help: 'DTA has domestic violence specialists in each local office who can help. Your answer stays private.' },
      tribe: { text: 'Are you an Alaska Native, or a member of an American Indian, Urban Indian, or California Indian tribe?', help: 'Choose "Yes" if you have a parent or grandparent who is a member of one of these tribes.' },
      tafdc: { text: 'Do you get, or are you applying for, TAFDC cash assistance?' },
      disability: { text: 'Do you get any of these disability benefits?', help: 'Pick every one that is true for you. If none are, choose "None of these."', noneLabel: 'None of these' },
      unemployment: { text: 'Do you get, or are you applying for, unemployment benefits?' },
      stateagency: { text: 'Do you get services from a Massachusetts state agency?', help: 'For example: MassAbility, Dept. of Mental Health, Dept. of Developmental Services, MA Commission for the Blind, or MA Commission for the Deaf and Hard of Hearing.' },
      school: { text: 'Are you in school half-time or more?', help: 'This includes high school, vocational/technical school, college, or any education and training program.' },
      working: { text: 'Are you working for pay right now?', help: 'Pick the one that is true for you.', noneLabel: 'None of these' }
    }
  };

  const REASONS = {
    child14: 'Live with a child under 14 years old',
    health: 'Have a health reason that makes it hard to work 30 or more hours a week',
    child6: 'Take care of a child under 6 years old',
    caretaker: 'Take care of a child or adult who cannot care for themselves',
    pregnant: 'Pregnant',
    dv: 'A domestic violence or safety situation',
    tribe: 'Alaska Native or member of a Tribe',
    tafdc: 'Get or applying for TAFDC cash assistance',
    disability: 'Get disability benefits',
    unemployment: 'Get or applying for unemployment benefits',
    stateagency: 'Get services from a state agency',
    school: 'Enrolled in school half-time or more'
  };

  const GROUPS = [
    { title: 'Children and people you care for', ids: ['child14', 'child6', 'caretaker', 'pregnant'] },
    { title: 'Your health, housing, and safety', ids: ['health', 'housing', 'housingFollowup', 'dv'] },
    { title: 'Benefits and cash assistance', ids: ['tafdc', 'disability', 'unemployment', 'stateagency'] },
    { title: 'School, work, and background', ids: ['school', 'working', 'tribe'] }
  ];

  function housingOptions(variant) {
    const v = variant === 'v2' ? 'labelV2' : 'labelClassic';
    return HOUSING_OPTION_DEFS.map(o => ({ id: o.id, label: o[v] }));
  }

  function disabilityOptions() {
    return DISABILITY_OPTION_DEFS.map(o => ({ id: o.id, label: o.label }));
  }

  function workOptions() {
    return WORK_OPTION_DEFS.map(o => ({ id: o.id, label: o.label, kind: o.kind }));
  }

  function buildQuestions(variant) {
    const copy = QUESTION_COPY[variant] || QUESTION_COPY.classic;
    const housingOpts = housingOptions(variant);
    const disabilityOpts = disabilityOptions();
    const workOpts = workOptions();

    return [
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
      { id: 'unemployment', type: 'yn', text: copy.unemployment.text, exemptOn: 'yes', reason: REASONS.unemployment },
      { id: 'stateagency', type: 'yn', text: copy.stateagency.text, help: copy.stateagency.help, exemptOn: 'yes', reason: REASONS.stateagency },
      { id: 'school', type: 'yn', text: copy.school.text, help: copy.school.help, exemptOn: 'yes', reason: REASONS.school },
      {
        id: 'working', type: 'single', text: copy.working.text, help: copy.working.help,
        options: workOpts, noneLabel: copy.working.noneLabel
      }
    ];
  }

  function buildGoodCause(variant) {
    const def = GOODCAUSE_DEFS[variant] || GOODCAUSE_DEFS.classic;
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
    const def = GOODCAUSE_DEFS[variant] || GOODCAUSE_DEFS.classic;
    const out = {};
    def.options.forEach(o => { out[o.id] = o.result; });
    return out;
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
      if (value === o.id || value === o.label) return o.id;
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
    const def = GOODCAUSE_DEFS[variant] || GOODCAUSE_DEFS.classic;
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

  function disabilityExempt(answers) {
    const v = answers.disability;
    if (!Array.isArray(v) || !v.length) return false;
    const exemptIds = DISABILITY_OPTION_DEFS.filter(o => o.exempt).map(o => o.id);
    return v.some(id => exemptIds.includes(id));
  }

  function isIncomeWorkExempt(answers) {
    const w = answers.working;
    return w === 'income_weekly' || w === 'hours_min_wage';
  }

  function isMeetingWork(answers) {
    return answers.working === 'hours_30';
  }

  function exemptReasonsFor(answers, questions) {
    const qs = questions || buildQuestions('classic');
    const r = [];
    for (const q of qs) {
      if (q.id === 'housing' || q.id === 'housingFollowup' || q.id === 'working' || q.id === 'disability') continue;
      const v = answers[q.id];
      if (q.exemptOn && v === q.exemptOn) r.push(q.reason);
    }
    if (disabilityExempt(answers)) r.push(REASONS.disability);
    if (housingUnableExempt(answers)) r.push(HOUSING_EXEMPT_REASON);
    if (isIncomeWorkExempt(answers)) r.push(WORK_REASON_INCOME);
    return r;
  }

  function resultTypeFor(answers, questions) {
    if (answers.ageRange === 'no') return 'ageinfo';
    const exempt = exemptReasonsFor(answers, questions);
    if (exempt.length) return 'exempt';
    if (isMeetingWork(answers)) return 'meeting';
    const g = answers.goodcause;
    if (g && g !== NONE) return 'goodcause';
    return 'notexempt';
  }

  function shouldSkipGoodCause(answers, questions) {
    const rt = resultTypeFor(answers, questions);
    return rt === 'exempt' || rt === 'meeting' || rt === 'ageinfo';
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
      today = ''
    } = opts || {};
    const esc = escHtml;
    const blank = (w) => `<span style="border-bottom:1px solid #111;display:inline-block;min-width:${w};padding:0 2px 2px">${'&nbsp;'.repeat(8)}</span>`;

    const addrRow = (label, value) =>
      `<tr>
        <td style="width:108px;padding:5px 12px 5px 0;font-weight:700;vertical-align:top;color:#222">${esc(label)}</td>
        <td style="padding:5px 0;border-bottom:1px solid #bbb;color:#111">${value ? esc(value) : blank('280px')}</td>
      </tr>`;

    let body;
    if (rt === 'exempt') {
      const exemptReasons = rs.filter(r => r !== WORK_REASON_INCOME);
      let inner = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to tell you about my situation regarding the SNAP ABAWD work rules. <strong>I believe I should not have to meet these work rules</strong> for the reason(s) below.</p>`;
      if (exemptReasons.length) {
        const items = exemptReasons.map(r => `<li style="margin:0 0 6px">${esc(r)}</li>`).join('');
        inner += `<ul style="margin:0 0 16px;padding-left:22px">${items}</ul>`;
      }
      if (rs.includes(WORK_REASON_INCOME)) {
        inner += `<p style="margin:0 0 14px">I earn enough income to be exempt from the ABAWD work rules.</p>`;
      }
      body = inner;
    } else if (rt === 'meeting') {
      body = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to tell you about my situation regarding the SNAP ABAWD work rules. <strong>I am already meeting the work rules</strong> by working enough hours each week. Please update my case accordingly.</p>`;
    } else if (rt === 'goodcause') {
      body = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to tell you about my situation regarding the SNAP ABAWD work rules. <strong>I was not able to meet the work rules for one or more months</strong> because of the following good-cause reason:</p>
        <p style="margin:0 0 14px;padding:12px 14px;border-left:3px solid #333;background:#f7f7f7">${esc(gcText)}</p>`;
    } else {
      body = `<p style="margin:0 0 14px">Dear DTA,</p>
        <p style="margin:0 0 14px">I am writing to tell you about my situation regarding the SNAP ABAWD work rules.</p>`;
    }

    const explainContent = explain.trim()
      ? esc(explain)
      : '<span style="color:#666;font-style:italic">(No additional explanation provided.)</span>';

    const sigBlock = sigImg
      ? `<img src="${sigImg}" alt="Signature" width="320" height="72" style="display:block;width:320px;height:72px;max-width:100%;margin:0 0 4px">`
      : `<div style="border-bottom:1px solid #111;height:56px;width:320px;max-width:100%;margin:0 0 4px"></div>`;

    return `<div style="font-family:'Atkinson Hyperlegible',Georgia,'Times New Roman',serif;color:#111;max-width:6.5in;margin:0 auto;font-size:11.5pt;line-height:1.55">
      <div style="border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:22px">
        <div style="font-size:10pt;letter-spacing:.04em;text-transform:uppercase;color:#444;margin-bottom:4px">Statement to DTA</div>
        <div style="font-size:17pt;font-weight:700;line-height:1.25;color:#111">SNAP ABAWD Work Rules — Client Statement</div>
        <div style="font-size:10pt;color:#555;margin-top:6px">Prepared by the SNAP recipient (not an official DTA form)</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:11pt">
        ${addrRow('Date', today)}
        ${addrRow('To', 'Massachusetts Department of Transitional Assistance (DTA)')}
        ${addrRow('From', name)}
        ${addrRow('Client / Agency ID', agency)}
        ${addrRow('RE', 'SNAP work rules (ABAWD)')}
      </table>

      ${body}

      <div style="margin:20px 0 0">
        <div style="font-weight:700;margin:0 0 8px;font-size:11pt">Additional information (in my own words)</div>
        <div style="border:1px solid #999;padding:12px 14px;min-height:72px;white-space:pre-wrap;background:#fff">${explainContent}</div>
      </div>

      <div style="margin:28px 0 0">
        <p style="margin:0 0 18px">Sincerely,</p>
        ${sigBlock}
        <div style="font-size:11pt;margin:0 0 2px">${name ? esc(name) : 'Printed name: _________________________________'}</div>
        <div style="font-size:10.5pt;color:#444">Date signed: ${today ? esc(today) : '________________'}</div>
      </div>

      <div style="margin:28px 0 0;padding:14px 16px;border:1px solid #ccc;background:#f9f9f9;font-size:10pt;line-height:1.5">
        <div style="font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:.03em;font-size:9.5pt">How to send this statement</div>
        <ul style="margin:0;padding-left:18px">
          <li style="margin:0 0 4px">Upload at <span style="word-break:break-all">${esc(DTA_SUBMISSION.connectUrl)}</span></li>
          <li style="margin:0 0 4px">Mail: ${esc(DTA_SUBMISSION.mail)}</li>
          <li style="margin:0 0 4px">Fax: ${esc(DTA_SUBMISSION.fax)}</li>
          <li style="margin:0">Call the DTA Assistance Line: ${esc(DTA_SUBMISSION.phone)}</li>
        </ul>
      </div>

      <p style="font-size:9pt;color:#666;margin:20px 0 0;padding-top:10px;border-top:1px solid #ccc;line-height:1.45">Prepared with the Court Forms Online SNAP work-rules screening tool. This document is based on the answers provided and is general information, not legal advice.</p>
    </div>`;
  }

  function create(variant) {
    const v = variant === 'v2' ? 'v2' : 'classic';
    const QUESTIONS = buildQuestions(v);
    const GOODCAUSE = buildGoodCause(v);
    const GC_TEXT = buildGcText(v);
    const Q_BY_ID = {};
    QUESTIONS.forEach(q => { Q_BY_ID[q.id] = q; });

    return {
      NONE,
      QUICK_EXIT_URL,
      WORK_INCOME_THRESHOLD,
      MA_MIN_WAGE,
      WORK_HOURS_AT_MIN_WAGE,
      WORK_HOURS_COMPLIANCE,
      WORK_REASON_INCOME,
      WORK_REASON_MEETING,
      HOUSING_EXEMPT_REASON,
      QUESTIONS,
      GOODCAUSE,
      GC_TEXT,
      GROUPS,
      Q_BY_ID,
      migrateAnswers: (answers) => migrateAnswers(answers, v),
      housingUnableExempt: (answers) => housingUnableExempt(answers),
      exemptReasons: (answers) => exemptReasonsFor(answers, QUESTIONS),
      resultType: (answers) => resultTypeFor(answers, QUESTIONS),
      shouldSkipGoodCause: (answers) => shouldSkipGoodCause(answers, QUESTIONS),
      goodCauseText: (answers) => goodCauseText(answers, GC_TEXT),
      pageQuestions: (answers, step, gc) => pageQuestionsFor(answers, step, gc, GROUPS, Q_BY_ID, GOODCAUSE),
      qById: (id) => (id === 'goodcause' ? GOODCAUSE : Q_BY_ID[id]),
      workOptionKind: (id) => {
        const o = WORK_OPTION_DEFS.find(x => x.id === id);
        return o ? o.kind : null;
      }
    };
  }

  return {
    NONE,
    QUICK_EXIT_URL,
    WORK_INCOME_THRESHOLD,
    MA_MIN_WAGE,
    WORK_HOURS_AT_MIN_WAGE,
    WORK_HOURS_COMPLIANCE,
    WORK_REASON_INCOME,
    WORK_REASON_MEETING,
    HOUSING_EXEMPT_REASON,
    HOUSING_OPTION_DEFS,
    WORK_OPTION_DEFS,
    DISABILITY_OPTION_DEFS,
    create,
    migrateAnswers,
    housingUnableExempt,
    disabilityExempt,
    isIncomeWorkExempt,
    isMeetingWork,
    exemptReasonsFor,
    resultTypeFor,
    shouldSkipGoodCause,
    buildQuestions,
    buildGoodCause,
    buildGcText,
    buildStatementHTML,
    DTA_SUBMISSION,
    escHtml
  };
});
