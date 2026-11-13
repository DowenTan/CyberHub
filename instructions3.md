# PART C: Fixes, security and engineering recommendations (Phase 1 first, then Phase 4)

Each item has: **why it matters** → **prompt**. C1 – C8 are Phase 1 and should be done before any new AI feature goes near real customers.

## C1. Find and fix "Copilot approves but nothing changes in the database"   (URGENT, run first)

**What is already known.** The backend and frontend `.env` files point at the *same* Supabase project, and the backend key is a valid secret key,
so credentials are not the cause. The remaining suspects are: the running backend or frontend is not the latest code; `copilot_setup.sql` is missing or
failed in the project; the apply call returns an error the UI does not show clearly; or the write succeeds but the pages keep showing cached/persisted store data.

```text
CONTEXT
Feature: the Copilot proposes a change, the admin presses "Approve & Apply", the backend calls the SQL function
public.copilot_apply(uuid) which should update the row and mark public.copilot_changes.status='applied'. Files: backend/copilot/engine.py,
backend/routers/ai_copilot.py, client/src/components/AdminCopilot.jsx, client/src/lib/api.js, copilot_setup.sql, check_db.sql.
Symptom: after Approve the database does not change (or the dashboard does not show the change). Note: engine.py gained a `tool_apply_latest`; read it and verify it only reports success when copilot_apply succeeded and the row is verified in the database. Do NOT touch any secret values.

GOAL
Prove exactly where the chain breaks, fix it, and add permanent diagnostics so this can never be a mystery again.

STEPS
1. Add POST /api/admin/copilot/selftest (dev/admin only). It runs and reports, step by step, {name, ok, detail, ms}:
   a) read: select one row from spare_parts_catalog; b) sql installed: call copilot_db_summary(); c) policy rows exist;
   d) propose: change markup_percentage of the lowest SKU by +1; e) apply; f) VERIFY by re-reading the row in a separate query that markup really changed;
   g) undo; h) verify it is restored; i) final status of the change row. Any exception is returned with its message (never a stack trace).
   Run it and show me the JSON.
2. Backend logging: log (structured, no secrets) every copilot RPC: function, change id, duration, success/error code. Make engine.rpc() log the PostgREST
   error code/message/details/hint and map them to precise HTTP errors.
3. Frontend: on Approve failure show the server message in the card (not only in chat). After a successful apply, re-read that exact row via the API and display
   "Verified in database: <field> = <value>" on the card; if the re-read does not match, show a red "Saved but not visible: check the data refresh" notice.
   Add a status line in the Copilot header: backend reachable / SQL installed / model online (from GET /status) and a "Run self-test" button.
4. Data refresh: confirm what the legacy pages read after Approve (the persisted zustand store, key in localStorage). Make sure `fetchSupabaseData()` (or its API replacement)
   is awaited after apply/undo and that the store replaces, not merges, rows. Remove stale persisted caches via a store version bump.
5. Check the deployed state: write scripts/doctor.py that verifies (without printing secrets): backend reachable, /status JSON, copilot_changes table present,
   the five SQL functions present (copilot_propose/apply/undo/db_summary/prepare_technician), policy rows, PostgREST schema cache contains them (if not, run `NOTIFY pgrst, 'reload schema'`).
6. Add an integration test that runs propose→apply→verify→undo against a local Postgres+PostgREST (docker compose) and fails CI if any step breaks.

HYPOTHESES TO RULE IN/OUT (report each as confirmed/rejected with evidence)
 H1 old backend process still running; H2 old AdminCopilot.jsx still bundled (stale Vite cache: run with --force); H3 copilot_setup.sql not installed in this project;
 H4 PostgREST schema cache stale after creating functions; H5 apply raising CONFLICT/constraint errors that the UI swallowed; H6 UI refresh reading cached store;
 H7 two different Supabase projects in use (compare project refs only, never keys); H8 browser blocked by CORS (check the Network tab).

DEFINITION OF DONE
Root cause named with proof; selftest returns all steps ok; the integration test is in CI; a short docs/copilot-troubleshooting.md lists the checks above.
```

## C2. Remove the secret key from the browser and put all data access behind the API   (CRITICAL)

**Why.** Anything prefixed `VITE_` is bundled into the public JavaScript. A service/secret key in the browser gives every visitor full read/write/delete access to your whole database, bypassing all row-level security. Rotating the key alone is not enough: the code must stop needing it.

```text
CONTEXT
client/.env still defines VITE_SUPABASE_SERVICE_ROLE_KEY and client/src/lib/supabaseClient.js still lists import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY and
VITE_SUPABASE_SECRET_KEY as fallbacks. Vite replaces every referenced import.meta.env.VITE_* with the literal value at build time, so the secret is inlined into the
public bundle even though the anon key is preferred. (Supabase's gateway rejects secret keys from browsers, which limits browser misuse, but anyone who copies the key
from the bundle can still use it from a script.) client/src/store/useDashboardStore.js makes ~21 direct supabase.* calls, including writes to ai_assessments, and falls back
to /api/admin/copilot/execute-crud (removed, returns 410). Never print or copy key values anywhere (chat, logs, files, commits).

GOAL
After this task NO secret/service key exists anywhere in client/ source, env files, build output or git history, and the dashboard works through authenticated API calls only.

STEPS
1. Inventory: list every `supabase.` / `createClient` usage and every direct table access in client/src (file, line, table, operation). Produce docs/browser-db-access.md as a table. Wait for my approval of the plan.
2. For each access create a typed FastAPI endpoint (reads: GET with pagination/filters; writes: POST/PATCH using pydantic models, column allow-lists, server-side validation, branch scoping later via C3).
   Writes that the Copilot can also do must reuse the guarded copilot_* SQL path so they are logged and undoable. No generic "table + columns" endpoints.
3. Replace the store's Supabase calls with an API client (client/src/lib/api.js + TanStack Query hooks). The store keeps UI state only (filters, selection, theme). Bump the persisted-store version so old cached data is dropped.
4. Delete the service-key usage: remove VITE_SUPABASE_SERVICE_ROLE_KEY from client/.env and client/.env.example, delete the literal fallback in supabaseClient.js; if the browser still needs Supabase (for Auth in C3) it may use ONLY the URL + publishable/anon key.
5. Guardrails: add a Vite build check (scripts/check-no-secrets.mjs, run in `npm run build` and CI) that fails if dist/ or src/ contains: "sb_secret_", a JWT whose payload role is "service_role", or any env var named *SERVICE_ROLE* / *SECRET* prefixed with VITE_.
6. Key rotation runbook (document, don't execute): rotate the secret/service key in Supabase (Project Settings → API Keys), update backend/.env only, redeploy, confirm the old key returns 401. List other places that may hold copies (CI variables, old zip files, chat transcripts, screenshots).
7. If any key ever reached git history, provide exact `git filter-repo` commands and a checklist (rotate first; rewriting history does not un-leak a key).

TESTS
vitest: the app boots with no Supabase service env; API client error handling; the store no longer imports supabase-js (lint rule). Backend: every new endpoint has a test. CI step greps the built bundle for the forbidden patterns.

DEFINITION OF DONE
The grep checks pass on src/, dist/ and git history; every former direct access is an API call; the dashboard works against a project where the old key is revoked.
```

## C3. Real authentication, roles and JWT verification (Supabase Auth)

**Why.** The FastAPI backend currently trusts anyone who can reach it (and listens on all interfaces in `start-dev.js`).

```text
CONTEXT
Supabase Auth is the identity provider (auth.users → public.profiles; roles in public.user_roles with enum app_role: customer, technician, admin, super_admin,
logistics_partner, hr_manager, executive). The dashboard is for staff only. backend/core/security.py is empty.

GOAL
Login for staff, JWT verification in FastAPI, role- and branch-based authorisation on every endpoint, audit of auth events.

REQUIREMENTS
1. Frontend: /login page (email + password; optional TOTP step), supabase-js with ONLY URL + publishable key, session refresh, sign-out, idle timeout (15 min, warn at 13), a route guard that checks the role from GET /api/me.
   Staff are invite-only: disable public sign-ups in the Supabase dashboard (document) and provide an admin "Invite staff" flow (backend uses the admin API to invite; assigns a role in user_roles).
2. Backend dependency `current_user()`: read `Authorization: Bearer <access token>`, verify the signature using the project's JWKS (asymmetric signing keys) or the JWT secret as configured, check exp, iss, aud, and the `sub`;
   then load roles/branches from user_roles (cache 60 s). `require_role(*roles)` and `require_branch_access(branch_id)` dependencies. Deny by default: every router must declare a dependency (add a test that fails if a route has none, except /health and /).
3. Role matrix (document in docs/rbac.md): super_admin all; admin = read/write for assigned branches (user_roles.branch_id; NULL = all); executive read-only analytics; hr_manager technicians/certifications only; logistics_partner nothing in the dashboard.
   The Copilot inherits the caller's role: write proposals only for admin/super_admin; metrics honour branch scope.
4. MFA: require TOTP for super_admin and admin (enforce server-side by checking the `aal2` claim on write endpoints).
5. Bootstrap script scripts/create_first_super_admin.py (uses the admin API, prompts for email, never accepts a password on the command line) and instructions to remove it from the repo afterwards.
6. Security details: constant-time comparisons; clock-skew tolerance 30 s; rate-limit login attempts at the edge (Supabase has built-in limits: document the settings to check, incl. leaked-password protection and minimum password length 12);
   log every login/logout/failed auth/role change to audit_logs; return 401 vs 403 correctly; never reveal whether a user exists.
7. Dev mode: ENV=development may allow a header `X-Dev-User` ONLY when the server is bound to 127.0.0.1; this switch must be impossible to enable when ENV=production (test it).

TESTS
Valid/expired/forged/wrong-audience tokens; role matrix table-driven tests; branch scoping; aal2 enforcement; route-without-dependency detector; idle timeout in vitest with fake timers.

DEFINITION OF DONE
Every endpoint protected; docs/rbac.md and docs/auth.md written; a walkthrough shows login → protected call → forbidden call for each role.
```

## C4. Row-Level Security and Storage policies for every table and bucket

```text
CONTEXT
RLS exists on the copilot tables only. The mobile app and any browser client using the publishable key must never see other people's data, even if the backend is bypassed.
Backend uses the service role (bypasses RLS) and must keep working.

GOAL
One migration (supabase/migrations/..._rls.sql) enabling RLS on ALL public tables with explicit, tested policies, plus storage policies.

POLICY MATRIX (implement and document in docs/rls.md)
- profiles: user reads/updates own row (cannot change account_status); staff (admin/super_admin/hr_manager) read within scope.
- user_roles: read own; write only via backend (no client policy).
- addresses, appliances, appliance_documents, repair_requests, repair_media, reviews, notifications, user_devices, records: owner (customer_id/owner_id/user_id) CRUD where sensible; no deletes of requests/invoices/payments by clients.
- repair_requests / job_assignments / job_status_events / technician_live_locations: assigned technician can read their jobs and update allowed status transitions via a SECURITY DEFINER function (not direct UPDATE);
  admins by branch scope; executives read-only.
- invoices, invoice_items, payments: customer reads own; no client writes (payments only by the backend webhook).
- technician_profiles, technician_skills, certifications, technician_availability_slots: technician reads/updates own limited columns; HR/admin by scope.
- service_prices, spare_parts_catalog, global_settings, appliance_categories, branches, skills: authenticated read (non-sensitive columns only; hide supplier_cost via a view `spare_parts_public`), writes backend-only.
- audit_logs, ai_*, copilot_*: no client access.
Helper SQL functions (SECURITY DEFINER, search_path pinned, STABLE): is_staff(), has_role(app_role), branch_in_scope(uuid), is_assigned_technician(uuid).
Use the `(select auth.uid())` pattern in policies for performance; every policy has USING and, for writes, WITH CHECK. No `USING (true)` on private tables.
Prevent privilege escalation: BEFORE UPDATE triggers or column-level GRANTs so clients cannot change role, ids, status of finance rows, rating aggregates, etc.

STORAGE
Buckets private: repair-media, appliance-documents, certifications, avatars (public only if you decide so). Path convention `<user_id>/<request_id>/<random>.<ext>`;
policies match the first path segment to auth.uid() or staff scope; size and MIME limits per bucket; signed URLs generated by the backend for staff viewing.

TESTS
pgTAP (or Python+psycopg with `SET ROLE authenticated` and `request.jwt.claims`): for each table, user A cannot read/write user B's rows; technician sees only assigned jobs; executive cannot write;
anon sees nothing; service role still works. Run `supabase db lint` and the Supabase Security Advisor and attach results.

DEFINITION OF DONE
Zero tables without RLS (query included in the README), tests green in CI, advisor shows no critical findings.
```

## C5. Hashing and cryptography done right (what to hash, what NOT to)

**Plain answer to "should I hash things?"**: do **not** hash passwords yourself. Supabase Auth already stores passwords with a salted bcrypt hash and you never touch them. Hashing is useful for *other* things: random API/invite tokens, file integrity, tamper-evident audit logs, webhook signature checks, and lookups of sensitive values.

```text
CONTEXT
Passwords are handled by Supabase Auth. The seed script inserts users with a placeholder password string that is NOT a real hash; demo users cannot log in.

GOAL
Introduce hashing/cryptography only where it genuinely improves security, using standard primitives. No custom crypto, no MD5/SHA-1 for security purposes.

TASKS
1. PASSWORDS: do nothing custom. Remove the fake bcrypt-looking literal from seed scripts (leave encrypted_password NULL for demo users) and document how to create real test users with the Supabase admin API.
   Document the Supabase Auth settings to enable: minimum length 12, leaked-password protection, email confirmation, MFA.
2. TOKENS & API KEYS (integrations, device registration, invite links): generate with `secrets.token_urlsafe(32)`, show once, store only a hash.
   Table api_keys(id, name, key_prefix text (first 8 chars, for lookup), key_hash bytea, scopes text[], created_by, created_at, last_used_at, revoked_at, expires_at).
   Hash = HMAC-SHA256(server_pepper, token) with the pepper from env (random 32 bytes, never in git). Compare with hmac.compare_digest. Add create/list/revoke endpoints (super_admin only), a rotation flow, and scope checks per route.
3. HUMAN-CHOSEN SECRETS (e.g. a technician PIN, if you add one): argon2id (argon2-cffi) with per-user salt, parameters from config, rate limiting + lockout, never log.
4. WEBHOOKS: verify the gateway's HMAC-SHA256 signature over the RAW body with a timestamp tolerance (5 min), reject replays by storing event ids (payments has UNIQUE(gateway_name, gateway_event_id)); constant-time compare; fail closed; tests with valid/invalid/replayed/old signatures.
5. FILE INTEGRITY: add sha256 text columns to repair_media and appliance_documents (migration, nullable for old rows). The upload endpoint computes SHA-256 server-side while streaming, stores it, rejects exact duplicates per request, and a verify endpoint recomputes on demand. Evidence photos become tamper-evident.
6. TAMPER-EVIDENT AUDIT LOG: extend audit_logs with prev_hash bytea and row_hash bytea. A BEFORE INSERT trigger takes an advisory lock, reads the latest row_hash, and sets row_hash = sha256(prev_hash || canonical_json(actor_id, action, entity_table, entity_id, old_data, new_data, created_at)).
   REVOKE UPDATE/DELETE on audit_logs from every role except a maintenance role. Provide verify_audit_chain(from_id, to_id) (SQL function + admin endpoint) and a nightly job that verifies and alerts on a break, plus a weekly export of the latest hash to an external location (e.g. a private storage bucket) as an anchor.
7. SENSITIVE PII: prefer not to store IC numbers or bank details at all. If you must: encrypt with Supabase Vault or pgcrypto (key kept outside the table), and store an HMAC "blind index" for exact-match lookups. Document which columns are sensitive in docs/data-classification.md.
8. LOGGING: add a redaction filter so tokens, Authorization headers, emails and phone numbers never appear in logs.

TESTS
Token generate/verify/revoke/expire; timing-safe compare used; argon2 parameters; webhook matrix; sha256 on upload equals an independent computation; audit chain verifies, detects a tampered row and a deleted row; redaction filter.

DEFINITION OF DONE
Each item has code, tests and a line in docs/crypto-decisions.md explaining the algorithm and why (e.g. "HMAC-SHA256 because the token is high-entropy; argon2id only for human-chosen secrets").
```

## C6. Backend hardening (FastAPI)

```text
CONTEXT
backend/main.py, uvicorn started by client/start-dev.js with --host 0.0.0.0. No rate limits, permissive CORS regex for any localhost port, OpenAPI docs open.

GOAL
Production-grade defaults while keeping a smooth local dev experience.

TASKS
- Bind to 127.0.0.1 in dev (document how to opt in to LAN access) and behind a reverse proxy (Caddy or Nginx) with TLS in production; set `--proxy-headers` and trusted proxy IPs.
- CORS: exact allow-list from env (CORS_ORIGINS). The localhost-any-port regex only when ENV=development.
- Security headers middleware: Strict-Transport-Security, X-Content-Type-Options=nosniff, X-Frame-Options=DENY (or CSP frame-ancestors 'none'), Referrer-Policy=same-origin, Permissions-Policy minimal; provide a CSP for the SPA host (script-src 'self', connect-src API + Supabase URL).
- Rate limiting (slowapi): per IP and per user; stricter on auth, AI and upload endpoints; return 429 with Retry-After.
- Request limits: body size caps (e.g. 10 MB uploads, 1 MB JSON), timeouts, max concurrent AI jobs.
- Validation: pydantic models everywhere; `extra='forbid'`; constrained types for ids/codes; reject oversized strings; central exception handlers that return the standard error shape and never leak stack traces or SQL.
- Uploads: verify magic bytes not just extensions; allow-list MIME; re-encode images; scan with ClamAV if available; store under random names.
- Disable /docs and /openapi.json in production (or protect them with admin auth).
- Dependency hygiene: pin versions (requirements.txt with hashes via pip-compile), run pip-audit and npm audit in CI, Dependabot/Renovate.
- Docker: non-root user, read-only filesystem where possible, healthcheck, minimal base image.
- Logging: JSON, correlation id, redaction (C5), no request bodies for auth/upload routes.

TESTS
Header presence; CORS allow/deny matrix; 429 behaviour; oversize payload; magic-byte mismatch; docs hidden in production; error handler does not leak.

DEFINITION OF DONE
docs/hardening-checklist.md with each item ticked and linked to code/tests; a script `scripts/security_smoke.sh` that curls the running API and reports pass/fail.
```

## C7. Secrets and repository hygiene

```text
CONTEXT
Both archives you shared (CyberHub_Vite.7z and CyberHub_Vite_Latest.zip) contained backend/.env and client/.env with real values. Treat every key that was ever in an archive, chat or screenshot as exposed.

TASKS
1. Add/verify .gitignore for: .env, .env.*, !.env.example, node_modules/, dist/, __pycache__/, *.7z, *.zip, supabase/.temp, .venv. Show `git ls-files | grep -E "\.env|\.zip|\.7z|node_modules|dist/"` and remove any tracked match from the index (git rm --cached).
2. Create backend/.env.example and client/.env.example listing variable NAMES with comments (no values). Add a startup check in backend that fails fast with a clear message if required variables are missing (without printing values).
3. Add gitleaks as a pre-commit hook and a CI job (full-history scan weekly). Add a CODEOWNERS rule requiring review for .github/, supabase/migrations/, backend/core/security.py.
4. Environments: define separate Supabase projects for dev, staging, production; variables injected by the host (not files) in staging/production; document in docs/environments.md. Add a banner in the dashboard showing the current environment.
5. Provide a one-page "key rotation" runbook covering: Supabase secret/service key, publishable key, JWT signing keys, database password, Ollama/hosted model keys, payment gateway keys, Expo push credentials.
6. Remove committed build artefacts and duplicated stale folders (root-level pages/components/store copies that differ from client/src) after I approve the list.

DEFINITION OF DONE
Clean `gitleaks detect` result, hooks installed (`pre-commit install`), docs written, and a list of anything that still needs a human action in the Supabase/GitHub dashboards.
```

## C8. Migrations and schema safety (replace the dangerous schema.sql)

```text
CONTEXT
supabase/schema.sql and backend/schema.sql contain DROP TABLE ... CASCADE and recreate a simplified schema that does not match the live database. Running them would destroy data.
We also have loose SQL files (schema_additions.sql, copilot_setup.sql, seed_cyberhub.sql, cleanup_seed.sql, check_db.sql).

TASKS
1. `supabase init` (if needed) and `supabase link` to the DEV project; `supabase db pull` to capture the current live schema as the baseline migration (review it, remove vendor/internal noise). Do not push anything to production.
2. Quarantine the dangerous files: rename to schema.sql.DO-NOT-RUN.txt, prepend a bold warning, and add a CI check that fails if a *.sql file in supabase/migrations contains DROP TABLE / TRUNCATE without an `-- allow-destructive` marker approved in CODEOWNERS.
3. Convert schema_additions.sql, copilot_setup.sql into ordered, idempotent migrations; move seed_cyberhub.sql to supabase/seed.sql (dev only) and make sure seeds can never run in production (guard on a settings flag or a project ref allow-list).
4. Generate TypeScript types (`supabase gen types typescript`) into client/src/types/database.ts and Python models for the backend (pydantic) where useful; wire a `npm run types` script and a CI check that fails when types drift.
5. CI job: start local Supabase, apply all migrations from scratch, run `supabase db lint`, run the backend integration tests. Add a "migration review" checklist to the PR template (locks, backfills, rollback).
6. Backups: document enabling Point-in-Time Recovery on the production project, a monthly restore drill into a scratch project, and the exact restore commands.

DEFINITION OF DONE
Fresh clone → `supabase start` → app works with seed data; no DROP-capable file can be run by accident; types generated; CI green; restore drill documented.
```

## C9. Finish the move off legacy pages; one data layer; remove duplicates

```text
CONTEXT
DashboardApp.jsx routes every page except Settings to a Legacy* wrapper (static HTML + JS from "CyberHub JS/"). React versions already exist in src/pages for most of them. The store mixes UI state and server data. Stray/duplicate files exist: client/App.jsx, and duplicated scripts in "CyberHub JS/" (smart_orders.js vs smart-orders.js, service_analytics.js vs service-analytics.js).

TASKS
1. Parity checklist: for each legacy page list every visible feature, data source and interaction (docs/legacy-parity.md). Rebuild each as React using the existing CSS classes; keep the 3-column layout and look. Verify with Playwright screenshot comparison (tolerance 0.5%).
2. Introduce TanStack Query for all server data, an OpenAPI-generated client (openapi-typescript) from the FastAPI schema, and keep zustand for UI state only. Remove executeBackendCrud and any direct Supabase calls (see C2).
3. Delete: LegacyPage.jsx and Legacy*.jsx, the "CyberHub JS" dependency, stale duplicate root-level files. Update eslint config and fix the existing lint error in ServiceAnalytics.jsx (no-useless-assignment).
4. Route-level code splitting, error boundaries per route, a global toast system, loading/empty/error states, and an offline banner.
5. Accessibility pass (labels, focus order, contrast ≥ 4.5:1, keyboard navigation for tables) with jest-axe tests.

DEFINITION OF DONE
No Legacy imports remain; `npm run build` works on a fresh clone; parity doc fully ticked; e2e screenshots attached.
```

## C10. Testing and CI

```text
GOAL
A pipeline that catches regressions in backend, frontend, database and security before merge.

TASKS
- Backend: pytest with a docker-compose test stack (Postgres 16 + pgvector + PostgREST) or the local Supabase stack; fixtures that apply migrations and load a small deterministic dataset; coverage gate 80% (95% on pricing/safety/copilot SQL paths); ruff + mypy/pyright.
- Frontend: vitest + testing-library + msw; Playwright e2e for login, Copilot propose→approve→undo, price edit, AI diagnostics review; ESLint + Prettier; coverage gate 70%.
- Database: migration apply-from-scratch test, RLS tests (C4), copilot SQL scenarios (propose/apply/undo/conflict/atomic rollback), audit-chain verification.
- Security jobs: gitleaks, pip-audit, npm audit --omit=dev, trivy (filesystem + Docker), CodeQL (Python + JS).
- GitHub Actions workflows: backend.yml, frontend.yml, e2e.yml, security.yml, ai-eval.yml (A7), with caching; required status checks and branch protection documented.
- PR template (checklist: tests, migrations reviewed, docs, screenshots, security impact) and Dependabot/Renovate config.

DEFINITION OF DONE
A red PR is blocked from merging; a green PR shows coverage and e2e artefacts; README badges.
```

## C11. Observability and an audit trail you can trust

```text
TASKS
- Audit middleware: every state-changing API call writes audit_logs (actor_id, action, entity_table, entity_id, old_data, new_data, ip_address, user_agent). Add DB triggers for sensitive tables (global_settings, spare_parts_catalog, user_roles, service_prices, invoices, payments, technician_profiles) to capture changes made outside the API.
  Link copilot_changes to audit_logs (same correlation id). Hash chain per C5.
- Structured logs with correlation ids across frontend → API → SQL (pass an x-request-id). Sentry (or OpenTelemetry) for FE and BE with PII scrubbing.
- Health endpoints: /health (liveness), /ready (DB, model, storage reachability). Uptime monitor and alert rules (error rate, p95 latency, queue depth, failed payments, AI failure rate).
- Admin UI "Activity" page: filterable audit log with diff view; export CSV; retention policy settings.

DEFINITION OF DONE
A change made via UI, via Copilot and via raw SQL each appears in the audit log with who/what/when; the chain verifies; dashboards documented.
```

## C12. Background jobs, realtime updates and reliable notifications

```text
CONTEXT
Triggers exist (enqueue_notification_push). AI jobs, offers expiry, reminders and digests need a proper worker. The UI currently polls or relies on manual refresh.

TASKS
- Pick and implement ONE job system (recommend ARQ + Redis, or Supabase cron + pgmq/Edge Functions if you want to stay serverless): job table or queue, idempotency keys, retries with backoff, dead-letter queue, visibility in an admin "Jobs" page.
- Realtime: Supabase Realtime subscriptions for repair_requests, job_assignments, ai_assessments (RLS-aware via the user's JWT; never use the service key in the browser); the dashboard updates lists without reload; reconnect/backoff handling.
- Notification delivery: outbox pattern; worker sends Expo push (batched, handles invalid tokens by deactivating user_devices rows), email (Resend/SES) and in-app notifications; user preferences and quiet hours; templates in BM/EN.
- Inspect the existing enqueue_notification_push trigger function, document what it does, and fix anything unsafe (e.g. network calls inside the transaction).

DEFINITION OF DONE
Killing the worker mid-job loses nothing; duplicate delivery prevented by idempotency; admin UI shows queue health.
```

## C13. Privacy (PDPA) and AI governance   *(have a Malaysian lawyer review the final texts)*

```text
TASKS
- Data inventory (docs/ropa.md): every table/column holding personal data, purpose, lawful basis, retention, who can access, where it flows (including any hosted model or SMS/email vendor).
- Consent: capture and store consent timestamps/versions (service, AI-assisted processing, marketing separately); withdraw flow; respect `ai_consent` and `marketing_consent`.
- Rights: endpoints and admin tools for access/export, correction and deletion/anonymisation of a customer (keep financial records as required by law, anonymise the rest); a 30-day SLA tracker.
- Retention jobs: media, transcripts, chat logs, location points, audit logs per policy; dry-run mode with a report before deleting.
- Breach runbook: detection → containment → assessment → notification templates (regulator + customers) → post-mortem. Contact placeholders for the Data Protection Officer.
- AI governance: a model card per AI feature (purpose, data, limits, known failure modes, evaluation results, human oversight), an AI decision log, disclosure text ("AI-assisted estimate, confirmed by a technician"), a red-team suite (prompt injection, jailbreaks, PII extraction) run in CI, and a rule that no automated decision affecting price, refunds or technician penalties happens without human approval.
- Vendor management: list sub-processors, DPAs, data location; prefer local models for personal data; mask PII before any external call.

DEFINITION OF DONE
Documents in docs/privacy/, endpoints with tests, retention jobs in dry-run, red-team suite passing.
```

## C14. Payments and webhooks hardening

```text
CONTEXT
Tables: invoices (status, total with a CHECK total = subtotal + tax − discount), payments (idempotency_key unique, gateway ids unique, webhook_verified), payment_status enum.

TASKS
- Amounts are always taken from the server-side invoice, never from the client. Create payment sessions server-side with an idempotency key = hash(invoice_id, attempt).
- Use a hosted checkout (FPX / e-wallets via the gateway); never touch card data (stay out of PCI scope).
- Webhook endpoint: signature verification (C5), timestamp window, replay protection, strict state machine (pending → processing → successful|failed|cancelled; successful → refunded), invoice status update in the same transaction, row locks to avoid double-processing.
- Reconciliation job (daily): compare gateway settlement reports with payments; mark mismatches; alert.
- Refunds: request → approval by a different admin (four-eyes) → gateway call → record; limits and reasons; audit.
- Rounding and tax: Decimal everywhere, SST 8% computed server-side, tests with edge cents.

TESTS
Gateway mocks for success/failure/duplicate/out-of-order events; concurrency test with two simultaneous webhooks; refund approval flow; mismatched amount rejected.
```

## C15. Performance and data quality

```text
TASKS
- Measure first: enable pg_stat_statements on the dev project, collect the top 20 queries by total time, run EXPLAIN (ANALYZE, BUFFERS) on each and propose indexes (candidates: repair_requests(branch_id,status,created_at), job_assignments(technician_id,assignment_status), invoices(status,issued_at), certifications(expires_on)). Add only indexes that show a measurable win.
- API: pagination (cursor) on every list endpoint, no SELECT * on wide tables, avoid N+1 (use embedded selects/joins), response compression, ETag/Cache-Control on read-mostly data, connection pooling via the Supabase pooler.
- Heavy analytics: materialised views refreshed on a schedule; partition audit_logs and job_status_events by month once they exceed ~5M rows (document the plan).
- Frontend: list virtualisation for tables > 200 rows, memoised selectors, image lazy loading, bundle analysis with a size budget in CI, Lighthouse CI budget (LCP < 2.5 s on a mid-range phone).
- Data quality: CHECK constraints for money/percent ranges, NOT NULL where the business requires it, a nightly "data doctor" that reports orphans, impossible status/timestamp combinations, duplicate appliances, invoices whose items do not sum to the subtotal.
- Expand the seed generator to produce 20k requests for load tests (flagged as test-only).

DEFINITION OF DONE
Before/after numbers for each change; budgets enforced in CI.
```

---


---

# Quick review prompt (save as a reusable workflow in Antigravity)

```text
Review the current git diff for: (1) secrets or keys in code, env files or logs, (2) endpoints without auth/role checks, (3) SQL built from strings,
(4) money calculated by a model or with floats, (5) fabricated default values returned to the UI when data is missing, (6) missing tests, (7) missing input validation,
(8) PII in logs or in prompts to external models, (9) migrations that are not idempotent or can drop data. For each finding give file:line, why it matters and a minimal fix.
Do not modify files.
```
