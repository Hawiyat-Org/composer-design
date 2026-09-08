import type { ReleaseChannel } from "@open-design/release";

/**
 * @module protocol
 *
 * The ComposerDesign renderer host-bridge wire contract: the injected-global name
 * and version, client/updater constant registries, and every request/result
 * type that crosses the host bridge — including the {@link ComposerDesignHostBridge}
 * shape itself. Pure declarations only; depends on nothing else in the package.
 */

export const OPEN_DESIGN_HOST_GLOBAL = "__od__";
export const OPEN_DESIGN_HOST_VERSION = 2;

export const OPEN_DESIGN_HOST_CLIENT_TYPES = Object.freeze({
  DESKTOP: "desktop",
} as const);

export type ComposerDesignHostClientType =
  (typeof OPEN_DESIGN_HOST_CLIENT_TYPES)[keyof typeof OPEN_DESIGN_HOST_CLIENT_TYPES];

export type ComposerDesignHostClient = {
  // BCP-47 locale string (e.g. "zh-CN", "pt-BR") the host process read from
  // the OS at startup. The renderer uses this so the packaged desktop app
  // can follow the OS language even when Chromium's built-in
  // `navigator.language` would have defaulted to en-US.
  osLocale?: string;
  platform?: string;
  type: ComposerDesignHostClientType;
};

export type ComposerDesignHostFailure = {
  details?: unknown;
  ok: false;
  reason: string;
};

export type ComposerDesignHostActionResult =
  | { ok: true }
  | ComposerDesignHostFailure;

/**
 * The workspace attribution the renderer gives the host so a folder import
 * lands in the caller's current workspace instead of the host's ambient one.
 *
 * This is a deliberate structural subset of the daemon/web
 * `WorkspaceCollabContext`, redeclared here rather than imported: this package
 * is the renderer host-bridge wire contract and must stay independent of the
 * daemon/web contracts package (enforced by the "stays independent from
 * daemon/web contracts" test). A full `WorkspaceCollabContext` is structurally
 * assignable to this type, so callers pass theirs unchanged.
 *
 * Only the fields the host actually forwards are modelled, and the enum-like
 * fields stay `string` because the host treats them as opaque pass-through
 * values — the daemon remains the authority that parses and validates them.
 * Deliberately no index signature: an interface never satisfies one, so adding
 * it would reject the very `WorkspaceCollabContext` callers pass. Callers hand
 * over a variable, not a fresh literal, so the extra fields ride along fine.
 */
export type ComposerDesignHostWorkspaceContext = {
  lifecycleState: string;
  memberStatus: string;
  permissions: {
    canShareProjects: boolean;
    canWriteSyncedFiles: boolean;
  };
  role: string;
  workspaceId: string;
  workspaceMemberId: string;
  workspaceType: string;
};

export type ComposerDesignHostProjectImportInit = {
  designSystemId?: string | null;
  name?: string;
  skillId?: string | null;
  workspaceContext?: ComposerDesignHostWorkspaceContext | null;
};

export type ComposerDesignHostProjectImportSuccess = {
  conversationId: string;
  entryFile: string | null;
  ok: true;
  projectId: string;
};

export type ComposerDesignHostProjectImportResult =
  | ComposerDesignHostProjectImportSuccess
  | {
      canceled: true;
      ok: false;
    }
  | ComposerDesignHostFailure;

export type ComposerDesignHostProjectReplaceWorkingDirSuccess = {
  baseDir: string;
  entryFile: string | null;
  ok: true;
};

export type ComposerDesignHostProjectReplaceWorkingDirResult =
  | ComposerDesignHostProjectReplaceWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | ComposerDesignHostFailure;

export type ComposerDesignHostPickWorkingDirSuccess = {
  baseDir: string;
  ok: true;
  // Single-use HMAC token (minted by the host main process for `baseDir`)
  // that the renderer threads into POST /api/projects/:id/working-dir once
  // the project exists. Lets the Home flow pick a folder before the project
  // is created without exposing the daemon's desktop-auth gate.
  token: string;
};

export type ComposerDesignHostPickWorkingDirResult =
  | ComposerDesignHostPickWorkingDirSuccess
  | {
      canceled: true;
      ok: false;
    }
  | ComposerDesignHostFailure;

export type ComposerDesignHostPdfPrintOptions = {
  deck?: boolean;
};

export type ComposerDesignHostCaptureClip = { x: number; y: number; width: number; height: number };
export type ComposerDesignHostCaptureOptions = { clip?: ComposerDesignHostCaptureClip };
export type ComposerDesignHostCaptureSuccess = { dataUrl: string; h: number; ok: true; w: number };
export type ComposerDesignHostCaptureResult = ComposerDesignHostCaptureSuccess | ComposerDesignHostFailure;

export type ComposerDesignHostPreviewNavigationFailure = {
  errorCode: number;
  eventId: number;
  frameName?: string;
  occurredAtMs: number;
  validatedUrl: string;
};

export type ComposerDesignHostPreviewNavigationFailureListener = (
  failure: ComposerDesignHostPreviewNavigationFailure,
) => void;

export type ComposerDesignHostBrowserClearDataOptions = {
  cookies?: boolean;
  storage?: boolean;
};

/**
 * App theme values the renderer may pin the host window appearance to.
 * `light`/`dark` force the native window material (macOS under-window
 * vibrancy glass follows the OS appearance by default, which reads as a
 * muddy gray when the OS is dark but the app theme is explicitly light);
 * `system` restores following the OS.
 */
export const OPEN_DESIGN_HOST_APPEARANCE_THEMES = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const);

export type ComposerDesignHostAppearanceTheme =
  (typeof OPEN_DESIGN_HOST_APPEARANCE_THEMES)[keyof typeof OPEN_DESIGN_HOST_APPEARANCE_THEMES];

export const OPEN_DESIGN_HOST_UPDATER_ACTIONS = Object.freeze({
  CHECK: "check",
  CLEAR_CACHE: "clear-cache",
  DOWNLOAD: "download",
  INSTALL: "install",
  QUIT: "quit",
  STATUS: "status",
} as const);

export type ComposerDesignHostUpdaterAction =
  (typeof OPEN_DESIGN_HOST_UPDATER_ACTIONS)[keyof typeof OPEN_DESIGN_HOST_UPDATER_ACTIONS];

/** @internal Updater actions that return a status snapshot (every action except `quit`). */
export type ComposerDesignHostUpdaterStatusAction = Exclude<
  ComposerDesignHostUpdaterAction,
  typeof OPEN_DESIGN_HOST_UPDATER_ACTIONS.QUIT
>;

export const OPEN_DESIGN_HOST_UPDATER_STATES = Object.freeze({
  AVAILABLE: "available",
  CHECKING: "checking",
  DOWNLOADED: "downloaded",
  DOWNLOADING: "downloading",
  ERROR: "error",
  IDLE: "idle",
  INSTALLING: "installing",
  NOT_AVAILABLE: "not-available",
  UNSUPPORTED: "unsupported",
} as const);

export type ComposerDesignHostUpdaterState =
  (typeof OPEN_DESIGN_HOST_UPDATER_STATES)[keyof typeof OPEN_DESIGN_HOST_UPDATER_STATES];

export type ComposerDesignHostUpdaterMode = "js-incremental" | "package-launcher";
export type ComposerDesignHostUpdaterChannel = ReleaseChannel;

export type ComposerDesignHostUpdaterActionOptions = {
  payload?: Record<string, unknown>;
};

export type ComposerDesignHostUpdaterCapabilitySet = {
  canApplyInPlace: boolean;
  canDownload: boolean;
  canOpenInstaller: boolean;
  requiresManualInstall: boolean;
};

export type ComposerDesignHostUpdaterPathSnapshot = {
  downloadRoot?: string;
  manifestPath?: string;
};

export type ComposerDesignHostUpdaterChecksumSnapshot = {
  algorithm: "sha256" | "sha512";
  url?: string;
  value?: string;
};

export type ComposerDesignHostUpdaterArtifactSnapshot = {
  name?: string;
  platformKey?: string;
  size?: number;
  type?: string;
  url: string;
};

export type ComposerDesignHostUpdaterProgressSnapshot = {
  receivedBytes: number;
  totalBytes?: number;
};

export type ComposerDesignHostUpdaterErrorSnapshot = {
  code: string;
  details?: unknown;
  message: string;
};

export type ComposerDesignHostUpdaterInstallResult = {
  activeVersion?: string;
  artifactPath?: string;
  dryRun?: boolean;
  helperLogPath?: string;
  launcherRuntimePath?: string;
  launchPath?: string;
  openedAt: string;
  path: string;
};

export type ComposerDesignHostUpdaterReleaseSnapshot = {
  arch: string;
  artifact: ComposerDesignHostUpdaterArtifactSnapshot;
  checksum: ComposerDesignHostUpdaterChecksumSnapshot;
  channel: ComposerDesignHostUpdaterChannel;
  downloadedAt: string;
  key: string;
  metadata?: Record<string, unknown>;
  path: string;
  platformKey: string;
  version: string;
};

export type ComposerDesignHostUpdaterIncomingSnapshot = {
  arch: string;
  artifact: ComposerDesignHostUpdaterArtifactSnapshot;
  channel: ComposerDesignHostUpdaterChannel;
  key?: string;
  metadata?: Record<string, unknown>;
  progress?: ComposerDesignHostUpdaterProgressSnapshot;
  startedAt: string;
  version: string;
};

export type ComposerDesignHostUpdaterCacheLifecycleTrigger = "cold-start" | "manual" | "next-version-ready";

export type ComposerDesignHostUpdaterReleaseLifecycleState =
  | "cleanup-deferred"
  | "cleanup-removed"
  | "deprecated"
  | "retained"
  | "unknown";

export type ComposerDesignHostUpdaterCacheLifecycleSummary = {
  lastRunAt?: string;
  lastTrigger?: ComposerDesignHostUpdaterCacheLifecycleTrigger;
  platform: string;
  releases: {
    cleanupDeferred: number;
    cleanupRemoved: number;
    deprecated: number;
    errors: number;
    retained: number;
    total: number;
    unknown: number;
  };
};

export type ComposerDesignHostUpdaterCacheSnapshot = {
  lifecycle?: ComposerDesignHostUpdaterCacheLifecycleSummary;
};

export type ComposerDesignHostUpdaterReinstallReason =
  | "launcher-schema"
  | "outer-below-min"
  | "outer-version-unreadable";

/**
 * Present when the release feed requires a full installer reinstall instead of
 * an in-place payload update. `installedVersion` is the physically installed
 * outer package version; `url` is an optional operator-supplied explanation
 * link.
 */
export type ComposerDesignHostUpdaterReinstallSnapshot = {
  installedVersion?: string;
  minVersion?: string;
  reason: ComposerDesignHostUpdaterReinstallReason;
  url?: string;
};

export type ComposerDesignHostUpdaterStatusSnapshot = {
  active?: ComposerDesignHostUpdaterReleaseSnapshot;
  arch: string;
  artifact?: ComposerDesignHostUpdaterArtifactSnapshot;
  artifactUrl?: string;
  availableVersion?: string;
  cache?: ComposerDesignHostUpdaterCacheSnapshot;
  capabilities: ComposerDesignHostUpdaterCapabilitySet;
  channel: ComposerDesignHostUpdaterChannel;
  checksum?: ComposerDesignHostUpdaterChecksumSnapshot;
  currentVersion: string;
  downloadPath?: string;
  enabled: boolean;
  error?: ComposerDesignHostUpdaterErrorSnapshot;
  incoming?: ComposerDesignHostUpdaterIncomingSnapshot;
  installResult?: ComposerDesignHostUpdaterInstallResult;
  lastCheckedAt?: string;
  metadata?: Record<string, unknown>;
  mode: ComposerDesignHostUpdaterMode;
  paths?: ComposerDesignHostUpdaterPathSnapshot;
  platform: string;
  progress?: ComposerDesignHostUpdaterProgressSnapshot;
  reinstall?: ComposerDesignHostUpdaterReinstallSnapshot;
  state: ComposerDesignHostUpdaterState;
  supported: boolean;
};

export type ComposerDesignHostUpdaterResult =
  | { ok: true; status: ComposerDesignHostUpdaterStatusSnapshot }
  | ComposerDesignHostFailure;

export type ComposerDesignHostUpdaterStatusListener = (status: ComposerDesignHostUpdaterStatusSnapshot) => void;

export type ComposerDesignHostUpdaterMenuLabels = {
  check: string;
  checking: string;
  downloading: string;
  install: string;
  installing: string;
  restart: string;
};

export type ComposerDesignHostUpdaterOpenDialogRequest = {
  source: string;
};

export type ComposerDesignHostUpdaterOpenDialogListener = (request: ComposerDesignHostUpdaterOpenDialogRequest) => void;

export type ComposerDesignHostBridge = {
  // Optional so older host builds still satisfy the bridge shape; callers
  // must feature-detect before invoking.
  appearance?: {
    setTheme(theme: ComposerDesignHostAppearanceTheme): void;
  };
  browser: {
    clearData(options?: ComposerDesignHostBrowserClearDataOptions): Promise<ComposerDesignHostActionResult>;
  };
  capture: {
    page(options?: ComposerDesignHostCaptureOptions): Promise<ComposerDesignHostCaptureResult>;
  };
  client: ComposerDesignHostClient;
  pdf: {
    print(html: string, nonce?: string, options?: ComposerDesignHostPdfPrintOptions): Promise<ComposerDesignHostActionResult>;
  };
  pet: {
    setVisible(visible: boolean): void;
  };
  // Optional so web builds and older desktop hosts keep the same contract.
  // Electron is the only layer that can observe a compositor-affecting
  // subframe navigation failure after the iframe DOM remains healthy.
  preview?: {
    getLatestNavigationFailure(): ComposerDesignHostPreviewNavigationFailure | null;
    subscribeNavigationFailure(listener: ComposerDesignHostPreviewNavigationFailureListener): () => void;
  };
  project: {
    pickAndImport(init?: ComposerDesignHostProjectImportInit): Promise<ComposerDesignHostProjectImportResult>;
    pickAndReplaceWorkingDir(projectId: string): Promise<ComposerDesignHostProjectReplaceWorkingDirResult>;
    // Optional so older host builds still satisfy the bridge shape; callers
    // must feature-detect before invoking.
    pickWorkingDir?(): Promise<ComposerDesignHostPickWorkingDirResult>;
  };
  shell: {
    openExternal(url: string): Promise<ComposerDesignHostActionResult>;
    openPath(projectId: string): Promise<ComposerDesignHostActionResult>;
  };
  updater: {
    check(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostUpdaterStatusSnapshot>;
    "clear-cache"(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostUpdaterStatusSnapshot>;
    download(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostUpdaterStatusSnapshot>;
    install(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostUpdaterStatusSnapshot>;
    quit(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostActionResult>;
    setMenuLabels(labels: ComposerDesignHostUpdaterMenuLabels): Promise<ComposerDesignHostActionResult>;
    status(options?: ComposerDesignHostUpdaterActionOptions): Promise<ComposerDesignHostUpdaterStatusSnapshot>;
    subscribe(listener: ComposerDesignHostUpdaterStatusListener): () => void;
    subscribeOpenDialog(listener: ComposerDesignHostUpdaterOpenDialogListener): () => void;
  };
  version: typeof OPEN_DESIGN_HOST_VERSION;
};

export type ComposerDesignHostGlobalScope = Record<string, unknown> & {
  window?: unknown;
};
