# Directory guide

This file is the single source of truth for agents entering this repository. Read this file first; after entering `apps/`, `packages/`, `tools/`, or `e2e/`, read that layer's `AGENTS.md` for module-level details. Do not copy module details back into the root file; root stays focused on cross-repository boundaries, workflow, and commands.

- `CLAUDE.md` is a one-line `@AGENTS.md` directive — this file IS the canonical entry point.
- `CONTEXT.md` is the product domain glossary (Project, Normal Artifact, Live Artifact, etc). Read it when you need to align on product terms.

## Core documentation index

- Product and onboarding: `README.md`, `docs/i18n/README.zh-CN.md`, `QUICKSTART.md`.
- Contribution and environment: `CONTRIBUTING.md`, `docs/i18n/CONTRIBUTING.zh-CN.md`.
- Architecture and protocols: `docs/spec.md`, `docs/architecture.md`, `docs/skills-protocol.md`, `docs/agent-adapters.md`, `docs/modes.md`.
- Roadmap and references: `docs/roadmap.md`, `docs/references.md`, `docs/code-review-guidelines.md`, `specs/current/maintainability-roadmap.md`.
- Directory-level agent guidance: `.github/AGENTS.md`, `apps/AGENTS.md`, `packages/AGENTS.md`, `tools/AGENTS.md`, `e2e/AGENTS.md`.
- Packaged auto-update architecture and high-confidence local harness: read `tools/pack/AGENTS.md` section "Packaged auto-update architecture and harness" before touching packaged updater code, release-channel identity, installer behavior, or updater UI.

## Workspace directories

- Workspace packages come from `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `tools/*`, and `e2e`.
- Top-level content directories: `skills/` (functional skills the agent invokes mid-task — utilities, briefs, packagers; see `skills/AGENTS.md`), `design-templates/` (rendering catalogue: decks, prototypes, image/video/audio templates; see `design-templates/AGENTS.md` and `specs/current/skills-and-design-templates.md`), `design-systems/` (brand `DESIGN.md` files), `craft/` (universal brand-agnostic craft rules a skill can opt into via `od.craft.requires`), `mocks/` (replay-based mock CLIs for major coding agents — PATH-overlay drop-in for tests and self-validation; see `mocks/README.md`).
- `apps/web` is the Next.js 16 App Router + React 18 web runtime; do not restore `apps/nextjs`.
- `apps/daemon` is the local privileged daemon and `od` bin. It owns `/api/*`, agent spawning, skills, design systems, artifacts, and static serving.
- `apps/desktop` is the Electron shell; it discovers the web URL through sidecar IPC.
- `apps/packaged` is the thin packaged Electron runtime entry; it starts packaged sidecars and owns the `od://` entry glue only.
- `packages/contracts` is the pure TypeScript web/daemon app contract layer.
- `packages/sidecar-proto` owns the Open Design sidecar business protocol; `packages/sidecar` owns the generic sidecar runtime; `packages/platform` owns generic OS process primitives.
- `tools/dev` is the local development lifecycle control plane.
- `tools/pack` is the local packaged build/start/stop/logs control plane, packaged updater harness, installer identity/registry validation surface, and mac beta release artifact preparation surface.
- `tools/serve` is the local fixture-service control plane; first service is `tools-serve start updater` for deterministic updater metadata and artifacts.
- `e2e` owns user-level end-to-end smoke tests and Playwright UI automation; read `e2e/AGENTS.md` before editing its tests or commands.

## Inactive or placeholder directories

- `apps/nextjs` and `packages/shared` have been removed; do not recreate or reference them.
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
- `tools-dev` owns sidecar runtime/log/ipc namespacing.
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

## Release channel model

- `beta` — daily R&D/development validation channel (not part of stable promotion gate).
- `prerelease` — internal validation channel for stable delivery.
- `preview` — independent early-access channel with stable-like release rigor.
- `stable` — formal delivery channel. Depends on prerelease only, never on preview.
- Public packaged app identity must stay channel-distinct: `Open Design`, `Open Design Beta`, `Open Design Prerelease`, `Open Design Preview`.
- Windows beta updater validation must use the real beta namespace `release-beta-win`.

## Boundary constraints

- Tests under `apps/`, `packages/`, and `tools/` live in a package/app/tool-level `tests/` directory sibling to `src/`; keep `src/` source-only and do not add new `*.test.ts` or `*.test.tsx` files under `src/`. Playwright UI automation belongs to `e2e/ui/`, not app packages.
- App packages must not import another app's private `src/` or `tests/` implementation as a shared helper. In particular, `apps/web/**` must not import `apps/daemon/src/**`.
- Cross-app, cross-runtime, or repository-resource consistency checks belong in `e2e/tests/` when they need to observe more than one app/package boundary.
- Keep shared API DTOs, SSE event unions, error shapes, task shapes, and example payloads in `packages/contracts`; update contracts before wiring divergent web/daemon request or response shapes.
- Keep `packages/contracts` pure TypeScript and free of Next.js, Express, Node filesystem/process APIs, browser APIs, SQLite, daemon internals, and sidecar control-plane dependencies.
- New `.js`, `.mjs`, or `.cjs` files need an explicit generated/vendor/compatibility reason and must pass `pnpm guard`.
- App business logic must not know about sidecar/control-plane concepts. Keep sidecar awareness in `apps/<app>/sidecar` or the desktop sidecar entry wrapper.
- Sidecar process stamps must have exactly five fields: `app`, `mode`, `namespace`, `ipc`, and `source`.
- Orchestration layers (`tools-dev`, `tools-pack`, packaged launchers) must call package primitives; do not hand-build `--od-stamp-*` args or process-scan regexes.
- Packaged runtime paths must be namespace-scoped and independent from daemon/web ports; ports are transient transport details only.
- Default runtime files live under `<project-root>/.tmp/<source>/<namespace>/...`; POSIX IPC sockets are fixed at `/tmp/open-design/ipc/<namespace>/<app>.sock`.

## Capability exposure (UI/CLI dual-track)

Every user-facing capability must be reachable through both the web UI **and** the `od` CLI (`apps/daemon/src/cli.ts`). Shipping a feature with only one surface is a regression.

- The CLI is the embeddability contract. External agents drive Open Design through `od` subcommands.
- Both surfaces must call the same `/api/*` endpoints with shared DTOs from `packages/contracts`.
- The CLI form must support `--json` for machine-readable output and `--prompt-file <path|->`.
- Adding a new capability is a three-step closure: HTTP endpoint in `apps/daemon/src/*-routes.ts` (with a contract type in `packages/contracts/src/api/`), UI surface in `apps/web/src/`, and `od <capability>` subcommand in `apps/daemon/src/cli.ts` registered through `SUBCOMMAND_MAP`. Land all three in the same PR.

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

- Use `docs/code-review-guidelines.md` as the repository-wide review standard.
- Walk reviews top-down: Product relevance test → forbidden surfaces → ownership/scope → matching lane → checklist → comments → approval bar.
- Pick the matching review lane: default code/tests, contract and protocol changes, design-system additions, skill additions, or craft additions.
- Before reviewing changes under `apps/`, `packages/`, `tools/`, or `e2e/`, read that directory's `AGENTS.md` and apply its local boundaries.
- Blocking review feedback should focus on correctness, security/secrets, data integrity, repository boundary violations, contract/migration breakage, missing required validation, or high-risk maintainability issues.
- Only maintainers may close a PR instead of requesting changes.

## PR-duty tooling

The former `pnpm tools-pr` workflow has moved to `PerishCode/duty`. Do not recreate `tools/pr`, `@open-design/tools-pr`, or a root `pnpm tools-pr` script.

## Agent runtime conventions

- `RuntimeAgentDef.promptInputFormat` selects how the daemon writes the prompt to a child's stdin. Default `'text'` writes and ends stdin immediately. `'stream-json'` wraps as one JSONL `user` message and keeps stdin open for mid-turn streaming (used by Claude via `apps/daemon/src/runtimes/defs/claude.ts`).
- `apps/daemon/src/server.ts` tracks `run.stdinOpen`. `applyClaudeStreamJsonRunBookkeeping` closes stdin when a `turn_end`/`usage` event arrives with a non-`tool_use` `stop_reason`.
- `claude-stream.ts` emits `turn_end` AFTER iterating content blocks, so the daemon sees final `stop_reason` before deciding whether to close stdin.
- The host asks clarifying questions through the `<question-form>` markdown artifact (rendered as Questions tab), NOT through stdin-injected `tool_result`. There is no `AskUserQuestion` tool wiring.

## Asking the user questions

- Exactly one mechanism: the `<question-form>` markdown artifact. The chat renders a `QuestionsBanner` entry point; the form renders in the right-hand Questions tab, and answers flow back as the next user message.
- `<question-form>` is valid on ANY turn — both turn-1 discovery and mid-conversation clarification.
- `run-artifacts.ts:runAskedUserQuestion` powers analytics by scanning streamed text for a `<question-form` marker across `text_delta` chunks.

## Chat UI conventions

- `apps/web/src/components/file-viewer-render-mode.ts` decides URL-load vs srcDoc for HTML previews. Bridges (deck, comment/inspect selection, palette, edit, tweaks) can ONLY inject through srcDoc. The host keeps both iframes mounted simultaneously and swaps CSS visibility to avoid reload flash.
- TodoWrite UI pins one task list above the chat composer via `PinnedTodoSlot`. The progress count includes both `completed` and `in_progress` items. Dismissal via Done button is keyed on snapshot JSON; a fresh TodoWrite from the agent re-shows the card.
- Tool group rendering uses `dedupeSnapshotToolRetries` to collapse `TodoWrite` snapshots. `SNAPSHOT_TOOL_NAMES` lists snapshot-style tools.

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

- `apps/web/src/i18n/types.ts` is the typed Dict; every key must be defined in all 18 locale files under `apps/web/src/i18n/locales/*.ts`.

## UI animation philosophy

- Default ease-out: `cubic-bezier(0.23, 1, 0.32, 1)`. `ease-in` is forbidden for UI.
- Asymmetric durations: enter ~200ms, exit ~140ms.
- Accordion expand/collapse uses `grid-template-rows: 0fr -> 1fr` with `.accordion-collapsible` + `.accordion-collapsible-inner`.
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

# Common commands

```bash
# Setup
pnpm install

# Lifecycle
pnpm tools-dev                                                    # full lifecycle (start/stop/run/status/logs/inspect/check)
pnpm tools-dev run web --daemon-port 17456 --web-port 17573       # foreground dev loop
pnpm tools-dev status --json && pnpm tools-dev logs --json        # status + logs
pnpm tools-dev inspect desktop status --json                      # desktop inspection
pnpm tools-dev inspect desktop screenshot --path /tmp/od.png      # desktop screenshot

# Services
pnpm tools-serve start updater

# Validation
pnpm guard && pnpm typecheck
pnpm --filter @open-design/web typecheck && pnpm --filter @open-design/web test && pnpm --filter @open-design/web build
pnpm --filter @open-design/daemon test && pnpm --filter @open-design/daemon build
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/tools-dev build
pnpm --filter @open-design/tools-pack build
pnpm --filter @open-design/tools-serve build

# Packaged builds
pnpm tools-pack mac build --to all && pnpm tools-pack mac install
pnpm tools-pack win build --to nsis  && pnpm tools-pack win install
pnpm tools-pack linux build --to appimage && pnpm tools-pack linux install
pnpm tools-pack linux build --containerized

# Nix
pnpm nix:update-hash
```

# FAQ

## Why no root `pnpm dev` / `pnpm start` / `pnpm build` / `pnpm test`?

All lifecycle flows go through `pnpm tools-dev` to prevent inconsistent env/port/namespace/log paths. Build/test stay package-scoped to avoid broad unnecessary builds.

## Why should `apps/nextjs` and `packages/shared` not be restored?

They were removed from the active repo shape; restoring would reintroduce duplicate app boundaries and stale scripts.

## How does desktop discover the web URL?

Through sidecar IPC runtime status, not by guessing ports or reading web internals.

## How are sidecar-proto, sidecar, and platform split?

`@open-design/sidecar-proto` = business protocol (app constants, stamp fields, IPC schema). `@open-design/sidecar` = generic bootstrap/IPC transport/runtime resolution. `@open-design/platform` = generic OS process primitives (stamp serialization, command parsing, process matching).

## When is `pnpm install` required?

After changing package manifests, workspace layout, command entrypoints, bin/links, or adding/removing workspace packages.

## Can I use Node 22?

No. `package.json#engines` requires `~24`.
