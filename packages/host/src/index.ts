/**
 * @module host
 *
 * Public barrel for `@open-design/host` — the ComposerDesign renderer host-bridge
 * protocol. Re-exports the exact prior flat surface from the cohesive sibling
 * modules: the wire protocol (constants + types), bridge detection/validation,
 * adapter-result normalizers, and the renderer-facing action wrappers. This
 * file contains no logic.
 */

// --- protocol: constant registries + wire types ---
export {
  OPEN_DESIGN_HOST_GLOBAL,
  OPEN_DESIGN_HOST_VERSION,
  OPEN_DESIGN_HOST_APPEARANCE_THEMES,
  OPEN_DESIGN_HOST_CLIENT_TYPES,
  OPEN_DESIGN_HOST_UPDATER_ACTIONS,
  OPEN_DESIGN_HOST_UPDATER_STATES,
} from "./protocol.js";
export type {
  ComposerDesignHostClientType,
  ComposerDesignHostClient,
  ComposerDesignHostFailure,
  ComposerDesignHostActionResult,
  ComposerDesignHostWorkspaceContext,
  ComposerDesignHostProjectImportInit,
  ComposerDesignHostProjectImportSuccess,
  ComposerDesignHostProjectImportResult,
  ComposerDesignHostProjectReplaceWorkingDirSuccess,
  ComposerDesignHostProjectReplaceWorkingDirResult,
  ComposerDesignHostPickWorkingDirSuccess,
  ComposerDesignHostPickWorkingDirResult,
  ComposerDesignHostPdfPrintOptions,
  ComposerDesignHostCaptureClip,
  ComposerDesignHostCaptureOptions,
  ComposerDesignHostCaptureSuccess,
  ComposerDesignHostCaptureResult,
  ComposerDesignHostPreviewNavigationFailure,
  ComposerDesignHostPreviewNavigationFailureListener,
  ComposerDesignHostAppearanceTheme,
  ComposerDesignHostBrowserClearDataOptions,
  ComposerDesignHostUpdaterAction,
  ComposerDesignHostUpdaterState,
  ComposerDesignHostUpdaterMode,
  ComposerDesignHostUpdaterChannel,
  ComposerDesignHostUpdaterActionOptions,
  ComposerDesignHostUpdaterCapabilitySet,
  ComposerDesignHostUpdaterPathSnapshot,
  ComposerDesignHostUpdaterChecksumSnapshot,
  ComposerDesignHostUpdaterArtifactSnapshot,
  ComposerDesignHostUpdaterProgressSnapshot,
  ComposerDesignHostUpdaterErrorSnapshot,
  ComposerDesignHostUpdaterInstallResult,
  ComposerDesignHostUpdaterReleaseSnapshot,
  ComposerDesignHostUpdaterIncomingSnapshot,
  ComposerDesignHostUpdaterCacheLifecycleTrigger,
  ComposerDesignHostUpdaterReleaseLifecycleState,
  ComposerDesignHostUpdaterCacheLifecycleSummary,
  ComposerDesignHostUpdaterCacheSnapshot,
  ComposerDesignHostUpdaterReinstallReason,
  ComposerDesignHostUpdaterReinstallSnapshot,
  ComposerDesignHostUpdaterStatusSnapshot,
  ComposerDesignHostUpdaterResult,
  ComposerDesignHostUpdaterStatusListener,
  ComposerDesignHostUpdaterMenuLabels,
  ComposerDesignHostUpdaterOpenDialogRequest,
  ComposerDesignHostUpdaterOpenDialogListener,
  ComposerDesignHostBridge,
  ComposerDesignHostGlobalScope,
} from "./protocol.js";

// --- detection: locate + validate the injected bridge ---
export {
  isComposerDesignHostBridge,
  getComposerDesignHost,
  isComposerDesignHostAvailable,
  detectComposerDesignHostClientType,
} from "./detection.js";

// --- normalize: adapter result -> renderer contract ---
export {
  normalizeComposerDesignHostProjectImportResult,
  normalizeComposerDesignHostProjectReplaceWorkingDirResult,
  normalizeComposerDesignHostPickWorkingDirResult,
} from "./normalize.js";

// --- actions: renderer-facing host action wrappers ---
export {
  openHostExternalUrl,
  openHostProjectPath,
  clearHostBrowserData,
  captureHostPage,
  pickAndImportHostProject,
  pickAndReplaceHostProjectWorkingDir,
  pickHostWorkingDir,
  printHostPdf,
  setHostPetVisible,
  getHostUpdaterStatus,
  checkHostUpdater,
  clearHostUpdaterCache,
  downloadHostUpdater,
  installHostUpdater,
  quitHostAfterUpdaterInstallerOpen,
  getLatestHostPreviewNavigationFailure,
  subscribeHostUpdater,
  subscribeHostUpdaterOpenDialog,
  subscribeHostPreviewNavigationFailure,
  setHostUpdaterMenuLabels,
} from "./actions.js";
