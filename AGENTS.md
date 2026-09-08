# Directory guide

This file is the single source of truth for agents entering this repository. Read this file first; after entering `apps/`, `packages/`, `tools/`, or `e2e/`, read that layer's `AGENTS.md` for module-level details. Do not copy module details back into the root file; root stays focused on cross-repository boundaries, workflow, and commands.

## Core documentation index

- Product and onboarding: `README.md`, `docs/i18n/README.zh-CN.md`, `QUICKSTART.md`.
- Contribution and environment: `CONTRIBUTING.md`, `docs/i18n/CONTRIBUTING.zh-CN.md`.
- Architecture and protocols: `docs/architecture.md`, `docs/skills-protocol.md`, `docs/agent-adapters.md`, `docs/modes.md`.
- Historical product baseline: `docs/spec.md`, `docs/roadmap.md` (both explicitly archived; do not treat their dated decisions as current behavior).
- References and current plans: `docs/references.md`, `docs/code-review-guidelines.md`, `specs/current/maintainability-roadmap.md`, `specs/current/ci.md` (CI scope confidence methodology — required before changing planner confidence, routing, or omission policy in `.github/config/scopes.json` and `.github/scripts/scopes.py`), `specs/current/chat-panel-next.md` (ChatPanel 重构:基线、任务进度规格、决策记录、踩过的坑 — 改 chat 渲染管线/工具调用展示/执行记录前必读), `specs/current/chat-panel-next-plan.md` (交付计划与纠偏节点).
- Directory-level agent guidance: `.github/AGENTS.md`, `apps/AGENTS.md`, `packages/AGENTS.md`, `tools/AGENTS.md`, `e2e/AGENTS.md`, `apps/web/src/components/chat/AGENTS.md` (chat 组件分层、`--chat-*` 样式接缝、降级形态与测试规约).
- Packaged auto-update architecture and high-confidence local harness: read `tools/pack/AGENTS.md` section "Packaged auto-update architecture and harness" before touching packaged updater code, release-channel identity, installer behavior, or updater UI.
- Packaged build cache contract: `tools/pack/CACHE.md` (determinant rules, materialization-time parameters, confidence grading — required before changing any build-cache node key).
- Prompt composition has two independent implementations behind a rollout switch: `docs/prompt-composition.md` (fork point, variant axes, host runtime contract table, worked examples — required before changing any prompt text, in `apps/daemon/src/prompts/`, `packages/contracts/src/prompts/`, or under `plugins/_official/scenarios/od-next-strategy/`). See "Prompt variants" below.

## Workspace directories

- Workspace packages come from `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `shells/*`, `tools/*`, and `e2e`.
- Top-level content directories: `skills/` (functional skills the agent invokes mid-task — utilities, briefs, packagers; see `skills/AGENTS.md`), `design-templates/` (rendering catalogue: decks, prototypes, image/video/audio templates; see `design-templates/AGENTS.md` and `specs/current/skills-and-design-templates.md`), `design-systems/` (brand `DESIGN.md` files), `craft/` (universal brand-agnostic craft rules a skill can opt into via `od.craft.requires`), `mocks/` (replay-based mock CLIs for `opencode`/`claude`/`codex`/`gemini`/`cursor-agent`/`deepseek`/`qwen`/`grok`, the ACP family `devin`/`hermes`/`kilo`/`kimi`/`kiro`/`vibe`, and the AMR `vela` CLI (login + models + ACP), built from anonymized Langfuse traces — PATH-overlay drop-in for tests and self-validation; see `mocks/README.md`).
- `apps/web` is the Next.js 16 App Router + React 18 web runtime; do not restore `apps/nextjs`.
- `apps/daemon` is the local privileged daemon and `od` bin. It owns `/api/*`, agent spawning, skills, design systems, artifacts, and static serving.
- `apps/desktop` is the Electron shell; it consumes web/daemon status through the sidecar client boundary.
- `apps/packaged` is the thin packaged Electron runtime entry; it starts packaged sidecars and owns the `od://` entry glue only.
- `apps/closure` owns the independently distributable OpenDesign Closure content. It does not own acquisition, generation state, or shell policy.
- `packages/contracts` is the pure TypeScript web/daemon app contract layer.
- `packages/sidecar-proto` owns business DTOs and action names; `packages/sidecar` owns the complete business-agnostic sidecar client boundary and protocol implementation; `packages/platform` owns generic OS process primitives.
- `packages/standalone` owns the shell-neutral exact metadata, verification, materialization, generation, and launcher contract.
- `shells/terminal` owns the official Node carrier and terminal-facing lifecycle commands. Shells consume standalone contracts and must not import Closure app source.
- `tools/dev` is the local development lifecycle control plane.
- `tools/pack` is the local packaged build/start/stop/logs control plane, packaged updater harness, installer identity/registry validation surface, and mac beta release artifact preparation surface.
- `tools/serve` is the local fixture-service control plane; first service is `tools-serve start updater` for deterministic updater metadata and artifacts.
- `tools/release` owns release metadata, storage publishing, release reports, and notification-facing data contracts; packaged artifact construction and smoke testing remain in `tools/pack`.
- `e2e` owns user-level end-to-end smoke tests and Playwright UI automation; read `e2e/AGENTS.md` before editing its tests or commands.

## Inactive or placeholder directories

- `apps/nextjs`, `packages/shared`, and `apps/landing-page` have been removed; do not recreate or reference them.
- Local runtime data, `.tmp/`, Playwright reports, and agent scratch directories must stay out of git.

# Validation and CI

## Root command boundary

Keep root scripts reserved for true repo-level checks and tools control-plane entrypoints:

```bash
pnpm guard                          # repo policy checks (style-policy, product-neutrality, cross-app-imports, etc)
pnpm typecheck                      # all workspace typecheck + scripts/tsconfig
pnpm tools-dev                      # local dev lifecycle (start/stop/run/status/logs/inspect/check)
pnpm tools-pack                     # packaged build/install/cleanup
pnpm tools-serve                    # local fixture services
```

**No root `pnpm build` or `pnpm test` aliases.** Build/test must stay package-scoped (`pnpm --filter <package> ...`) or tool-scoped.

**No root e2e aliases.** E2e package commands live in `e2e/AGENTS.md`.

**No root dev aliases** (`pnpm dev`, `pnpm dev:all`, `pnpm daemon`, etc). All local lifecycle goes through `pnpm tools-dev`.

## CI scope detection

`scripts/scopes.ts` is the CI scope detection engine. It reads changed files and determines which validation lanes to run (daemon tests, web tests, tools-dev tests, tools-pack tests, nix, docker, UI P0, visual, etc). See `scripts/scopes.ts` `applyChangedFile()` for the exact file-to-scope mapping. CI runs triggered via `.github/workflows/ci.yml` with a two-layer architecture (business + atomic capability workflows) — see `.github/AGENTS.md` before editing.

# Development workflow

## Environment baseline

- Runtime target is Node `~24` and `pnpm@10.33.2` (pinned in `package.json`); use Corepack so the pinned version is selected.
- Version is `0.11.1` (check `package.json`).
- New project-owned entrypoints, modules, scripts, tests, reporters, and configs should default to TypeScript.
- Residual JavaScript is limited to generated output, vendored dependencies, explicitly documented compatibility build artifacts, and the allowlist in `scripts/guard.ts`.

## Windows native

- macOS, Linux, and WSL2 are the primary supported paths. Windows native is best-effort.
- Historical Windows-specific friction documented in closed issues #10, #96, #100, #203, #315.
- Install Node 24 via `winget install OpenJS.NodeJS.LTS` or https://nodejs.org. Do not use Node 22.
- `corepack enable` fails with EPERM on Windows. Use `npm install -g pnpm@10.33.2`.
- `better-sqlite3` has no prebuilt binary for win32/Node 24; `pnpm install` compiles from source via node-gyp (~2 min). Requires Visual Studio Build Tools 2022+.

## Local lifecycle

- Use `pnpm tools-dev` as the ONLY local development lifecycle entry point.
- Ports: `--daemon-port` and `--web-port`. Internal env vars: `OD_PORT` and `OD_WEB_PORT`. Do not use `NEXT_PORT`.

## Daemon data directory contract

This section is the only repository-wide source of truth for daemon-managed data paths. Every README, guide, deployment note, and operational handoff that mentions daemon data paths must point here instead of restating the rules.

This boundary is strict. Do not introduce concrete filesystem examples for the daemon data directory, recommended data directory, shared data directory, deployment mount, or example data directory. If existing code exposes a legacy fallback, treat it as implementation detail or a known escape candidate, not as a documentation pattern to copy. If a change needs a data-path rule that is not covered here, request a core-maintainer decision in the PR instead of inventing a new convention.

The daemon has one active data-root truth source:

- On daemon startup, `apps/daemon/src/server.ts` resolves `OD_DATA_DIR` into `RUNTIME_DATA_DIR`.
- All daemon-owned data paths must derive from `RUNTIME_DATA_DIR` or from a constant derived from it, such as `PROJECTS_DIR` or `ARTIFACTS_DIR`.
- `PROJECTS_DIR` is the managed-project root. Imported-folder projects are the explicit exception: they use `metadata.baseDir` for the user-selected external workspace.
- `ARTIFACTS_DIR`, SQLite, app config, memory, MCP config/tokens, automation state, plugin state, connector credentials, generated files, logs owned by sandbox mode, and agent runtime homes are daemon data and must remain under the resolved daemon data root unless this file names a specific exception.
- Agent subprocesses receive the resolved daemon data root as `OD_DATA_DIR`. They must inherit the daemon's truth source instead of guessing their own data path.

Development propagation:
- `tools-dev` consumes sidecar launch/discovery/lifecycle atomics and owns only developer orchestration policy.
- `tools-dev --namespace <name>` does not, by itself, define daemon data isolation.
- A development run that needs an isolated daemon data root must pass `OD_DATA_DIR` into the daemon process environment.

Packaged propagation:
- `tools-pack` / `apps/packaged` own packaged channel and namespace layout.
- Packaged code resolves the final namespace-scoped daemon data root before spawning the daemon.
- The packaged daemon receives that final data root as `OD_DATA_DIR`; daemon code must not infer packaged data paths from app names, Electron `userData`, ports, channel names, or namespace names.

Sanctioned exceptions:
- `OD_MEDIA_CONFIG_DIR` — narrow override for `media-config.json` only.
- `OD_LEGACY_DATA_DIR` — migration source for legacy data import only.
- External tool homes such as `CODEX_HOME` are integration inputs, not daemon data roots.
  data roots. The daemon must not describe them as OpenDesign runtime data.
- Agent/project-cwd skill staging aliases are not daemon data roots.
- Manifest metadata keys and CSS identifiers are semantic namespaces, not filesystem path conventions.

Known escape candidates that must not be reused:
- Module-level defaults that point at a cwd-relative legacy data directory.
- Helper defaults such as `defaultRegistryRoots()` that recompute a data root from `process.env.OD_DATA_DIR` or a cwd fallback instead of receiving `RUNTIME_DATA_DIR`.
- `openDatabase(projectRoot)` calls that rely on its fallback instead of passing the resolved data root.
- Script help text or examples that suggest concrete legacy data directories.

Do not extend these escape patterns. When a fix is obvious, route the path through `RUNTIME_DATA_DIR` or an explicit data-root argument. When it is not obvious, block the PR and request core-maintainer guidance.

## GitHub automation boundary

Read `.github/AGENTS.md` before editing `.github/workflows/`, `.github/scripts/`, `.github/actions/`, PR follow-on automation, `workflow_run` trusted writes, CI handoff artifacts, or the workflow topology checks that guard those surfaces.

CI-related GitHub automation uses a two-layer architecture:
- **Business layer** — `ci.yml` is the main low-privilege PR/merge-queue/manual validation workflow. It detects scope, runs checks, and produces typed handoff artifacts.
- **Atomic capability layer** — `comment.atom.yml`, `autofix.atom.yml`, `report.atom.yml` perform reusable trusted operations from well-defined handoff inputs.

Do not add new business-named follow-on workflows without first trying to express the flow as a `ci.yml` producer plus these existing capabilities. Handoff naming, paths, and validation are centralized in `.github/scripts/handoff.py`.

## CI test-set orchestration guidance

Use the following as a recommended convergence model, not a repository-wide
conformance gate. Existing workflows and coarse test lanes may remain while
their boundaries are understood. Do not block an unrelated change or require it
to repay adjacent orchestration debt solely because it touches an existing
lane. Apply these recommendations incrementally when the local scope and
measured scheduling benefit justify the migration.

Prefer one selection direction: changed paths → source units → test sets →
execution workloads. Because the `plan` job runs before and governs downstream
jobs, new omission policy should live in the planner rather than rely on a
downstream guard to justify it after scheduling has already occurred.

When a CI area is being reorganized, prefer three named responsibilities:

- **Source units** name stable ownership or behavior boundaries in production,
  test, fixture, and control-plane paths. Prefer composing repeated selectors
  under a named unit instead of copying prefixes into unrelated rules.
- **Test sets** name independently useful semantic validation groups. Their
  membership and execution contract should converge on one authoritative
  declaration instead of accumulating more matrix or file-list copies across
  planner configuration, workflow YAML, and framework-local registries.
- **Routes** map source units to the test sets required to validate them. Routes
  should express impact rather than runner mechanics; runner image, setup,
  sharding, and job packing can remain execution concerns derived after
  selection.

Good split candidates have a stable boundary, change work that can actually be
omitted, and carry enough runtime cost or diagnostic value to justify another
scheduling identity. Directory size, file count, or the ability to write a
narrower glob is weak evidence on its own. Prefer a small number of composable
semantic units over per-file mappings, exception lists, or negative-rule
forests. Treat existing duplicated or implicit declarations as migration
surfaces without requiring every nearby change to remove them.

Before promoting a new route from observation to active omission, retain
conservative behavior such as:

- unknown, mixed, unresolved, invalid, or below-threshold input selects the
  conservative full plan;
- editing a test, fixture, or suite manifest selects the test set that consumes
  it; shared harness, contract, setup, or lockfile changes fan out to every
  affected set;
- making a selected test-set identifier that the executor cannot run fail
  visibly instead of being ignored;
- direct planner tests cover representative in-bound, out-of-bound, mixed, and
  fallback inputs without reimplementing the evaluator in another language.

Keep scope routing and reusable-result convergence conceptually orthogonal:
scope answers which test sets are necessary for a change, while convergence
answers whether an identically declared workload already has a validated,
reusable successful result. New designs should not use result availability to
weaken source-to-test coverage or copy route policy into
`.github/config/convergence.json`. Prefer productless reusable workloads; when a
workload owns products, declare the complete typed reuse manifest with it.

For work whose purpose is CI orchestration, start by inventorying the current
chain from changed path to match, effect, workload, job command, and concrete
test cases. Prefer naming or removing implicit joins before making them finer.
Changes under `.github/` must also follow `.github/AGENTS.md` and the current
confidence methodology in `specs/current/ci.md`.

## Release channel model

- `beta` is the daily R&D/development validation channel. It is optimized for fast development feedback and is not part of the stable promotion gate.
- `prerelease` is the internal validation channel for stable delivery. Stable releases remain gated by validated prerelease artifacts.
- Prerelease builds macOS x64 (Intel) on every run. `release-prerelease.yml` takes an `enable_mac_x64` input that defaults to `true`, and `notify-release-feishu.yml` (the push-to-`release/**` entry point) forwards `true` on push. The switch stays because Intel is the pipeline's critical path — it runs on the slower `macos-15-intel` fleet, ~33 min against ~21 min for every other platform — so a run that is explicitly not about Intel can buy that time back. Turning it off costs that build its promotion eligibility, so it is not a routine choice.
- **A prerelease built without `enable_mac_x64` cannot be promoted to stable.** Stable ships Intel and stable's gate is validated prerelease artifacts, so an Intel-less prerelease has not validated the Intel artifact stable will ship. This is enforced, not merely documented: `validateStablePrereleaseMetadata` in `tools/release/src/metadata/prepare-stable.ts` requires `platforms.macIntel` (with `enabled: true`, `arch: "x64"`, `signed: true`, and versioned dmg/zip URLs) in the promoted prerelease's metadata, so promoting an Intel-less prerelease fails the stable `metadata` job instead of silently shipping an unvalidated Intel build. `platforms.linux` is deliberately not required there.
- The `notify-release-feishu.yml` forwarding for a default-on boolean must be `${{ github.event_name != 'workflow_dispatch' || inputs.<flag> }}`, never `${{ inputs.<flag> || true }}`. `inputs` is unset on push, so the second form reads correctly there — but on a dispatch where the operator UNCHECKED the box, `false || true` is also true and the switch becomes unturnoffable. (A default-*off* boolean uses `${{ inputs.<flag> || false }}` for the mirror-image reason: a bare `${{ inputs.<flag> }}` forwards `''` to a `type: boolean` callee input.)
- `enable_smoke` and `enable_tests` also default to `true`, because neither costs the build anything any more — see "Prerelease validation runs outside the pipeline" below. `mac_sign_mode` (default `sign-only`) codesigns without the Apple notary round-trip; `notarize` is the pre-stable setting, since stable ships notarized. `win_x64_smoke_mode` still chooses how deep the Windows smoke goes, and applies only when `enable_smoke` is on.
- **Signing is not optional for a prerelease that will be promoted.** `validateStablePrereleaseMetadata` requires `platforms.mac.signed == true` and `platforms.macIntel.signed == true`, so `mac_sign_mode: no` produces a prerelease that cannot become a stable release. Notarization has no metadata field and is therefore not checked — which is exactly why it, and not signing, is what the fast default drops.
- **Automated tests do not gate prerelease delivery.** A prerelease exists so a person can install it and test it by hand; machine CI is a parallel opinion about the same commit rather than a valve on delivery, and a flaky suite must never cost the team a day's package. Do not reintroduce a test job into `build_*` or `publish`'s `needs`/`if`; if a check must genuinely block delivery, that is a channel-policy decision, not a workflow edit.
- **Prerelease validation runs outside the pipeline.** `release-prerelease.yml` holds one repository-wide concurrency group (`open-design-release-prerelease`, `cancel-in-progress: false`), so any job that outlives `publish` keeps that group held and stops the NEXT prerelease from *starting*. Making the test jobs advisory was therefore not enough — they still blocked the next build. The workflow now contains only `metadata → build_* → publish` plus two fire-and-forget dispatcher jobs, and the validation lives in three dispatched workflows with concurrency groups scoped to the origin run:
  - `release-prerelease-tests.yml` — `functional_e2e`, `e2e_vitest`, `daemon_unit_tests`, `verify`, dispatched as soon as the build commit resolves.
  - `release-prerelease-smoke.yml` — the packaged mac/Windows smoke, dispatched after `publish`. It does **not** test a local build directory: `.github/scripts/release/smoke-artifacts.ts` reads the published version metadata, downloads the DMG / setup.exe a user would get, verifies its sha256 sidecar, and writes it to the one path `tools-pack <platform> install` reads. Linux keeps its in-job smoke, because the whole Linux lane is opt-in behind `vars.ENABLE_STABLE_LINUX` and is on nobody's critical path.
  - `release-prerelease-card.yml` — the progressive Feishu card.
  All three are dispatched through `.github/scripts/release/dispatch-validation.sh`, which aims `gh workflow run` at the built branch first and the default branch second, so a release branch cut before these lanes existed still gets validated. A dispatch failure is loud and non-blocking: nothing depends on the dispatcher jobs.
- **One writer owns the release card.** A Feishu `PATCH` replaces the entire card, so build jobs updating "their own" row would each erase the other two's. `release-prerelease-card.yml` therefore owns the message alone and learns everything by polling the jobs API of the three runs; `tools/release/src/notifications/prerelease-card.ts` renders the card as a total function of that state (unit-tested in `tools/release/tests/prerelease-card.test.ts`) and `feishu-app.ts` is the application-bot transport. The card is deliberately withheld until the first platform publishes — a "构建中…" card posted at dispatch time becomes a permanent lie when a build dies — with total build failure as the one exception, where silence would hide an incident.
- **`version_metadata_url` is the authoritative "did a package ship?" signal, not the workflow conclusion.** The conclusion goes red for anything anywhere in the release run, including work that happens after publication, so keying a notification off it paints the card red while its own download buttons work. The progressive card takes that answer from the published metadata it verifies rather than from a job conclusion, and `tools/release/src/notifications/feishu.ts` keeps the same rule (`VERSION_METADATA_URL` outranks `BUILD_STATE`, falling back to it only for callers that do not pass a URL) for the daily beta stream.
- **The prerelease Feishu notification has exactly one source: `release-prerelease-card.yml`.** The transitional one-shot webhook card that lived in `notify-release-feishu.yml`'s `notify` job was retired once the progressive card had carried four real releases; that workflow now only builds. Do not add a second prerelease notifier — the card is a PATCH-in-place message with a single writer, and a second poster produces the duplicate the transition existed to end. `tools/release/src/notifications/feishu.ts` and the `FEISHU_RELEASE_WEBHOOK` / `FEISHU_RELEASE_SIGN_SECRET` secrets stay: `notify-daily-feishu.yml` still renders the beta download card through them, and `cut-release`, `cut-patch-release`, `backport-automerge`, `bake-plugin-previews-automerge`, `main-prerelease-win-smoke`, and `dsh-upstream-drift` all post through the same webhook.
- `preview` is an independent early-access channel with stable-like release rigor. It should use preview versions such as `X.Y.Z-preview.N`, publish to the `preview` R2 channel, publish updater feeds under `preview/latest`, and follow stable's platform policy including the existing optional Linux enablement.
- `stable` is the formal delivery channel. Do not make stable promotion depend on preview; stable continues to depend on prerelease only.
- Public packaged app identity must stay channel-distinct: stable uses `Open Design`, beta uses `Open Design Beta`, prerelease uses `Open Design Prerelease`, and preview uses `Open Design Preview`. Do not ship beta, prerelease, or preview mac DMGs whose drag-install app bundle is `Open Design.app`.
- Windows beta updater validation must use the real beta namespace `release-beta-win`; otherwise a local beta-like namespace can create a separate uninstall registry key while looking like the same `Open Design Beta` app. See `tools/pack/AGENTS.md` for the architecture map and high-confidence acceptance harness.

## Boundary constraints

- Tests under `apps/`, `packages/`, and `tools/` live in a package/app/tool-level `tests/` directory sibling to `src/`; keep `src/` source-only and do not add new `*.test.ts` or `*.test.tsx` files under `src/`. Playwright UI automation belongs to `e2e/ui/`, not app packages.
- App packages must not import another app's private `src/` or `tests/` implementation as a shared helper. In particular, `apps/web/**` must not import `apps/daemon/src/**`; web/daemon integration belongs behind HTTP APIs, `packages/contracts`, and app-local provider boundaries.
- Cross-app, cross-runtime, or repository-resource consistency checks belong in `e2e/tests/` when they need to observe more than one app/package boundary; promote reusable logic to a pure package instead of borrowing another app's private source.
- Keep shared API DTOs, SSE event unions, error shapes, task shapes, and example payloads in `packages/contracts`; update contracts before wiring divergent web/daemon request or response shapes.
- Keep `packages/contracts` pure TypeScript and free of Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, and sidecar control-plane dependencies.
- New `.js`, `.mjs`, or `.cjs` files need an explicit generated/vendor/compatibility reason and must pass `pnpm guard`.
- App business logic must not know about sidecar/control-plane concepts. Keep sidecar awareness in `apps/<app>/sidecar` or the desktop sidecar entry wrapper.
- Sidecar process stamps must have exactly five fields: `channel`, `namespace`, `source`, `mode`, and `app`. IPC is private implementation detail and is never a stamp field.
- Sidecar identity is argv-only. Do not create identity/state files derived from a stamp.
- Orchestration layers (`tools-dev`, `tools-pack`, packaged launchers) must call `@open-design/sidecar` client/atomic primitives; do not expose argv assembly, IPC paths, or process scans.
- Packaged runtime paths must be namespace-scoped and independent from daemon/web ports; ports are transient transport details only.
- Default runtime files live under `<project-root>/.tmp/<source>/<namespace>/...`; private IPC endpoints are derived by `@open-design/sidecar` from the five-field stamp and the current OS principal. POSIX endpoints use a principal-scoped, hashed directory under the OS temporary directory; callers must treat the concrete path as opaque.

## Capability exposure (UI/CLI dual-track)

Every user-facing capability must be reachable through both the web UI **and** the `od` CLI (`apps/daemon/src/cli.ts`). Shipping a feature with only one surface is a regression.

- The CLI is the embeddability contract. External agents drive Open Design through `od` subcommands.
- Both surfaces must call the same `/api/*` endpoints with shared DTOs from `packages/contracts`.
- The CLI form must support `--json` for machine-readable output and `--prompt-file <path|->`.
- Adding a new capability is a three-step closure: HTTP endpoint in `apps/daemon/src/*-routes.ts` (with a contract type in `packages/contracts/src/api/`), UI surface in `apps/web/src/`, and `od <capability>` subcommand in `apps/daemon/src/cli.ts` registered through `SUBCOMMAND_MAP`. Land all three in the same PR.
- The CLI is the embeddability contract. External agents (hermes-agent, openclaw, custom Slack/Discord bots, packaged runtimes invoked from another shell) drive OpenDesign through `od` subcommands — they do not render the web UI. If a capability is UI-only, it cannot be composed into those external agents.

## Git commit policy

- Git commits must not include `Co-authored-by` trailers or any other co-author metadata.

## Pull request expectations

- Opening a PR uses `.github/pull_request_template.md`; fill every section, not just the title.
- "Why" must answer both the author's use case and the pain being addressed.
- "What users will see" describes the change from a user's perspective.
- The Surface area checklist must reflect actual surfaces touched. If any UI surface is checked, attach screenshots.
- For bug-fix PRs, link the red-spec test that reproduces the bug per the Bug follow-up workflow below.
- `CONTRIBUTING.md` covers PR scope, title format, dependency policy, and the issue-first rule; `docs/code-review-guidelines.md` is the reviewer-facing complement.

## Code review guide

- Use `docs/code-review-guidelines.md` as the repository-wide review standard. That document is the operational guide; this `AGENTS.md` is the source of truth when the two disagree.
- Walk reviews top-down through `docs/code-review-guidelines.md`: Product relevance test → forbidden surfaces → ownership/scope → matching lane → checklist → comments → approval bar.
- Pick the matching review lane: default code/tests, contract and protocol changes, design-system additions, skill additions, or craft additions.
- Before reviewing changes under `apps/`, `packages/`, `tools/`, or `e2e/`, read that directory's `AGENTS.md` and apply its local boundaries.
- Blocking review feedback should focus on correctness, security/secrets, data integrity, repository boundary violations, contract/migration breakage, missing required validation, or high-risk maintainability issues.
- Only maintainers may close a PR instead of requesting changes, and only when the change is not salvageable on the existing branch (wrong target product, foreign test harness, DOM/API assumptions absent from this repo, or scripts that conflict with lifecycle rules).

## PR-duty tooling

The former `pnpm tools-pr` workflow has moved to `PerishCode/duty`. Do not recreate `tools/pr`, `@open-design/tools-pr`, or a root `pnpm tools-pr` script.

## Prompt variants (two implementations, one switch)

A generation run is composed by ONE of two independent prompt implementations. `composeSystemPrompt` returns early at `apps/daemon/src/prompts/system.ts:905` when a run carries an OD Next recipe, so the entire legacy stack below that line is skipped. The API/BYOK mirror at `packages/contracts/src/prompts/system.ts:318` forks the same way. The two sides share no composition floor: a rule added to one holds only for the runs that take that side.

- **Legacy side**: `apps/daemon/src/prompts/` (mirrored for API/BYOK in `packages/contracts/src/prompts/`).
- **OD Next side**: `plugins/_official/scenarios/od-next-strategy/assets/**` (markdown sent to the model verbatim) plus TypeScript in `packages/contracts/src/prompts/od-next-strategy.ts`, which is where OD Next carries host runtime contracts such as `<question-form>` and the deck framework — not in the task profiles.
- **Switch**: Settings → Labs → Design Harness, app-config `odNextStrategyMode`, or `OD_NEXT_STRATEGY_ROLLOUT`. Eligibility is re-evaluated per run by `evaluateOdNextRollout` (`apps/daemon/src/strategies/od-next/rollout.ts:138`) and can be latched down mid-session by a runtime signal, so which side a run takes varies on one machine with the switch unchanged. Divergence between the sides therefore surfaces as an intermittent bug.

Before changing any prompt text — in any of those locations — read `docs/prompt-composition.md`. It carries the variant axes, a host runtime contract table naming which path carries each contract today, the asset roster and package-hash rules for the plugin side, and the known gaps. A host contract should have one source that every path consumes: `packages/contracts/src/prompts/deck-framework.ts` is the worked example, feeding classic, BYOK, and OD Next from one scaffold. Repository-maintenance notes must never be written into files under that plugin's `assets/`; they are sent to the model verbatim.

## Agent runtime conventions

- `RuntimeAgentDef.promptInputFormat` selects how the daemon writes the prompt to a child's stdin. The default `'text'` writes the composed prompt and ends stdin immediately. `'stream-json'` wraps the prompt as one JSONL `user` message and KEEPS stdin open so the daemon can stream further user messages back in mid-turn. Claude (`apps/daemon/src/runtimes/defs/claude.ts`) ships `'stream-json'` together with `--input-format stream-json` as generic mid-turn input infrastructure; the daemon closes stdin once the turn terminates cleanly. Every other agent stays on `'text'`.
- `apps/daemon/src/server.ts` tracks `run.stdinOpen` on the run object. `applyClaudeStreamJsonRunBookkeeping` closes stdin (and records `turnCompletedCleanly`) when a `turn_end` (or `usage`) event arrives with a non `tool_use` `stop_reason`. The `tool_use` stop reason means the model paused mid tool (waiting on claude-code's internal runner); closing stdin there would truncate the follow up response.
- `claude-stream.ts` reads the turn's `stop_reason` from **three** frames, because Claude Code moved the field and the daemon does not control which build a user has installed. In order of precedence per message: (1) `stream_event` → `message_delta` → `delta.stop_reason`, the only place Claude Code 2.1.259 carries it, available only when `--include-partial-messages` is negotiated; (2) `assistant` → `message.stop_reason`, the legacy shape, which 2.1.259 leaves `null` on every frame but which older CLIs and argv-compatible forks still populate; (3) the terminal `result` frame, surfaced as `usage`, present on every build and flag combination. `emitTurnEndOnce` dedupes them by assistant message id so a build that fills both (1) and (2) announces one turn once. There is deliberately no version gate — nothing tells us which release stopped filling the legacy field, and forks version themselves independently.
- Whichever source fires, `turn_end` is emitted AFTER every tool_use of the message has been emitted, so the daemon never closes stdin before it has seen the turn's tool calls. Only a main-turn frame may fire it: a forwarded Task sub-agent frame carries a non-null top-level `parent_tool_use_id` and is refused (#5487).
- A `result` frame ends one **user turn**, not the CLI process: a stream-json session whose stdin stays open emits one `result` per turn and keeps reading. That makes it a valid per-turn reset point for `claude-stream.ts`'s artifact-echo dedup, and on a build with no in-stream boundary at all it is the only one.
- Verbatim CLI recordings backing all of the above live in `apps/daemon/tests/fixtures/claude-cli-recordings/` (see its `README.md`). Assert new turn-boundary behavior against those, **not** against the older hand-built Claude fixtures elsewhere in `apps/daemon/tests/` — those put `stop_reason` on the `assistant` wrapper and describe a stream the current CLI no longer produces.
- The host asks the user clarifying questions through the `<question-form>` artifact (see "Asking the user questions" below), NOT through a stdin-injected `tool_result`. There is no `AskUserQuestion` tool wiring, no `/api/runs/:id/tool-result` endpoint, and no host-answer return path. The stream-json input skeleton is generic infrastructure, and its one product consumer is `POST /api/runs/:id/steer` (「引导对话」, B11): the USER pushes a further message into a turn that is still running, which is the opposite direction from `<question-form>`. Admissibility lives in `apps/daemon/src/runtimes/run-steering.ts` (`classifyRunSteering`) — do not re-derive it at a call site, and do not extend it into a host-question path.

## Starting a physical Run

- Every physical Run is started through `internalRunCreation.start(run, analytics, starter)` (`apps/daemon/src/services/internal-run-service.ts`). Calling the run registry's `start` directly bypasses the Run analytics lifecycle, so the Run reports no `run_created` and no `run_finished` and nothing says so. `pnpm guard`'s "run start choke point" check enforces this; the only allowed caller of `.runs.start(` is the service itself.
- The `analytics` argument is required on purpose. A caller with no identity to attribute the Run to — a scheduled Automation, a background refresh — passes `requestAnalyticsContext: null` explicitly; the lifecycle then stays silent instead of inventing one. Stating "no identity" is a decision the code has to record, not a step a caller can skip.
- A daemon-created Run that continues an existing task inherits its analytics identity and lineage from the Run that caused it, via `inheritedRunLineageHints` (`apps/daemon/src/services/run-analytics-lifecycle.ts`). Resolve lineage through that helper rather than from the source Run's `analyticsRecovery`: the lifecycle re-reads host facts before it captures, so a short Run can hand off before its own recovery record exists.

## Asking the user questions

- There is exactly one mechanism for clarifying user intent: the `<question-form>` markdown artifact the model emits inline. `AssistantMessage.tsx` renders `QuestionFormView` directly inside the originating assistant message, and answers flow back as the next user message (`formatFormAnswers` in `apps/web/src/artifacts/question-form.ts` → `POST /api/chat`). There is no separate Questions tab or native tool card.
- `<question-form>` is valid on ANY turn, not just turn-1 discovery. Use it for turn-1 discovery briefs AND for mid-conversation clarification (e.g. an ambiguous annotation). The system-prompt guidance lives in `apps/daemon/src/prompts/system.ts` and `discovery.ts`; the API/BYOK-mode wording is mirrored through `packages/contracts/src/prompts/system.ts`.
- `run-artifacts.ts:runAskedUserQuestion` powers the `run_finished.asked_user_question` analytics signal by scanning the run's streamed text for a `<question-form` marker (reassembled across `text_delta` chunks), not by detecting any tool call.

## Chat UI conventions

- `apps/web/src/components/file-viewer-render-mode.ts` decides URL-load vs srcDoc for HTML previews. Bridges (deck, comment/inspect selection, palette, edit, tweaks) can ONLY inject through srcDoc. The host keeps both iframes mounted simultaneously and swaps CSS visibility to avoid reload flash.
- TodoWrite UI pins one task list above the chat composer via `PinnedTodoSlot`. The progress count includes both `completed` and `in_progress` items. Dismissal via Done button is keyed on snapshot JSON; a fresh TodoWrite from the agent re-shows the card.
- Tool group rendering uses `dedupeSnapshotToolRetries` to collapse `TodoWrite` snapshots. `SNAPSHOT_TOOL_NAMES` lists snapshot-style tools.
- TodoWrite has **no pinned card above the composer**. The task list appears in full exactly once, inside the turn's execution record, as `执行计划 · N 步` plus one drawer per step (`components/chat/ExecutionShell.tsx`, decisions D29 / B17 in `specs/current/chat-panel-next.md`). The old `PinnedTodoSlot` in `ChatPane.tsx` was removed when the new execution record landed; do not reintroduce it.
- What *is* pinned above the composer is the **Plan pill** (`components/chat/PlanPill.tsx`, delivered-matrix cell #71): a one-line `第 N / M 步` capsule, with the whole list in a hover-only popover that opens **upward**. It is a second view of the same TodoWrite snapshot, not a second copy of the card — `N` is *which step is running now* (not `{done}/{total}`), and the pill disappears entirely once the run ends or nothing in the list is unfinished. Visibility, `N`/`M`, and the per-step mark all live in the pure `runtime/chat/plan-pill.ts`; the component only draws. The expanded standalone Plan card (cell #70) stays **not built** (D33 / S9).
- Because the pill sits **outside** the `.chat-log` scroll container, it is wired into the same auto-scroll plumbing as `QueuedSendStrip`: it takes a `containerRef`, `ChatPane`'s `ResizeObserver` observes that element, and the pane-level `MutationObserver` re-attaches the observation whenever it mounts or unmounts. Any future pinned element there needs the same three pieces or new messages stop scrolling into view. The pill renders **before** `QueuedSendStrip` in DOM order so a growing queue pushes it up instead of overlapping it.
- `latestTodoWriteInputFromMessages` is the conversation-level discovery link (used by the pill); `unfinishedTodosFromEvents` (the daemon's own criterion) is untouched.
- One capability travelled on that pinned card and has **not** been re-homed yet: continuing a turn's remaining tasks (`onContinueRemainingTasks`). The delivered design never drew it, so where it goes is an open product decision (T33). `AssistantMessage` still accepts the prop; nothing renders it today.
- Clarifying questions render through the `<question-form>` artifact directly inside the chat — see "Asking the user questions" above.

## Web CSS ownership

- `apps/web/src/index.css` is an import-only cascade entrypoint. No selectors/declarations there.
- Shared global styles in `apps/web/src/styles/`: design tokens, base/reset, primitives, app-shell layout.
- New component-owned UI styles should default to CSS Modules (`Component.module.css`).
- Keep global class names only for deliberate shared contracts (reusable primitives, theme hooks, cross-component layout).
- CSS refactors must preserve cascade semantics. Verify with `pnpm --filter @open-design/web typecheck` and a focused build/test.

## Web component reuse

- New `apps/web` UI should reuse shared primitives from `@open-design/components` (Button, VisuallyHidden, etc).
- Do not add raw primitive classes (`primary`, `primary-ghost`, `ghost`, `icon-btn`, `sr-only`) for new UI.
- `apps/web` transpiles `@open-design/components` from source during dev (no rebuild needed).

## i18n keys

- `apps/web/src/i18n/types.ts` is the typed `Dict`; every key must be defined in all 19 locale files under `apps/web/src/i18n/locales/*.ts` (`ar`, `de`, `en`, `es-ES`, `fa`, `fr`, `hu`, `id`, `it`, `ja`, `ko`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `zh-CN`, `zh-TW`). Add the key to `types.ts` first; missing translations produce a typecheck error.

## UI animation philosophy

- Default ease-out for UI transitions: `cubic-bezier(0.23, 1, 0.32, 1)`. Built-in `ease` is too weak; `ease-in` is forbidden for UI elements because it feels sluggish.
- Asymmetric durations: enter around 200ms, exit around 140ms. Exit reads as decisive because the user has already chosen to dismiss.
- Accordion expand and collapse uses `grid-template-rows: 0fr -> 1fr` (modern auto height pattern). Pair with opacity fade and the easing above. The shared `.accordion-collapsible` + `.accordion-collapsible-inner` class pair (defined in `apps/web/src/index.css`) is the canonical implementation; reuse it for new disclosure UI.
- Never animate from `transform: scale(0)`. Start from `scale(0.9)` or higher with `opacity: 0`.
- For conditional elements, keep them mounted and toggle a CSS class (React unmounts skip exit transitions).

# Validation strategy

- After package/workspace/command-entry changes, run `pnpm install` so workspace links stay fresh.
- For agent-stream/parser changes (`apps/daemon/src/claude-stream.ts`, `json-event-stream.ts`, `qoder-stream.ts`, etc), replay a recorded session through mock CLIs in `mocks/` to verify event shapes. PATH-overlay: `export PATH="$PWD/mocks/bin:$PATH" OD_MOCKS_TRACE=<8-char-id> OD_MOCKS_NO_DELAY=1`. See `mocks/README.md`.
- Treat every `pnpm-lock.yaml` change as requiring a Nix pnpm deps hash refresh check. Use `pnpm nix:update-hash` only when intentionally maintaining Nix packaging, then re-run `nix flake check --print-build-logs --keep-going`.
- Before marking regular work ready, run at least `pnpm guard` and `pnpm typecheck`, plus the package-scoped tests/builds matching the changed files.
- Local web dev loop: `pnpm tools-dev run web --daemon-port <port> --web-port <port>`.
- e2e tests needing a tools-dev runtime: use the shared harness under `e2e/lib/tools-dev/` and suite adapters (`e2e/lib/playwright/suite.ts`, `e2e/lib/vitest/suite.ts`). Do not hand-spawn `tools-dev`.
- Playwright UI tests import `test`/`expect` from `@/playwright/suite`, not directly from `@playwright/test`. Suite owns one isolated daemon/web/data root per worker.
- On a GUI-capable machine, validate desktop: `pnpm tools-dev && pnpm tools-dev inspect desktop status`.
- Stamp/namespace changes: validate two concurrent namespaces and run `inspect eval` + `inspect screenshot` for each.
- Path/log changes: run `pnpm tools-dev logs --namespace <name> --json` and confirm paths are under `.tmp/tools-dev/<namespace>/...`.

# Bug follow-up workflow

- **Lead with a red spec.** Default to encoding the bug as a falsifiable test before any source change.
- **Try the cheapest layer first.** e2e Vitest → app-local Vitest → Playwright UI → platform-native harnesses.
- **Hold the spec's scope.** Defects outside the bug's boundary belong in a follow-up PR.
- **Let the fix read as an invariant.** Prefer a named helper with a docblock over a bolt-on `if` guard.
- **Diff against the baseline.** Stash or check out upstream before claiming no new failures.
- **Link the issue from the PR body.** Use `Fixes #N` / `Closes #N`.
- **Stage human verification for visible bugs.** Green specs alone aren't acceptance for UI/platform-native bugs.

Worked example: `e2e/tests/dialog/stop-reconciles-message.test.ts` (issue #135).
- Before adding, repairing, or optimizing tests, follow
  [`docs/testing/test-efficiency.zh-CN.md`](docs/testing/test-efficiency.zh-CN.md)
  for completion signals, virtual-clock usage, isolation, and performance
  validation.
- For agent-stream / parser changes (`apps/daemon/src/runtimes/claude-stream.ts`, `json-event-stream.ts`, `qoder-stream.ts`, etc.), replay a recorded session through the mock CLIs in `mocks/` to verify event shapes round-trip without burning provider budget. PATH-overlay activation: `export PATH="$PWD/mocks/bin:$PATH" OD_MOCKS_TRACE=<8-char-id> OD_MOCKS_NO_DELAY=1`. See `mocks/README.md` for the trace catalog and selection knobs.
- Docker image smoke/publish lives only in `.github/workflows/docker-image.yml` and is outside the core `ci.yml` / `Validate workspace` / merge queue gate.

# Common commands

```bash
pnpm install
pnpm tools-serve start updater

# Validation
pnpm guard && pnpm typecheck
pnpm --filter @open-design/web typecheck && pnpm --filter @open-design/web test && pnpm --filter @open-design/web build
pnpm --filter @open-design/daemon test && pnpm --filter @open-design/daemon build
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm --filter @open-design/tools-serve build
```

# FAQ

## Why is there no root `pnpm dev` / `pnpm start`?

To avoid starting daemon, web, and desktop through inconsistent env, port, namespace, or log paths. All local lifecycle flows must go through `pnpm tools-dev`.

## Why should `apps/nextjs` not be restored?

The current web runtime is `apps/web`. The historical `apps/nextjs` layout has been removed from the active repo shape; restoring it would reintroduce duplicate app boundaries and stale scripts.

## How does desktop discover the web URL?

Desktop queries runtime status through its sidecar client. The web URL comes from client status, not from desktop guessing ports, IPC paths, or reading web internals.

## How are sidecar-proto, sidecar, and platform split?

`@open-design/sidecar-proto` owns OpenDesign business action names and DTO/status shapes. `@open-design/sidecar` is the unique truth source for five-field argv stamps, private IPC, OS resources, process discovery, launch, invocation, and terminal lifecycle. `@open-design/platform` provides generic OS process primitives beneath sidecar and must not leak those implementation details into apps or orchestrators.

## When is `pnpm install` required?

Run `pnpm install` after changing package manifests, workspace layout, command entrypoints, bin/link-related content, or after adding/removing workspace packages.

## Can I use Node 22 instead of Node 24?

No. `package.json#engines` specifies `node: "~24"`, which is the only supported runtime. The current lockfile pins `better-sqlite3@11.10.0`; on Windows it has no prebuilt binary for Node 24 and is built from source via node-gyp (see the Windows native section). Older Node versions are not tested and may hit lockfile or dependency incompatibilities.
