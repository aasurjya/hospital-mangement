# AI Clinical Assistant Architecture

## Purpose
Define a safe, research-informed AI strategy for this hospital management platform before implementation begins.

## Research-Informed Conclusions
- AI for hospitals should be designed as clinician-assistive decision support, not autonomous diagnosis.
- Symptom-checker style systems show inconsistent diagnostic and triage accuracy, so they should not be treated as final decision-makers.
- High-risk clinical AI requires strong governance, transparency, auditability, human oversight, and staged validation before broad rollout.
- Workflow integration matters as much as model quality. If the output is slow, hard to interpret, or poorly timed, clinicians will not trust or use it.
- Interoperability should be planned early so future integration with EHR standards is not blocked by the initial architecture.

## Product Position
This project should include an **AI Clinical Assistant** for doctors and authorized staff.

The assistant is:
- a reasoning aid
- a summarization aid
- a documentation aid
- a safety reminder system

The assistant is **not**:
- a replacement for a doctor
- an autonomous diagnosis engine
- an autonomous prescribing engine
- an autonomous emergency triage engine
- a patient-facing self-diagnosis bot in v1

## Recommended V1 AI Use Cases

### Doctor-Facing Only
- Symptom summarization from structured intake and free text
- Red-flag detection from symptoms, vitals, allergies, and history
- Suggested follow-up questions for the doctor to ask
- Ranked differential-diagnosis brainstorming with evidence-backed rationale
- Suggested next tests or labs to consider
- Medication and allergy contradiction reminders
- Progress note and consultation note drafting
- Referral summary or handoff summary drafting
- Lab-result contextual summary for clinicians

### Hospital Operations Support
- Discharge-summary drafting for clinician review
- Insurance/billing note summarization for staff review
- Shift-handover summarization
- Internal document summarization

## Explicit V1 Non-Goals
- No autonomous diagnosis sent directly to patients
- No autonomous treatment recommendation without clinician review
- No autonomous prescription generation
- No autonomous discharge decision
- No autonomous emergency or ICU escalation decision
- No unsupervised patient symptom checker for public use
- No model training on production patient data by default

## Core Safety Rules

### Human-in-the-Loop
- The clinician remains the final decision-maker.
- Every AI output must be reviewable, rejectable, and editable.
- AI must never silently change the clinical record without human approval.

### Structured Input First
- Prefer structured symptom forms, vitals, allergies, current medications, comorbidities, age, sex, pregnancy status, and known diagnoses.
- Free text may enrich the context but should not be the sole input for safety-critical recommendations.

### Evidence and Uncertainty
- The system should display why the suggestion was produced.
- The system should show uncertainty, missing data, and assumptions.
- Differentials should include confidence bands or confidence labels, not false certainty.

### Deterministic Safety Layer
- Emergency red flags should be checked by rules before or alongside any LLM call.
- Hard-coded safety rules should cover scenarios such as chest pain, stroke symptoms, severe bleeding, altered consciousness, anaphylaxis risk, sepsis indicators, suicidal ideation, obstetric emergencies, and severe pediatric red flags.

### Audit and Traceability
Every AI-assisted action should record:
- user id
- hospital id
- patient/encounter reference
- timestamp
- model name and version
- prompt version
- retrieval sources used
- structured input snapshot
- output snapshot
- whether the clinician accepted, edited, or rejected the suggestion

### Security and Privacy
- AI requests must run server-side only.
- Minimum necessary data should be sent to the model.
- Secrets, prompts, and provider credentials must never be exposed in the browser.
- Sensitive patient content should not be logged in plaintext application logs.

### Reliability and Fallbacks
- If the model is unavailable, the UI should fail safely.
- Core workflows must remain usable without AI.
- Deterministic alerts and standard workflows should still function even when AI is disabled.

## Recommended System Architecture

## High-Level Components
- `app/(doctor)/assistant/`
  - doctor-facing AI views
- `app/api/ai/`
  - server endpoints for AI actions
- `lib/ai/orchestrator/`
  - provider abstraction and request routing
- `lib/ai/prompts/`
  - prompt templates and versioning
- `lib/ai/schemas/`
  - structured output schemas
- `lib/ai/retrieval/`
  - guideline and protocol retrieval
- `lib/ai/rules/`
  - deterministic clinical safety rules
- `lib/ai/guardrails/`
  - validation, sanitization, safety filtering
- `lib/audit/`
  - AI interaction audit logging
- `evals/clinical/`
  - offline and regression evaluation datasets

## AI Request Pipeline
1. Collect structured encounter input.
2. Run deterministic red-flag rules.
3. Retrieve approved clinical knowledge and hospital protocol snippets.
4. Send normalized input and retrieved context to the LLM.
5. Require structured JSON output.
6. Validate the output against schema and safety guardrails.
7. Store an audit record.
8. Present the result to the clinician with edit/reject controls.

## Recommended Output Contract
Each AI response should be structured into sections like:
- patient summary
- key symptoms
- red flags
- missing information
- follow-up questions
- possible differentials
- suggested tests
- contraindication checks
- urgency recommendation
- evidence sources used
- safety disclaimer

## Preferred Reasoning Pattern
Use a hybrid pattern:
- deterministic rules for red flags and non-negotiable safety checks
- retrieval-augmented generation for guideline-aware reasoning
- LLM output only as assistive synthesis, not final truth

## Clinical Knowledge Strategy
The model should not rely only on generic parametric memory.

It should retrieve from approved sources such as:
- hospital protocols
- curated clinical workflows
- medication safety tables
- triage protocols
- guideline summaries approved by the organization

## Evaluation Strategy Before Rollout

### Stage 1: Offline Review
- Build a de-identified evaluation set of cases.
- Include emergency, routine, ambiguous, pediatric, obstetric, and chronic-disease scenarios.
- Score output quality for safety, helpfulness, clarity, completeness, and hallucination risk.

### Stage 2: Clinician Review
- Have doctors review outputs blind or semi-blind.
- Measure accept/edit/reject rates.
- Track harmful omissions, unsafe suggestions, and irrelevant recommendations.

### Stage 3: Silent Mode
- Run the assistant without exposing outputs to clinicians.
- Compare generated results to actual clinician actions.
- Identify disagreement hotspots.

### Stage 4: Limited Pilot
- Enable for a small group of doctors.
- Restrict to note drafting, summaries, and low-risk suggestion types first.
- Delay differential diagnosis assistance until red-flag and evidence layers are stable.

## UX Rules
- Every AI card must show that it is assistive, not definitive.
- Show source references and timestamps where possible.
- Highlight emergency red flags clearly.
- Provide one-click actions for `accept`, `edit`, `reject`, and `report issue`.
- Avoid long narrative outputs when structured lists are more actionable.

## Interoperability Direction
Design for future support of:
- FHIR resources such as `Patient`, `Encounter`, `Condition`, `Observation`, `AllergyIntolerance`, `MedicationRequest`, and `DiagnosticReport`
- CDS Hooks style workflow-triggered decision support later if external EHR integration is needed

## Recommended Rollout Order For AI
1. Note drafting
2. Summary generation
3. Red-flag detection
4. Follow-up question suggestions
5. Test/lab suggestions
6. Differential-diagnosis assistance
7. External interoperability integrations

## Project-Level Decision
AI should be treated as a **clinical copilot** for clinicians, not as a self-serve diagnosis product.

## Source-Informed Basis
This design is informed by:
- WHO ethics and governance guidance for AI in health
- FDA / IMDRF good machine learning practice principles
- systematic-review evidence showing variable symptom-checker accuracy
- HL7 CDS Hooks guidance for workflow-triggered clinical decision support
- current literature on LLM strengths and limitations in healthcare
