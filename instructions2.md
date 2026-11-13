# PART B: Other AI features (each is an independent prompt; most reuse the A2 provider layer)

> Shared rule for all of Part B: reuse `backend/diagnostics/providers` (move it to `backend/ai/providers` first if you prefer, with a
> small refactor PR). Every feature keeps the pattern **AI proposes → deterministic code validates → human approves → audit log**.

## B1. Smart dispatch: recommend the best technician (explainable scoring)

```text
CONTEXT
Tables: repair_requests (branch_id, required_skill_id, urgency, scheduled_*), technician_profiles (availability_status, is_dispatchable,
average_rating, completed_jobs), technician_skills (proficiency_level, verified), certifications (verification_status, expires_on),
technician_availability_slots (exclusion constraint prevents overlaps), technician_live_locations (geography), addresses.location,
branches.location (geography, may be NULL), job_assignments (assignment_score, distance_km, response_deadline_at, assignment_status).
PostGIS is available (the geography type is already used). The Copilot's dispatch_technician tool currently picks nothing automatically: this feature should feed it.

GOAL
backend/dispatch/ with POST /api/admin/dispatch/recommend {repair_request_id, limit=5} returning ranked technicians with a score breakdown and a short
plain-language explanation, plus an optional auto-offer cascade.

SCORING (deterministic, weights in config, each term normalised 0..1)
skill_match (verified skill for required_skill_id, proficiency/5) 0.30 | proximity (ST_Distance in km; live location if < 15 min old else branch/home; decay to 0 at 40 km) 0.20 |
availability (available=1, busy=0.3, offline/on_leave=excluded; no overlapping slot at the scheduled window) 0.15 | workload (open offers/accepted jobs today; fewer is better) 0.10 |
rating (average_rating/5, shrunk toward the mean for technicians with < 10 jobs) 0.10 | cert_validity (verified, non-expired certificate for the skill; expired = 0) 0.05 |
reliability (acceptance rate in the last 60 days from job_assignments) 0.10. Hard exclusions: not dispatchable, no verified skill, overlapping slot, certificate expired for gas/electrical categories.
Urgency changes weights (emergency: proximity +0.15, rating −0.05, workload −0.10). Fairness: cap the share of jobs any technician receives in a week at 1.4× the branch average unless urgency=emergency.
The LLM is used ONLY to write the explanation sentences from the numeric breakdown (never to score or pick).

AUTO-OFFER (optional flag, default off)
Create a job_assignments row (assignment_status 'offered', assignment_score, distance_km, response_deadline_at = now()+10 min), set repair status 'offered'
through the same guarded path as the Copilot (propose→approve unless admin enabled auto mode), and a worker that expires unanswered offers (status 'expired') and offers to the next candidate.
Respect the unique index one_active_assignment_per_repair.

INTEGRATION
Add a "dispatch_recommend" tool to the Copilot (read-only) and let the Copilot propose "Dispatch T-xxx to ORD-xxx" from the top result. Add a "Recommended technicians" panel in the AI Diagnostics detail view (A6).

TESTS
Seeded-data tests proving every top result matches branch + skill; exclusion rules; weight changes for emergency; fairness cap; expired offer cascade; explanation never contradicts the numbers (assert it only contains values from the breakdown).

DEFINITION OF DONE
Endpoint + worker + tests + docs table of weights; a backtest script comparing recommended vs historically assigned technicians on seeded data.
```

## B2. Copilot v2: analytics Q&A, charts, proactive alerts (safe, no free-form SQL)

```text
CONTEXT
The Copilot (backend/copilot, AdminCopilot.jsx) already reads rows and proposes guarded edits (tools incl. add_technician, dispatch_technician, apply_latest). It cannot answer analytical questions
("revenue by category last quarter", "which branch is slowest") and does not warn proactively.

GOAL
Add a SEMANTIC LAYER: a fixed catalogue of metrics implemented as parameterised SQL functions/views; the model chooses a metric and parameters via tool calling; it never writes SQL.

REQUIREMENTS
1. Create supabase/migrations/..._copilot_metrics.sql with SQL functions (SECURITY DEFINER, service_role only) such as metric_revenue(group_by text, from, to, category),
   metric_jobs_funnel(from,to,branch), metric_sla(from,to,branch) (time from created→offered→completed), metric_technician_utilisation(from,to), metric_unpaid_invoices(age_bucket),
   metric_parts_usage(from,to), metric_ai_accuracy(from,to). Validate group_by against an allow-list inside the function. Return tables, never raw SQL.
2. backend/copilot/metrics.py: a registry {name, description, params schema, function} → exposes ONE tool `run_metric(name, params)` to the model plus `list_metrics()`.
3. Chart output: the tool result may include {"chart": {"type": "bar|line|donut", "title", "x": [...], "series": [{"name","values":[...]}]}}. AdminCopilot renders it with a small
   dependency-free SVG component (no external chart library unless approved) and a "download CSV" button.
4. Proactive alerts: a scheduler (APScheduler in the FastAPI process, or a Supabase cron) evaluates rules every 5 min and inserts admin notifications:
   orders waiting for a technician > 30 min; certification expiring in 14 days; payment failures > 3 in an hour; assessment queue depth > 20; technician offline with active job.
   Rules are rows in a new table copilot_alert_rules (name, sql_function, threshold jsonb, enabled, cooldown_minutes) so admins can toggle them; de-duplicate by cooldown.
5. Streaming responses (SSE) and a Cancel button in the UI. Conversation memory: last 8 turns only; never store chat text containing PII beyond 30 days (setting).
6. Prompt-injection defence: tool results are wrapped as data; row text from the database (issue descriptions, review comments) can never trigger a write: writes still require the
   existing human approval card.
7. RBAC: reads and metrics are filtered by the caller's role and branch scope once C3 exists (executive: all branches read-only; admin: assigned branches).

TESTS
Each metric function against seeded data with exact expected numbers; model attempts an unknown metric / invalid group_by → rejected; injection text in a review comment does not change behaviour; alert cooldown; SSE contract; chart payload schema.

DEFINITION OF DONE
10 metrics + 5 alert rules shipped, UI renders charts, tests green, docs/copilot-metrics.md lists each metric with an example question.
```

## B3. Manual & knowledge base (RAG) + technician repair assistant

```text
CONTEXT
appliance_documents stores uploaded files (document_type: receipt, warranty_card, manual, other; PDFs/images up to 10 MB). A1 created ai_manual_chunks with pgvector + tsvector.

GOAL
Ingest manuals/service bulletins, answer technician and admin questions with citations, and feed the diagnostics pipeline (A2 retrieval).

REQUIREMENTS
1. Ingestion worker: for documents of type 'manual' → text extraction (pdf text layer; OCR fallback for scans), clean, chunk by headings/sections (500-800 tokens, 80 overlap),
   store content + meta {document_id, brand, model, page, section}, embed (multilingual embedding model via the provider; dimension must equal the A1 constant), upsert idempotently by (document_id, chunk_index).
2. Hybrid retrieval: top-30 vector + top-30 tsvector, reciprocal-rank fusion, optional rerank with the LLM on the top 12 → return 5. Filters: brand, model family, language.
3. POST /api/ai/ask {question, appliance_id?, repair_request_id?, language?} → {answer, citations:[{document_title, page, snippet}], confidence}.
   The model must answer ONLY from retrieved chunks. If evidence is insufficient, return "Not found in the available manuals" with the closest titles. Never invent torque values, wiring colours or safety limits.
4. Safety content: answers involving gas, mains voltage or refrigerant handling must append a standard safety reminder and require the technician role to hold a verified relevant certification (certifications table) else show "Requires certified technician".
5. Error-code lookup: a table appliance_error_codes(brand, model_family, code, meaning, checks[], source_chunk_id) with an admin CSV import and a /api/ai/error-code endpoint that is checked BEFORE the LLM.
6. Admin UI page "Knowledge Base": upload, ingestion status (queued/processing/indexed/failed + error), re-index, delete (removes chunks), search box with citations preview.
7. Technician endpoint for the mobile app: same /ask with a lighter payload and a 10-second timeout.

TESTS
Chunker boundaries; idempotent re-ingest; retrieval returns the right chunk for 20 labelled questions; "no evidence" path; citation page numbers; certification gate; prompt-injection text inside a PDF is treated as data.

DEFINITION OF DONE
Three sample manuals ingested in the test suite (small public-domain PDFs or synthetic), retrieval hit-rate >= 85% on the labelled set, UI page working, docs/knowledge-base.md.
```

## B4. Appliance identification and document OCR (nameplate, receipt, warranty card)

```text
CONTEXT
appliances has brand, model, serial_number, purchase_date, warranty_expiry_date, retailer, purchase_price with a unique index (owner_id, lower(brand), lower(serial_number)). appliance_documents holds proof files.

GOAL
POST /api/ai/identify-appliance (multipart: 1-3 images, optional document_type) → extracted fields with per-field confidence, ready for the user to confirm before anything is saved.

REQUIREMENTS
1. Vision model prompt that returns strict JSON {brand, model, serial_number, category (one of the 9), purchase_date, retailer, purchase_price, warranty_months, raw_text, confidences{field:0..1}}.
   Combine with classic OCR (PaddleOCR or Tesseract) and take the OCR value when the model and OCR agree or when the field matches a brand-specific regex (maintain backend/ai/data/serial_patterns.yaml).
2. Normalise: brand to a canonical list (aliases such as "LG Electronics" → "LG"), dates to ISO, money to numeric(RM). Compute warranty_expiry_date = purchase_date + warranty_months when both are known.
3. Duplicate protection: check the unique index before saving; return the existing appliance instead of failing.
4. Nothing is written without confirmation: endpoint returns a draft; POST /api/ai/identify-appliance/confirm saves appliances + appliance_documents (type receipt|warranty_card|other) after the user edits fields.
5. Quality gate: blurry/too dark/too small → return "retake photo" guidance with the reason (use a variance-of-Laplacian blur score, brightness histogram, min resolution).
6. Storage: files go to the private bucket 'appliance-documents' with a random path; compute and store sha256 (see C5) to detect duplicate uploads.

TESTS
Synthetic nameplate/receipt images (generate with PIL) for 10 brands; blur rejection; alias normalisation; serial regex cases; confirm idempotency; MIME/size limits; no write on the draft endpoint.

DEFINITION OF DONE
>= 90% field accuracy on the synthetic set with the mock provider replaced by the real model in the nightly eval; docs list supported brands and how to add patterns.
```

## B5. Voice notes + multilingual intake assistant (BM / EN / 中文 / தமிழ்)

```text
CONTEXT
Customers describe faults in many languages and often by voice. repair_media supports audio. The diagnostics pipeline (A2) accepts transcripts.

GOAL
(1) Speech-to-text with language detection; (2) a conversational intake assistant that collects the minimum facts and creates a DRAFT repair request; (3) translation of customer text to English for the model while preserving the original.

REQUIREMENTS
1. Transcription service (faster-whisper, configurable model size) with language detection, 30-second chunking, and a confidence per segment; low-confidence segments are flagged "please confirm".
2. Translation: provider.translate(text, source, target='en') used only for the model input; store both original and English in ai_assessment_inputs (kind 'transcript') with the language tag. Show the original first in every UI.
3. Intake assistant API: POST /api/ai/intake/message {session_id, text|audio, language} → {reply, collected, missing, ready:boolean}. Required slots: appliance category/type, brand, symptom, error code (optional), since when,
   address/branch, preferred time. Ask at most 4 clarifying questions in total, one at a time, in the user's language. Offer buttons for common answers. When ready, call the existing repair-request creation path (server-side validation; never trust the model for ids).
4. Safety: if the symptom matches safety.py patterns, tell the customer to unplug/turn off the gas immediately and mark urgency emergency before anything else.
5. Abuse and privacy: per-session rate limits, max audio length 60 s, audio deleted after transcription unless the customer consents to keep it with the request; mask phone/IC numbers in logs.
6. Channels: web widget first; leave an adapter interface for WhatsApp Business API (do not implement without approval).

TESTS
Slot-filling state machine with scripted dialogues in 4 languages; max-questions rule; emergency shortcut; audio too long; translation round trip keeps error codes and model numbers; no write until ready.

DEFINITION OF DONE
Demo script `python -m ai.intake.demo` runs a full BM conversation with the mock provider; tests green; docs/intake.md.
```

## B6. Customer communication: sentiment, triage and drafted replies

```text
CONTEXT
Tables: customer_interactions (channel, direction, subject, body, customer_visible, follow_up_at), reviews (rating, comment, is_visible), warranty_claims.

GOAL
Classify and prioritise incoming messages/reviews, and draft replies for a human to approve.

REQUIREMENTS
1. New table ai_message_insights(id, source_table text, source_id uuid, sentiment text, emotion text, topics text[], urgency text, language text, is_spam boolean, suggested_action text, model_version text, created_at)
   (migration + RLS service-role only). A worker classifies new rows with strict JSON output; categories: sentiment(positive/neutral/negative), topics (delay, price, technician behaviour, repair quality, billing, warranty, other), urgency (low/normal/high), spam.
2. Triage queue in the dashboard: negative + high urgency first; one-click "assign follow-up" sets customer_interactions.follow_up_at.
3. Draft reply generator: POST /api/ai/reply-draft {interaction_id, tone: friendly|formal, language: auto|en|ms|zh|ta} → draft text. Inputs: the message, order status/timeline, policy snippets (RAG over a policy document set), the customer's first name only.
   The draft may NOT promise refunds, discounts, dates or outcomes unless they exist in the supplied data; add a visible "AI draft: review before sending" label. Sending is always a human click.
4. Review analytics: topic trends by branch/technician with sample size and confidence intervals; never rank technicians on fewer than 5 reviews.
5. Safety: detect legal threats, harassment, self-harm or safety hazards in messages and escalate to a human with a red flag; never auto-reply to those.

TESTS
Classifier on a labelled set of 100 bilingual messages (store as fixtures); refusal to promise refunds; language matching; spam; minimum sample guard; escalation rules.

DEFINITION OF DONE
Worker + queue UI + draft endpoint + tests; docs describe the policy documents the generator may cite.
```

## B7. Demand forecasting and parts / pricing recommendations

```text
CONTEXT
History lives in repair_requests (created_at, status, branch_id, appliance category via appliances), invoices (total_amount), spare_parts_catalog (supplier_cost, markup_percentage), invoice_items.

GOAL
Forecast demand by category and branch, recommend staffing and parts stock, and suggest markup adjustments, all as suggestions routed through the Copilot propose→approve flow.

REQUIREMENTS
1. Dataset builder: weekly counts per (branch, category) with calendar features (Malaysian public holidays incl. Chinese New Year, Hari Raya, Deepavali; school holidays; monsoon months; heat waves) from a maintained CSV in data/calendar_my.csv.
2. Models: start with statsforecast (ETS/AutoARIMA) as baseline and LightGBM with calendar features; pick per series by backtest (rolling origin, 8 folds), report MAPE and prediction intervals. Minimum 52 weeks of history else fall back to seasonal-naive with a warning.
3. Outputs stored in forecast_runs and forecast_points tables (migration, service-role only). Endpoint GET /api/admin/forecast?horizon_weeks=8&branch=&category=.
4. Parts: reorder suggestions require an inventory table. Create spare_parts_inventory(sku fk, branch_id fk, on_hand int, reorder_point int, lead_time_days int, updated_at) with a migration and admin UI stub; compute suggested reorder quantity = forecast demand × lead time + safety stock (z for 95% service level).
5. Pricing: suggest markup changes only with guardrails: max ±10 percentage points per change, floor margin (config), never below supplier cost, and show the evidence (demand trend, competitor input if an admin supplies it). Suggestions become Copilot proposals ("Update PRT-045 markup to 58%") that a human approves.
6. Service Analytics UI: forecast line with confidence band, "next 4 weeks staffing need" per branch, parts at risk of stock-out.

TESTS
Deterministic synthetic series with known seasonality; backtest harness; guardrails on markup suggestions; calendar feature correctness; stock-out maths.

DEFINITION OF DONE
Forecast job + endpoint + UI cards + docs/forecasting.md with metrics; suggestions flow verified with the Copilot undo path.
```

## B8. Fraud, anomaly and billing-quality detection

```text
CONTEXT
Signals available: invoices vs ai_assessments estimates, payments (status, gateway ids, idempotency keys), refunds, technician_live_locations vs service addresses, job_status_events timings, reviews, audit_logs.

GOAL
Flag suspicious activity for human investigation. Detection only: no automatic punishment.

REQUIREMENTS
1. Rule engine (transparent, configurable) with severity and a short explanation per hit: invoice total > estimate_max × 1.4; part billed that was not suggested and is expensive; completion time implausibly short (< 10th percentile for that category);
   technician GPS > 500 m from the service address when marking 'arrived'; duplicate payment attempts; refund ratio per technician; many reviews from one device/IP pattern; sudden spike in cancellations; price edits right before completion.
2. Statistical layer: robust z-scores / IsolationForest per category on (total, labour hours, parts count); require min 200 samples per category before enabling; show the top contributing features.
3. Table fraud_cases(id, entity_table, entity_id, rule, severity, score, explanation jsonb, status open|reviewing|dismissed|confirmed, reviewer_id, notes, created_at) (migration + RLS). Dedupe identical hits within 7 days.
4. UI "Review queue" with evidence, timeline and "dismiss as false positive" feedback that tunes thresholds per rule (store dismissals; auto-raise thresholds only after 20 dismissals and with admin approval).
5. Privacy: location data used only for these checks, retained 90 days, never shown to customers; document the lawful basis in docs/privacy-ai.md.

TESTS
Each rule with positive/negative fixtures; no alert on normal seeded data (false-positive rate < 2%); dedupe; role access (admin/executive only).

DEFINITION OF DONE
Rules + queue + docs listing every rule with rationale; backtest report on seeded data.
```

## B9. Job completion QA and automatic job reports

```text
CONTEXT
Technicians upload completion evidence (repair_media purpose 'completion_evidence') and notes. invoices/invoice_items must reflect what was actually done.

GOAL
Turn photos + notes (typed or voice) into a structured job report, check quality, and prefill the invoice, with the technician and admin confirming.

REQUIREMENTS
1. POST /api/ai/job-report {repair_request_id} → JSON {work_done[], parts_used[{sku?, description, qty}], tests_performed[], result: fixed|partially_fixed|not_fixed, follow_up_needed, customer_summary (<= 80 words, friendly, BM/EN by customer language)}.
2. QA checks with the vision model on completion photos (each returns pass/fail + reason): appliance visible with serial/model plate; replaced part visible or old part shown; work area tidy; no visible damage. Missing evidence → "request more photos" list.
3. Parts matching: map described parts to spare_parts_catalog by embedding similarity; below threshold → leave as free-text line for the admin to resolve. Quantity/price come from the catalog, never from the model.
4. Draft invoice_items from the report (labour hours from job_status_events arrived→completed, rounded to 0.5 h, within bounds), shown as a diff against the AI estimate (A5). Technician confirms; admin approves.
5. Customer message: the summary is offered as a draft notification; sent only after approval. Include a one-tap "report a problem" link.
6. Store results in a new table job_reports (migration) and link to ai_assessment_feedback(source='technician') so A7 learns from real outcomes.

TESTS
Report JSON validity on fixtures; QA pass/fail on synthetic images; catalog matching thresholds; hours rounding; no invoice write without confirmation.

DEFINITION OF DONE
Endpoint + tests + a technician-facing JSON contract doc for the mobile team.
```

## B10. Warranty claim assistant

```text
CONTEXT
warranty_claims(warranty_type manufacturer|repair_service|extended, status submitted|under_review|more_information_required|approved|rejected|resolved|cancelled, original_repair_request_id, followup_repair_request_id, warranty_document_id),
appliances(warranty_expiry_date), appliance_documents, repair history. A trigger validates warranty links.

GOAL
Give reviewers an evidence-based recommendation and a draft customer message; humans decide.

REQUIREMENTS
1. Eligibility engine (deterministic): warranty window (appliance.warranty_expiry_date or repair-service warranty days after completed_at, configurable per category), same-fault repeat within N days (compare diagnoses/parts), proof of purchase present, exclusions list (misuse, water damage, unauthorised repair) from a policy table.
2. LLM assist (RAG over policy docs from B3): summarise the evidence, cite the policy clause, propose approve / reject / need-more-info with reasons and the exact missing documents. Output strict JSON; the engine's verdict is authoritative: if the LLM disagrees, show both and flag for senior review.
3. Draft customer messages (resolution_public) in the customer's language, no promises beyond the policy.
4. On approve: create the follow-up repair request (zero-cost lines) through the existing creation path and link followup_repair_request_id; undoable via the Copilot change log.
5. Abuse detection feeds B8 (repeat claimants, serial reuse across owners).

TESTS
Eligibility matrix (≥ 30 cases); LLM disagreement path; clause citation present; follow-up creation + undo; permissions.

DEFINITION OF DONE
Reviewer panel in the dashboard, tests, docs/warranty-policy-mapping.md linking each rule to a policy clause.
```

## B11. Predictive maintenance and retention nudges (consent-based)

```text
CONTEXT
appliances (purchase_date, category, brand, model), repair history, reviews. Goal: help customers before things fail and bring them back, without spam.

GOAL
Estimate failure/service-due risk per appliance and generate respectful reminders.

REQUIREMENTS
1. Risk model: survival analysis (Kaplan-Meier / Cox via lifelines) per category/brand on appliance age and repair events; fall back to simple age-band rates until >= 300 appliances per category. Output risk_next_90_days and top reason.
2. Reminder rules: air-con service every 6 months, filter replacement cycles, warranty expiring in 30 days, "repeat repair twice in 12 months" → offer replacement advice. Table customer_nudges(id, customer_id, appliance_id, kind, scheduled_for, status, channel, created_at) (migration).
3. Consent: add marketing_consent to profiles (default false); nothing is scheduled without it, every message has an unsubscribe link, cap 1 nudge per customer per 30 days, quiet hours 21:00-08:00 Asia/Kuala_Lumpur.
4. Message drafting with the LLM (BM/EN), human-approved templates only; no medical/financial claims; no urgency pressure.
5. Dashboard widget: upcoming nudges, conversion (nudge → booking), opt-out rate; auto-pause a rule if opt-outs exceed 3%.

TESTS
Risk monotonicity; consent gating; frequency caps; quiet hours; unsubscribe flow; template rendering.

DEFINITION OF DONE
Scheduler + widget + docs/retention.md including the legal review note (PDPA marketing consent).