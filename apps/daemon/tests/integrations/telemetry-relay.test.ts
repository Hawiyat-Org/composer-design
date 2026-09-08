import { describe, expect, it } from 'vitest';

import {
  normalizeComposerDesignTelemetryRelayUrl,
  OPEN_DESIGN_TELEMETRY_RELAY_URLS,
} from '../../src/integrations/telemetry-relay.js';

describe('ComposerDesign telemetry relay URLs', () => {
  it('keeps production on telemetry.open-design.ai', () => {
    expect(OPEN_DESIGN_TELEMETRY_RELAY_URLS.prod).toBe(
      'https://telemetry.open-design.ai/api/langfuse',
    );
    expect(normalizeComposerDesignTelemetryRelayUrl(
      'https://telemetry.open-design.ai/api/langfuse//',
    )).toBe(OPEN_DESIGN_TELEMETRY_RELAY_URLS.prod);
  });

  it('moves legacy self-host test URLs to telemetry-test.open-design.ai', () => {
    expect(normalizeComposerDesignTelemetryRelayUrl(
      'https://telemetry-selfhost.open-design.ai/api/langfuse/',
    )).toBe(OPEN_DESIGN_TELEMETRY_RELAY_URLS.test);
  });

  it('leaves custom relay URLs unchanged', () => {
    expect(normalizeComposerDesignTelemetryRelayUrl(
      'https://telemetry.example.test/api/langfuse/',
    )).toBe('https://telemetry.example.test/api/langfuse');
  });
});
