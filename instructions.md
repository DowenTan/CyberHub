

## A6. AI Diagnostics page (React)  (fast model is fine; Planning mode on)

```text
CONTEXT
Two AI Diagnostics UIs exist: the routed legacy page (LegacyAiDiagnostics.jsx → "CyberHub JS/ai-diagnostics.html") and client/src/pages/AiDiagnostics.jsx,
a React page that only SIMULATES an assessment (hard-coded fault text, Math.random confidence) and, through useDashboardStore.addDiagnosticLog, inserts
ai_assessments rows directly from the browser. Replace BOTH with one real React page backed by the A3 API, delete the simulation code and the browser-side
ai_assessments insert/update/delete calls from the store, and route /ai-diagnostics to the new page. Keep the current visual language: dark navy cards (`ch-card`), orange accent
#ff7300, green #2ed573, red #ff4757, `.mono` for codes, the existing 3-column app shell and sidebar. Open
"CyberHub JS/ai-diagnostics.html" and the legacy CSS ONLY as a visual reference; do not import them.
Data access: via client/src/lib/api.js to FastAPI. NO direct Supabase calls from the browser for this page.
If TanStack Query is not installed, tell me in the plan and propose adding it (I must approve new dependencies).

GOAL
client/src/pages/AiDiagnostics.jsx + client/src/components/diagnostics/* + client/src/hooks/useAssessments.js and route wiring in DashboardApp.jsx.

LAYOUT (desktop ≥ 1200px: three columns; tablet: list + detail; mobile: stacked with back button)
1. QUEUE (left): filter bar (status chips: all / needs review / low confidence / completed / failed; category select with the 3 groups;
   confidence slider; urgency; date range; search by booking number). Rows show: booking number (mono), appliance "Brand Model", category
   icon, top cause (truncate), confidence meter (colour bands: <0.55 red, 0.55-0.8 orange, >0.8 green), safety badge, estimate range, age ("12 min ago").
   Infinite scroll via cursor pagination. Auto-refresh every 15 s while the tab is visible (pause when hidden).
2. DETAIL (centre): header with booking, customer first name, address city, SLA timer; media gallery (images lightbox with zoom, video player,
   audio player + transcript with language tag); "AI findings": summary, probable causes as ranked bars with likelihood %, evidence bullets,
   suggested diagnostic steps (checklist the technician can print), recommended parts table (sku, name, retail price from catalog, stock flag if available),
   estimate card (inspection / labour / parts / transport / SST / total range) with the disclaimer, customer questions (copy-to-clipboard + "send to customer"
   button wired later), safety banner (red, non-dismissible while a critical flag is unreviewed), model/prompt version + latency (collapsed "Run details").
3. ACTIONS (right): Approve, Edit (inline: change cause order, parts, hours → live deterministic re-price from the API; show diff against AI version),
   Reject (reason required), Re-run (reason; shows attempt history), Create quote (disabled until approved; shows resulting draft invoice number),
   Assign technician (link to dispatch; leave a clear integration point for B1), "Was this correct?" feedback (3 options + optional actual cause), audit trail timeline.

STATES & UX
Skeleton loaders; empty state with illustration text; failed state shows failure_reason + Re-run; optimistic UI for review actions with rollback on error;
toasts for success/error; confirm dialog for Reject and Create quote; keyboard shortcuts (j/k navigate, a approve, r reject, e edit, ? help);
focus management and ARIA roles (listbox for the queue, tablist for sections); colour is never the only signal (icons + text for severity);
prefers-reduced-motion respected. All times shown in Asia/Kuala_Lumpur. Money formatted "RM 1,234.50".

SECURITY (frontend)
No secrets or keys in the bundle. Render all AI text as plain text (never dangerouslySetInnerHTML). Validate API responses with zod and show a
generic error if the shape is wrong. Signed media URLs are never persisted to localStorage.

TESTS (vitest + @testing-library/react + msw)
queue filtering and pagination; selecting a row loads detail; critical safety banner blocks quote creation until acknowledged;
approve → optimistic update + rollback on 500; edit re-price shows diff; keyboard shortcuts; zod rejects malformed payload; a11y checks with jest-axe.
Add one Playwright e2e (happy path with the mock provider backend).

DEFINITION OF DONE
Page replaces the legacy route; `npm run lint && npm run test` pass; screenshots of desktop/tablet/mobile attached to the walkthrough artefact.
```

---

## A7. Feedback loop, evaluation harness and calibration  (Planning mode, architecture-level model)

```text
CONTEXT
The A1 tables exist (ai_assessment_feedback, ai_case_embeddings, v_ai_assessment_accuracy). We now need to measure quality and improve it
safely. Real ground truth arrives from: admin review verdicts, and the technician's actual work (invoice_items of type spare_part on the
completed repair_request, plus job notes).

GOAL
1. Automatic ground truth capture: a backend job `capture_outcomes()` (runs hourly) that, for repair_requests that reached completed/closed and
   have an assessment, writes ai_assessment_feedback(source='system') comparing recommended part SKUs vs invoice_items parts actually billed
   (store precision/recall in comment as JSON) and updates/creates ai_case_embeddings (summary + outcome JSON) so future retrieval learns from real jobs.
   Skip cases with refunds/cancellations. Never copy customer personal data into summaries.
2. Offline evaluation harness: `python -m diagnostics.eval --set data/eval/golden_v1.jsonl --provider mock|ollama [--vision]`.
   Dataset line format: {"id","category","brand","model","issue_title","issue_description","transcript?","image_descriptions?","expected":
   {"top_cause_keywords":[..],"part_skus":[..],"urgency":"..","safety":[..]}}. Create a starter golden set of 60 cases covering all 9 categories from
   the existing issue/diagnosis pairs in seed_cyberhub.sql (the issue map) PLUS 10 safety cases and 10 adversarial prompt-injection cases.
   Metrics: JSON validity rate, top-1 and top-3 cause hit (keyword match), part precision/recall, urgency accuracy, safety recall (must be 100% on critical),
   injection resistance (must be 100%), price MAE vs expected, p50/p95 latency. Output a markdown report + JSON for CI.
3. CI gates: with the mock provider run the full plumbing on every PR. A nightly workflow (manual trigger) runs the real model and fails if safety recall < 100%,
   injection resistance < 100%, JSON validity < 98%, or top-3 hit drops > 5 points versus the stored baseline in data/eval/baseline.json.
4. Calibration: calibration.py starts as identity. Implement Platt scaling per appliance category, fitted ONLY when >= 200 reviewed cases exist for that category,
   stored in a table ai_calibration(category, method, params jsonb, fitted_at, n). Final confidence = calibrated LLM confidence blended with
   retrieval agreement (top similar case outcome matches cause #1) and evidence score (photo present, error code present). Weights in config.
   Provide a CLI to refit and a report with a reliability diagram (PNG) per category.
5. Drift monitoring: weekly job computes accuracy trend from v_ai_assessment_accuracy and writes a notification to admins if accuracy drops by > 10 points.

CONSTRAINTS
- Do not train or fine-tune on customer data automatically. Anything leaving the local network (hosted model APIs) must use masked PII and respect a
  per-customer `ai_consent` flag (add a nullable boolean column to profiles in a migration if missing, default true for existing rows, with a note for legal review).
- Evaluation must never write to production tables: use a transaction that rolls back, or a test schema.

TESTS
Unit tests for metric functions; golden-set loader validation; outcome capture on seeded data; calibration math (monotonic, bounded 0..1);
CI workflow file validated with `act` or a dry run.

DEFINITION OF DONE
`python -m diagnostics.eval --provider mock` produces a report; CI workflows exist (.github/workflows/ai-eval.yml); docs/diagnostics-evaluation.md explains how to add cases.
```

---

## A8. Production hardening for diagnostics: observability, privacy, cost, load

```text
CONTEXT
Diagnostics works end to end. Make it safe to run with real customers.

TASKS
1. OBSERVABILITY: structured JSON logs with a correlation id (assessment_id) through every step; log step name, duration, provider, model, token counts, outcome;
   redact PII. Expose Prometheus-style GET /metrics (admin only) with counters/histograms: assessments_total{status}, step_duration_seconds{step},
   model_latency_seconds, json_repair_total, safety_flags_total{type}, queue_depth. Add Sentry (or OpenTelemetry) hooks behind env vars, off by default.
2. RESILIENCE: circuit breaker around the model provider (open after 5 consecutive failures for 60 s; assessments queue as 'pending' with a clear admin banner),
   exponential backoff with jitter, per-step timeouts, and a kill switch env DIAG_ENABLED=false that stops new jobs and shows "AI paused" in the UI.
3. COST/LATENCY BUDGET: config for max input tokens (truncate retrieval first, then similar cases, never the safety rules), max images, max video seconds;
   log estimated cost per assessment when a hosted provider is used; daily spend cap that pauses hosted calls and falls back to local.
4. PRIVACY: add retention settings (default: derived keyframes/transcripts 12 months, raw media 24 months), a job that purges expired artefacts and logs it;
   data-subject export + delete endpoints for a customer's assessments; "AI-assisted estimate" disclosure text in every customer-visible output;
   consent flag respected (A7). Document the data flow in docs/privacy-ai.md (what leaves the network, what is stored, for how long).
5. LOAD TEST: locust script that submits 50 concurrent assessments against the mock provider and then the local model; report throughput and p95 latency,
   recommended worker count and GPU/CPU/RAM sizing for qwen-class 7B models (state your assumptions).
6. RUNBOOK: docs/runbook-diagnostics.md with failure modes (model down, stuck jobs, bad JSON spike, disk full from media), how to pause AI, how to re-run failed jobs.

TESTS
Circuit breaker state machine; kill switch; purge job removes only expired artefacts; export/delete endpoints authorisation; metrics endpoint requires admin.

DEFINITION OF DONE
Dashboards/queries listed in the runbook; load-test report committed; all tests pass.