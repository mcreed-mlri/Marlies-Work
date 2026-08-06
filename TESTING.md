# Testing the SNAP work rules screener

Everything to check before this is in front of the public, in the order it makes sense to
check it. Work top to bottom on a first pass; after that, the section you need is usually
the one matching what changed.

**This tool exists to get people their SNAP back.** Someone who is exempt and does not know
it, or who gets a letter DTA rejects, is a household that stays cut off. That is the standard
to test against: not "does the page work" but "would this actually get someone reinstated".

A box that will not tick is worth more than a whole page that will. Write down what you did,
what you expected, and what happened, and it can be fixed.

## Before you start

There is no build step and no `npm` on the authoring machine. Serve the folder and open it:

```
python -m http.server 4173 --bind 127.0.0.1
```

Then open the screener and, if you need the archived guided build, its copy:

| Build | URL |
| --- | --- |
| Write-in (shipping) | `http://127.0.0.1:4173/masslegalhelp/tool/snap/` |
| Guided (archived) | `http://127.0.0.1:4173/archive/snap-guided/` |
| The tools landing page | `http://127.0.0.1:4173/masslegalhelp/tool/` |
| The explainer | `http://127.0.0.1:4173/screener/how-it-works.html` |

`?sample=` only works on a review host (localhost, 127.0.0.1, a `.pages.dev`
preview, or a `file://` URL). It is inert on masslegalhelp.org, which is deliberate and is
itself something to test.

- [ ] Have a real phone to hand, not just a narrow browser window. The signature pad, the print dialog, and the mail app all behave differently on a real device.
- [ ] Have a printer or a "Save as PDF" option available.
- [ ] If you can, borrow a screen reader for the accessibility section: VoiceOver on a Mac or iPhone, Narrator on Windows, TalkBack on Android.

## 1. The five-minute smoke test

If any of these fail, stop and report it. Nothing further is worth testing.

- [ ] The start page loads and shows the heading, the intro text, and the start button.
- [ ] The dotted-underlined **ABAWD** in the first paragraph opens a box defining the acronym: on hover with a mouse, on tap on a phone.
- [ ] The start button darkens on hover and sinks by the height of its own bottom edge when held down, then springs back. Check it by keyboard too: hold Space with the button focused.
- [ ] Clicking **Click here to check if the ABAWD work rules apply to you** opens the first question section.
- [ ] Answering nothing at all and clicking through to the end gives the "may need to meet the work rules" result.
- [ ] Answering **Yes** to "Are you pregnant?" and skipping to results gives the exempt result.
- [ ] The exempt result offers a letter, and "Print or save this form" opens a print dialog.
- [ ] **Quick exit** in the top bar leaves the site immediately, and pressing Back does not return to the answers.

## 2. Every exemption, one at a time

Each row is its own run: start over, answer only that question, then use "Skip to results".
Every one of these should give the **exempt** result and name that reason in the letter.

This is the heart of it. An exemption that stops working is a person told they must meet the
work rules when they do not have to.

| Answer this question | With | The letter should list |
| --- | --- | --- |
| Do you live with a child under 14 years old? | **Yes** | I live with a child under 14 who should be part of my SNAP case |
| Do you have a health reason or disability that makes it hard to work at least 30 hours a week? | **Yes** | I have a health reason that makes it hard to work 30 or more hours a week |
| Do you take care of a child under 6 years old? | **Yes** | I take care of a child under 6 years old |
| Do you take care of a child or adult who cannot care for themselves? | **Yes** | I take care of a child or adult who cannot care for themselves |
| Are you pregnant? | **Yes** | I am pregnant |
| Has a domestic violence or safety situation made it hard for you to work? | **Yes** | I am experiencing or have experienced domestic violence, stalking, sexual harassment, sexual assault, or another safety situation that makes it hard to work |
| Are you, or is your parent or grandparent, an Alaska native or a member of an American Indian, Native American, Urban Indian, or California Indian tribe? | **Yes** | I am an Alaska Native or member of a Tribe (or I am a child or grandchild of a member of a Tribe) |
| Do you get, or are you applying for TAFDC cash assistance benefits? | **Yes** | I get or am applying for TAFDC cash assistance |
| Are you participating in a substance use treatment program? | **Yes** | I am participating in a substance use treatment program |
| Do you get, or are you applying for unemployment benefits? | **Yes** | I get or am applying for unemployment benefits |
| Are you enrolled in school half-time or more? | **Yes** | I am enrolled in school half-time or more |

- [ ] `I live with a child under 14 who should be part of my SNAP case` — Do you live with a child under 14 years old?
- [ ] `I have a health reason that makes it hard to work 30 or more hours a week` — Do you have a health reason or disability that makes it hard to work at least 30 hours a week?
- [ ] `I take care of a child under 6 years old` — Do you take care of a child under 6 years old?
- [ ] `I take care of a child or adult who cannot care for themselves` — Do you take care of a child or adult who cannot care for themselves?
- [ ] `I am pregnant` — Are you pregnant?
- [ ] `I am experiencing or have experienced domestic violence, stalking, sexual harassment, sexual assault, or another safety situation that makes it hard to work` — Has a domestic violence or safety situation made it hard for you to work?
- [ ] `I am an Alaska Native or member of a Tribe (or I am a child or grandchild of a member of a Tribe)` — Are you, or is your parent or grandparent, an Alaska native or a member of an American Indian, Native American, Urban Indian, or California Indian tribe?
- [ ] `I get or am applying for TAFDC cash assistance` — Do you get, or are you applying for TAFDC cash assistance benefits?
- [ ] `I am participating in a substance use treatment program` — Are you participating in a substance use treatment program?
- [ ] `I get or am applying for unemployment benefits` — Do you get, or are you applying for unemployment benefits?
- [ ] `I am enrolled in school half-time or more` — Are you enrolled in school half-time or more?

### Disability benefits

The disability question takes more than one answer. Each of these on its own should give the
exempt result.

- [ ] "EAEDC" alone → exempt, listing: I get EAEDC
- [ ] "Veteran’s disability benefit" alone → exempt, listing: I get veteran’s disability benefits
- [ ] "Workers’ compensation" alone → exempt, listing: I get workers’ compensation
- [ ] "Paid Family Medical Leave" alone → exempt, listing: I am on Paid Family Medical Leave
- [ ] "Short-term disability" alone → exempt, listing: I get short-term disability benefits
- [ ] "SSI or SSDI" alone → exempt, listing: I get SSI or SSDI
- [ ] "Other disability benefit or payment" alone → exempt, listing: I get another disability benefit or payment DTA should review
- [ ] "None of the above" alone → **not** exempt on its own.
- [ ] A named benefit **and** "Other" together → the letter lists both `EAEDC` style reasons, not just one.

**Each ticked benefit is its own reason**, from 2026-08-06. They used to collapse into one
"I get disability benefits" line, which left a caseworker unable to tell EAEDC from
workers compensation. Tick two and check both places:

- [ ] On the results page each appears as its own ticked reason, flat, not indented under a parent line.
- [ ] In the printed letter each is its own bullet.
- [ ] The order follows the order of the options on the question, not the order you ticked them.
- [ ] **"Other" reads differently from the rest.** It is the one asking DTA to review something, so it should say "I get another disability benefit or payment DTA should review" rather than naming a benefit.

### State agencies

This was a yes/no with the agency names printed underneath until 2026-08-06. It is now the
list itself, so the tool knows which agency, and the separate Yes/No pair is gone. Because
it is no longer a yes/no it is absent from the table above, which is why it has its own
section: the checklist would otherwise never have you test it at all.

- [ ] "MassAbility (formerly Mass Rehab Commission)" alone → exempt, listing: I get services from MassAbility (formerly Mass Rehab Commission)
- [ ] "Dept. of Mental Health" alone → exempt, listing: I get services from the Dept. of Mental Health
- [ ] "Dept. of Developmental Services" alone → exempt, listing: I get services from the Dept. of Developmental Services
- [ ] "MA Commission for the Blind" alone → exempt, listing: I get services from the MA Commission for the Blind
- [ ] "MA Commission for Deaf and Hard of Hearing" alone → exempt, listing: I get services from the MA Commission for Deaf and Hard of Hearing
- [ ] "No" → **not** exempt.
- [ ] Nothing ticked at all → **not** exempt.

- [ ] The first option reads "MassAbility (formerly Mass Rehab Commission)". The former name matters: someone whose paperwork still says Mass Rehab has to recognise it here.
- [ ] There is **no** separate Yes/No pair under the list. The list is the answer.
- [ ] Ticking two agencies gives **two** reasons on the results page and two bullets in the letter, each naming its agency, in the order the options are listed rather than the order you ticked them.

### Working

Three ways of working count. Confirmed August 2026 by MLRI. The same three figures appear in MLRI’s SNAP Advocacy Guide, May 2026, Part 2, Question 61, a copy of which is in reference/. Treat MLRI’s confirmation as the authority rather than the guide: the guide is written after H.R.1 and its own Question 60 notes that DTA’s regulations had not yet caught up when it went out, and MLRI has since said to be careful with its ABAWD sections. The figures themselves are not in dispute.

- [ ] "Yes, I am making $217.50 a week or more (before taxes)" → exempt, listing: I earn enough money from work to be exempt from the work rules
- [ ] "Yes, I am working at least 14.5 hours a week at $15 or more an hour" → exempt, listing: I earn enough money from work to be exempt from the work rules
- [ ] "Yes, I am working 30 hours or more a week (I make less than minimum wage)" → exempt, listing: I work 30 or more hours a week while earning less than minimum wage
- [ ] "None of the above" → **not** exempt.

| Threshold | Value in the tool |
| --- | --- |
| Weekly earnings that make someone exempt | $217.50 before taxes |
| Massachusetts minimum wage used | $15 an hour |
| Hours a week at that wage that make someone exempt | 14.5 |
| Hours a week that exempt while earning under minimum wage | 30 |
| Hours a week that count as **meeting** the rules | 20 (80 a month), per the wording below |

Those are two different numbers doing two different jobs, and the difference is the whole
tool: 30 hours a week means the work rules do not apply to you, 20 hours a week means they
do apply and you are satisfying them. Anyone reviewing these should confirm both.

| What the screen says about meeting the rules |
| --- |
| Paid work, unpaid work, and/or DTA training program for 20 hours a week (80 hours a month). |

### No regular place to sleep

This one is not a straight yes. Answering **No** to "Do you have a regular place to sleep at
night?" opens a follow-up, and the combination decides it. The full truth table is checked
automatically; these are the cases worth doing by hand because they are the ones that would
be wrong in a way nobody notices.

| After answering "No", pick | Expected result |
| --- | --- |
| None of the above | **Exempt** |
| Nothing at all (the follow-up left untouched) | **Exempt** |
| Hospitalised in the last 6 months | **Exempt** |
| Sees a provider for an ongoing illness | **Exempt** |
| Diploma only | **Exempt** |
| Diploma AND a steady job | **Exempt** |
| Diploma AND full-time student | **Exempt** |
| Diploma, steady job, AND hospitalised | **Exempt** |

- [ ] None of the above
- [ ] Nothing at all (the follow-up left untouched)
- [ ] Hospitalised in the last 6 months
- [ ] Sees a provider for an ongoing illness
- [ ] Diploma only
- [ ] Diploma AND a steady job
- [ ] Diploma AND full-time student
- [ ] Diploma, steady job, AND hospitalised

- [ ] Answering **Yes** to "Do you have a regular place to sleep at night?" hides the follow-up entirely.
- [ ] Answering **No**, picking something, then changing to **Yes** clears the follow-up rather than keeping a hidden answer.

**The ticked answers are echoed back.** The author asked on 2026-08-06 for whatever someone
ticks in the follow-up to appear on the results page and in the letter, so DTA sees what
they actually said and not just the summary line. Read these as a person would: the list
can include things that look like arguments against the exemption, and that is deliberate,
because DTA is being asked to review the whole picture.

- [ ] Answer **No**, tick two or three options, and go to results. They appear as indented sub-bullets under "I do not have a regular place to sleep at night", not as separate exemptions with their own ticks.
- [ ] They read in the order the options are listed on the question, whatever order you ticked them in.
- [ ] The green tick appears on the housing reason only, not on each sub-bullet.
- [ ] Print or save the letter. The same answers appear, introduced by "The following is also true for me:", **above** your own typed explanation. Your words should be the last thing in that section.
- [ ] Tick **None of the above** instead. Still exempt, and no sub-bullets and no list in the letter, because there is nothing to list.
- [ ] With a screen reader, the sub-bullets are announced as a list belonging to the reason above them, not as five more exemptions.

One case to look at and judge rather than tick. Picking **diploma and a steady job** and
nothing else is not exempt on housing, so there is no housing reason on the results page
for the ticked answers to sit under, and they are not shown anywhere. If that reads as the
tool losing what someone told it, say so: the author asked for these to be echoed back and
this is the one path where they are not.

## 3. The age question and its result

Added 2026-08-06 as the first question in section 1. It is the only answer that ends the
screening where it stands, and the only result that offers no letter, so none of the
checks above cover it. It is also absent from the exemption table in section 2 on purpose:
answering No is not an exemption reason, it changes the result outright.

The question is optional, like every other one. It is deliberately not required.

- [ ] Answer **No** and click **Next** on section 1. You should land straight on the age result without seeing sections 2, 3, or 4.
- [ ] Answer **No** and use **Skip to results** instead. Same screen.
- [ ] The result heading reads: You are exempt and do not need to meet the ABAWD work rules because of your age.
- [ ] The panel explains that DTA already has the date of birth on file and that no further action is needed.
- [ ] The word **still** is in italics in the sentence about DTA sending a notice anyway. That emphasis is the author's and is the point of the sentence.
- [ ] The email address in that sentence opens a mail app addressed to info@masslegalservices.org.
- [ ] There is **no** statement form, no name or signature field, and no "Print or save this form" button on this screen. DTA already holds the date of birth, so there is nothing to sign.
- [ ] **Age beats everything.** Answer Yes to pregnant and No to the age question in the same section. Expect the age result, not the exempt result, and no list of reasons.
- [ ] Answer **Yes** to the age question and continue. Section 2 appears and the screening behaves exactly as before.
- [ ] Leave the age question blank and continue. Nothing changes: the result is whatever the other answers give.
- [ ] From the age result, **← Back** returns to section 1 with the answer still selected.
- [ ] Clicking the selected **No** a second time clears it, and **Next** then goes to section 2 as normal.

## 4. The order the decision is made in

These are precedence rules. Each one is a case where two things are true at once and only one
answer is right.

- [ ] **The age result beats every other outcome.** It is checked before the exemption list, so someone outside 18 through 64 gets the age result no matter what else they answered.
- [ ] **An exemption beats good cause.** Answer Yes to pregnant and also pick a good-cause reason. Expect exempt, and the good-cause question should never have been shown.
- [ ] **Good cause only when nothing else applies.** With no exemption, the good-cause question appears as the last question.
- [ ] Picking "This question does not apply to me / I’m not sure" on the good-cause question gives the "may need to meet the work rules" result, not good cause.
- [ ] Every question is optional: clicking a selected answer a second time clears it, and the result changes back.
- [ ] "Skip to results" from any point gives the same result as answering nothing further.

## 5. The guided version (archived)

The shipping screener is write-in only. The guided ending lives at
`archive/snap-guided/` for records. Everything in sections 1–3 applies to both builds,
because the decision is identical: the guided questions add detail to the letter and
change nothing about who is exempt. **That is itself worth testing on the archive copy.**

- [ ] Run the same answers through both URLs. The result screen, the reasons listed, and the outcome must be identical.
- [ ] Answer every guided question, then go back and change your screening answers. The result must still match what the write-in build gives for those answers.

The guided version asks 17 extra questions in total, but nobody sees more than a handful: only the ones about
their own exemptions are asked.

### Which reasons trigger extra questions

| Reason | Questions asked |
| --- | --- |
| A health reason | 3 |
| Caring for someone who cannot care for themselves | 3 |
| Caring for a child under 6 | 2 |
| Working (any of the three) | 3 |
| Another disability benefit ("Other") | 1 |
| No regular place to sleep | 2 |
| A good reason for missing hours | 3 |

And the ones that need no explaining, where the guided version should ask **nothing** and go
straight to a finished letter:

- [ ] Pregnant → no extra questions
- [ ] Lives with a child under 14 → no extra questions
- [ ] Gets or applying for TAFDC → no extra questions
- [ ] Alaska Native or a member of a Tribe → no extra questions
- [ ] In school half-time or more → no extra questions
- [ ] Gets or applying for unemployment → no extra questions
- [ ] A safety or domestic violence situation → no extra questions
- [ ] In a substance use treatment programme → no extra questions
- [ ] Gets services from a state agency → no extra questions
- [ ] A named disability benefit (SSI/SSDI and the like) → no extra questions

### Every guided question and its answers

Work through these on the details screen. Each should be answerable, skippable, and clearable.

**Is this a physical health reason, a mental health reason, or both?**

- A physical health reason
- A mental health reason
- Both
- I would rather not say  *(the one way to decline)*

**How long has this been going on, or how long do you expect it to last?**

- Less than 6 months
- 6 months or more
- I do not know  *(the one way to decline)*

**Do you see a doctor, therapist, or other provider for it?**

- Yes, regularly
- Yes, sometimes
- No
- I am not sure  *(the one way to decline)*

**Who do you take care of?**

- A child
- An adult
- More than one person
- I would rather not say  *(the one way to decline)*

**How often do you provide this care?**

- Every day
- Most days of the week
- A few days a week
- Whenever they need me
- I am not sure  *(the one way to decline)*

**Is anyone else helping with this care?**

- I am the only one
- I share it with someone else
- I am not sure  *(the one way to decline)*

**Does this child live with you?**

- Yes
- No

**How often do you take care of them?**

- Every day
- Most days of the week
- A few days a week
- Whenever they need me
- I am not sure  *(the one way to decline)*

**About how many hours a week do you usually work?**

- Less than 10 hours
- About 10 to 19 hours
- About 20 to 29 hours
- 30 hours or more
- It changes week to week
- I am not sure  *(the one way to decline)*

**How many jobs do you have?**

- One job
- More than one job
- I am not sure  *(the one way to decline)*

**What can you send DTA as proof of your work?**

- Pay stubs
- A letter from my employer
- My work schedule
- I need help getting proof
- None of these  *(the one way to decline)*

**Which benefit or payment is it?**

- MassHealth based on a disability determination
- Private or employer disability insurance
- A VA pension
- Railroad Retirement disability benefits
- A Tribal disability payment
- A disability payment from another state
- Something not on this list  *(the one way to decline)*

**Where do you usually sleep?**

- In a shelter
- Outside, or in a car
- At other people’s homes
- In a motel or hotel
- Somewhere different from night to night
- I would rather not say  *(the one way to decline)*

**What makes it hard for you to work?**

- I have no address or phone to give an employer
- I have no safe place to keep my things
- I have no reliable way to get to a job
- I have health problems
- I have to move often
- I do not feel safe
- None of these  *(the one way to decline)*

**What happened?**

- My car broke down
- I lost my ride
- Public transportation was not running
- I could not afford to get there
- Something else  *(the one way to decline)*

**Which months did this affect?**

- This month
- Last month
- The month before that
- More than three months
- I am not sure  *(the one way to decline)*

**Is this still going on?**

- Yes, it is still going on
- No, it is over now
- I am not sure  *(the one way to decline)*

- [ ] Every option above can be selected, and clicking it again clears it.
- [ ] No question offers two different ways of saying "I do not know". There should be exactly one, and it should be last.
- [ ] Skipping a question leaves its sentence out of the letter rather than filling in a guess.

### Every sentence the tool can write

These are the words that end up above someone's signature on a letter to a state agency.
**Read each one as if you were the DTA worker receiving it.**

- [ ] **Health, all three answered**
      I have both a physical and a mental health condition that makes it hard for me to work 30 or more hours a week. It has lasted 6 months or more, or I expect it to. I see a health care provider for it regularly, and I can ask them for a letter if you need one.
- [ ] **Health, nothing answered**
      I have a health condition that makes it hard for me to work 30 or more hours a week.
- [ ] **Health, declined to say which kind**
      I have a health condition that makes it hard for me to work 30 or more hours a week. I am not seeing a health care provider for it right now.
- [ ] **Caretaking, all answered**
      I take care of an adult who cannot care for themselves. I do this every day. I am the only person providing this care.
- [ ] **Caretaking, nothing answered**
      I take care of someone who cannot care for themselves.
- [ ] **Child under 6, all answered**
      I take care of a child under 6 years old. The child lives with me. I care for them most days of the week.
- [ ] **Child under 6, does not live with them**
      I take care of a child under 6 years old. The child does not live with me.
- [ ] **Working, with proof**
      I earn enough income to be exempt from the ABAWD work rules. I usually work about 20 to 29 hours a week at one job. I can send you my pay stubs and a letter from my employer.
- [ ] **Working, needs help getting proof**
      I work 30 or more hours a week while earning less than minimum wage. I need help getting proof of my work hours and pay.
- [ ] **Working, some proof and some help needed**
      I earn enough income to be exempt from the ABAWD work rules. I can send you my pay stubs. I may need help getting the rest.
- [ ] **Another disability benefit, named**
      I receive MassHealth based on a disability determination. Please review it as part of my exemption screening.
- [ ] **Another disability benefit, not on the list**
      I receive a disability benefit or payment that was not on the list. I will bring the paperwork so you can review it.
- [ ] **A named benefit as well**
      I also receive private or employer disability insurance. Please review it as part of my exemption screening.
- [ ] **No regular place to sleep, several barriers**
      I do not have a regular place to sleep. I usually sleep outside, or in a car. This makes it hard for me to work. I have no address or phone to give an employer. I have no reliable way to get to a job. I do not feel safe. Please review my situation to decide whether I am unable to work under the ABAWD screening.
- [ ] **No regular place to sleep, nothing else answered**
      I do not have a regular place to sleep. Please review my situation to decide whether I am unable to work under the ABAWD screening.
- [ ] **Good cause, transportation**
      My car broke down and I had no other way to get there. I missed hours in July and August 2026. This is still going on.
- [ ] **Good cause, an emergency, now over**
      There was a death in my family. I missed hours in July 2026. This has since been resolved.
- [ ] **Good cause, a job situation, over three months**
      My employer treated me unfairly because of who I am. I missed hours for more than three months. This is still going on.
- [ ] **Good cause, nothing answered**
      *(writes nothing, which is correct here)*

- [ ] Every sentence above is true of the person who would have picked those answers, and says nothing they did not say.
- [ ] None of them reads as though a computer wrote it in a way DTA would question.
- [ ] Dates in the good-cause sentences name the right months, counting back from today.

### The letter must not repeat itself

The letter can state a reason in three places: the bulleted list, a fixed paragraph, and the
person's own explanation. In the guided version the explanation is a real sentence, so the
other two have to give way.

- [ ] A reason with a paragraph beneath it does **not** also appear as a bullet.
- [ ] A reason with no paragraph **does** still appear as a bullet. Try pregnant plus a health reason: one bullet, one paragraph.
- [ ] The housing letter says "I do not have a regular place to sleep" exactly once.
- [ ] The good-cause letter does not repeat its own opening sentence.
- [ ] The working letter states the exemption once and does not promise proof twice.
- [ ] In Version A, the full bullet list and all the fixed paragraphs are still there. None of the above applies to it.

### Reading it back

- [ ] The composed statement is shown on screen before the signature, in full.
- [ ] "Change my answers" goes back to the questions with the previous answers still selected.
- [ ] Changing an answer and returning updates the letter.
- [ ] There is no empty text box anywhere in the guided version.

## 6. The letter itself

Test this on both versions. The letter is the whole point: everything else is a way of
getting to it.

- [ ] **Print or save this form** opens the print dialog and the preview shows the letter, not the web page.
- [ ] The letter has today's date, the DTA address block, the person's name, and their client ID if they gave one.
- [ ] Leaving the client ID blank omits that row rather than printing an empty label.
- [ ] **Download as Word** produces a file that opens in Word, and the signature is in it as a picture.
- [ ] **Email myself a copy** opens a panel where you can enter an email address.
- [ ] The panel says sending from this page is not set up yet, and **Send** stays disabled.
- [ ] **Open in my email app instead** opens the mail app with the summary already filled in.
- [ ] On a machine with no mail app, the fallback panel appears with the text to copy, and "Copy the text" works.
- [ ] A very long set of answers still produces a usable email; the summary is trimmed with a note saying so rather than silently cut.

### What to send DTA

The exempt result tells someone what proof to send, one line per kind of exemption. These are
the author’s wording, added 2026-08-06. One note appears however many boxes were
ticked: someone who selects three agencies should be told to send a letter once.

- [ ] Earning enough, or 30+ hours below minimum wage: Send DTA proof of your work income and hours, such as pay stubs or a letter. If you are having a hard time getting these proofs, tell DTA.
- [ ] Any disability benefit, including Other: Send DTA proof of your disability benefits, such as pay stubs or a letter. If you are having a hard time getting these proofs, tell DTA.
- [ ] Any state agency: Send DTA proof that you are getting services from a state agency, such as a letter from the agency. If you are having a hard time getting these proofs, tell DTA.
- [ ] No regular place to sleep: **no** proof line. The letter already asks DTA to review the housing situation in its own paragraph, so the results card does not repeat it.

- [ ] Tick **three** disability benefits. The proof line appears **once**, not three times.
- [ ] Tick **three** state agencies. Same: one line.
- [ ] Exempt only for pregnancy, or only for living with a child under 14: **no** proof line at all, because those speak for themselves.
- [ ] Exempt for a disability benefit **and** work income: two proof lines, one for each.

### The Client / DTA Agency ID line

The author removed the typed field on 2026-08-06 and asked for the printed letter to carry a
blank for it instead. So this is the one thing on the letter that exists nowhere on screen,
which makes it the easiest to lose without noticing.

- [ ] There is **no** Client / Agency ID box to type into anywhere in the form. Only **Your name**.
- [ ] Print or save the letter. It has a ruled blank labelled "Client / DTA Agency ID (if you have one/know it)", whether or not anything else was filled in.
- [ ] Under that blank it reads: This number is on all DTA notices. This is important to include if you don’t use DTAConnect and you send DTA information by mail, fax, or in person.
- [ ] Download the Word version and email it to yourself. The blank is in both.
- [ ] The emailed **summary** carries no ID and no blank for one. It is a text reminder, not the letter.
- [ ] The blank is wide enough to hand-write eight or nine digits on a printed page.

### The signature

- [ ] Signing with a finger on a phone works and the mark appears.
- [ ] Signing with a mouse works.
- [ ] **Clear** empties the pad.
- [ ] A drawn signature appears in the printed letter as a real image, not a font.
- [ ] Leaving the pad empty prints a ruled line to sign by hand. This is the only route for someone who cannot use a pointer, so it must work.
- [ ] Rotating the phone does not wipe a signature already drawn.

## 7. Privacy and safety

The questions cover pregnancy, disability, substance use treatment, and domestic violence. The
working assumption is a shared or borrowed phone.

- [ ] **Quick exit** leaves the site immediately.
- [ ] After Quick exit, pressing Back does **not** return to a screen with answers on it.
- [ ] After Quick exit, reopening the tool shows the start page with nothing filled in.
- [ ] **Delete my answers** on the results screen clears everything and returns to the start.
- [ ] Closing the tab and reopening the tool shows the start page, not the previous answers.
- [ ] Refreshing mid-way keeps the answers, so a stray reload does not mean starting over.
- [ ] Open the browser's network tab and run the whole screening. **Nothing should be sent anywhere.** No analytics, no fonts from a CDN, no error reporting.
- [ ] Nothing typed into the name, ID, or explanation fields appears in any URL.
- [ ] The privacy callout on the start page and on the statement form shows the same wording: **Your information is private.** MLRI will not save any personal information you share on this form.

## 8. Accessibility

People using this tool are more likely than average to have a disability. That is what several
of the exemptions are about.

### Keyboard only

- [ ] Unplug the mouse. The whole screening can be completed with Tab, arrow keys, Space, and Enter.
- [ ] Arrow keys move between the options of one question; Tab moves between questions.
- [ ] The focus outline is always visible and never hidden behind the sticky footer.
- [ ] Every button and link can be reached and activated.
- [ ] The signature pad cannot be operated by keyboard. Confirm the sentence explaining the paper alternative is present and reachable, and that leaving it blank prints a signature line.

### Screen reader

- [ ] The section heading is announced when you move between sections.
- [ ] The progress bar announces "Section 2 of 4" when the section changes, not just visually.
- [ ] Each question is announced with its options, and selecting one announces the change.
- [ ] Help text behind "What does this mean?" is reachable and announced.
- [ ] The dotted-underlined **ABAWD** on the start page announces as "What does ABAWD mean?", opens on Enter or Space, and reads the definition. The same for **exempt** in the exempt result heading, which should announce "What does exempt mean?" and not the ABAWD one.
- [ ] The result screen heading is announced on arrival.
- [ ] The signature pad announces as a control with an explanation, not as an unlabelled image.

### Seeing it

- [ ] Zoom the browser to 200%. Nothing overlaps, nothing is cut off, no horizontal scrolling.
- [ ] At 400% zoom, or a 320px-wide window, the questions and buttons are still usable.
- [ ] Turn on the operating system's "reduce motion" setting. Screens change without animation. The start button still visibly presses in when clicked: that is feedback for a deliberate action, not decoration, so it should survive the setting. What goes is the easing, not the movement.
- [ ] In high contrast mode, the selected answer is still visibly selected.
- [ ] A selected answer is marked by more than colour alone: there is a filled dot or tick as well as a border.

## 9. Devices and conditions

- [ ] An older Android phone on a slow connection. Time how long the first screen takes.
- [ ] An iPhone, in Safari.
- [ ] A desktop browser: Chrome, Firefox, Safari, and Edge.
- [ ] A phone with the text size turned up in the OS settings.
- [ ] Airplane mode partway through: does the tool keep working, given it needs no network after loading?
- [ ] A tablet in both orientations.
- [ ] The browser Back button mid-screening. It should not lose answers or land on a broken screen.

## 10. Review-only modes and the archived guided build

- [ ] The tools landing page shows one SNAP card only.
- [ ] `?sample=exempt`, `?sample=goodcause`, and `?sample=notexempt` each open the right result on a review host.
- [ ] Sample mode shows the "Sample result" banner and does not overwrite a real session.
- [ ] The archived guided build at `archive/snap-guided/` still loads and names itself as archived.

## 11. Things only a person can judge

None of this can be automated and all of it matters more than the rest of this document.

- [ ] **Is the wording right?** Read `SCREENER-WALKTHROUGH.md`, which lays out every word in the order someone meets it. The author has final say on copy.
- [ ] **Are the thresholds still current?** Confirmed August 2026 by MLRI. The same three figures appear in MLRI’s SNAP Advocacy Guide, May 2026, Part 2, Question 61, a copy of which is in reference/. Treat MLRI’s confirmation as the authority rather than the guide: the guide is written after H.R.1 and its own Question 60 notes that DTA’s regulations had not yet caught up when it went out, and MLRI has since said to be careful with its ABAWD sections. The figures themselves are not in dispute. Worth re-checking only if a state minimum wage rise or a federal change has landed since.
- [ ] **Is the exemption list complete?** Someone who knows DTA policy should confirm nothing is missing. A missing exemption is a person who stays cut off.
- [ ] **Would DTA accept the composed letter?** The guided version is archived, but the composed sentences in `SCREENER-COPY.md` section 10 are still worth a legal read if the idea returns.
- [ ] **Is a composed statement still the claimant's statement?** A question for lawyers, not designers. It sits above their signature.
- [ ] **Does it read as though it respects the person?** Someone in this situation has usually been told no several times already.
- [ ] **The legal footer.** The disclaimer came out on 2026-07-30 and has not been replaced, so nothing currently says this is not legal advice, sends nothing to DTA, and does not change a SNAP case. All three are true and worth saying.
- [ ] **Terms of Use and Privacy Policy links.** Absent, because the URLs are unknown. Get them from the vendor.
- [ ] **Quick exit destination.** Currently weather.com. Confirm that is the right neutral site.
- [ ] **Languages.** English only. MassLegalHelp publishes the ABAWD article in Spanish.

## 12. What is already checked automatically

Do not spend manual time on these. They run on every push and fail the build.

```
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/check-pages.js
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" --test tests/snap-screening-logic.test.js tests/render-smoke.test.js
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/publish-mlh.js --check
python docassemble-snap-abawd/tests/test_snap_abawd_parity.py
python docassemble-snap-abawd/tests/test_good_cause_text.py
```

| Checked automatically | Where |
| --- | --- |
| Every exemption rule, and the full 33-row housing truth table | `tests/snap-screening-logic.test.js` |
| The JavaScript and the Python Docassemble port agreeing | `test_snap_abawd_parity.py` |
| Every composed sentence, and that guided answers never change the decision | `tests/snap-screening-logic.test.js` |
| That the letter never states a reason twice | `tests/snap-screening-logic.test.js` |
| Every screen rendering without throwing | `tests/render-smoke.test.js` |
| Answers never reaching localStorage, and Quick exit clearing them | `tests/render-smoke.test.js` |
| No parent-relative path that would 404 in production | `scripts/publish-mlh.js` |
| The copy documents matching the code | the `generated-files` CI job |
| A walk through both versions in a real browser | `tests/snap-screening.spec.js`, CI only |

The browser suite cannot run on the authoring machine, so it runs only in CI. If you are
checking a change locally, the browser paths are the ones your own testing has to cover.

## 13. Reporting what you find

Useful:

- Which version, A or B, and the URL you were on
- The answers you gave, in order
- What you expected and what happened
- The device and browser
- A screenshot, or the printed letter, if the problem is in the wording

**Anything where the tool tells someone they must meet the work rules when they might be
exempt is the most serious kind of problem here.** Say so plainly and it will go to the front.

---

_Generated by `scripts/testing-doc.js`. The exemptions, guided questions, and composed
sentences above are read from the screener itself, so this checklist cannot quietly fall
behind the tool. Re-run it after any change and the build fails if you have not._
