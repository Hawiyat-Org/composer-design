import { describe, expect, it } from 'vitest';

import {
  OPEN_DESIGN_BRIEF_ARTIFACT_TYPES,
  collectComposerDesignBrief,
  formatComposerDesignBriefForCli,
  composerDesignBriefCatalog,
  validateComposerDesignBriefCatalog,
} from '../src/index.js';

describe('ComposerDesign shared Brief decisions', () => {
  it('defines deterministic choice-only questions for all eight artifact types', () => {
    expect(Object.keys(composerDesignBriefCatalog).sort()).toEqual(
      [...OPEN_DESIGN_BRIEF_ARTIFACT_TYPES].sort(),
    );

    for (const artifactType of OPEN_DESIGN_BRIEF_ARTIFACT_TYPES) {
      const first = collectComposerDesignBrief({ artifactType });
      const retry = collectComposerDesignBrief({ artifactType });

      expect(retry).toEqual(first);
      expect(first.questions.length).toBeGreaterThanOrEqual(2);
      expect(first.questions.length).toBeLessThanOrEqual(3);
      expect(new Set(first.questions.map((question) => question.id)).size).toBe(
        first.questions.length,
      );
      for (const question of first.questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options.some((option) => option.id === question.defaultOptionId)).toBe(true);
        expect(question.allowCustom).toBe(false);
      }
    }
  });

  it('deep-freezes the shared catalog as runtime protocol truth', () => {
    expect(Object.isFrozen(composerDesignBriefCatalog)).toBe(true);
    for (const artifactType of OPEN_DESIGN_BRIEF_ARTIFACT_TYPES) {
      const questions = composerDesignBriefCatalog[artifactType];
      expect(Object.isFrozen(questions)).toBe(true);
      for (const question of questions) {
        expect(Object.isFrozen(question)).toBe(true);
        expect(Object.isFrozen(question.options)).toBe(true);
        for (const candidate of question.options) {
          expect(Object.isFrozen(candidate)).toBe(true);
        }
      }
    }
  });

  it('caps invalid catalogs at five questions and rejects duplicate question or option ids', () => {
    const website = composerDesignBriefCatalog.website;
    expect(() => validateComposerDesignBriefCatalog({
      ...composerDesignBriefCatalog,
      website: [...website, ...website],
    })).toThrow(/at most 5/i);

    expect(() => validateComposerDesignBriefCatalog({
      ...composerDesignBriefCatalog,
      website: [website[0]!, { ...website[1]!, id: website[0]!.id }],
    })).toThrow(/duplicate question id/i);

    expect(() => validateComposerDesignBriefCatalog({
      ...composerDesignBriefCatalog,
      website: [{
        ...website[0]!,
        options: [website[0]!.options[0]!, website[0]!.options[0]!],
      }],
    })).toThrow(/duplicate option id/i);
  });

  it('does not repeat known decisions and invalidates answers after an artifact type switch', () => {
    const website = collectComposerDesignBrief({
      artifactType: 'website',
      knownAnswers: { 'website.goal': ['launch-product'] },
    });
    expect(website.questions.map((question) => question.id)).not.toContain('website.goal');
    expect(website.answers).toEqual({ 'website.goal': ['launch-product'] });

    const prototype = collectComposerDesignBrief({
      artifactType: 'product-prototype',
      previousArtifactType: 'website',
      knownAnswers: {
        'website.goal': ['launch-product'],
        'prototype.platform': ['mobile'],
      },
    });
    expect(prototype.answers).toEqual({ 'prototype.platform': ['mobile'] });
    expect(prototype.questions.map((question) => question.id)).not.toContain('prototype.platform');
  });

  it('uses valid defaults for skipped or fully specified briefs and emits stable CLI text', () => {
    const initial = collectComposerDesignBrief({ artifactType: 'audio', skip: true });
    expect(initial.complete).toBe(true);
    expect(initial.questions).toEqual([]);
    expect(Object.keys(initial.answers)).toHaveLength(composerDesignBriefCatalog.audio.length);

    const cli = formatComposerDesignBriefForCli(initial);
    expect(cli).toContain('ComposerDesign brief');
    expect(cli).toContain('Artifact: audio');
    expect(cli).toContain('Ready to confirm');
    expect(cli).toContain('Current choices:');
    expect(cli).toContain('What kind of audio should this be?: Background music');
    expect(cli).not.toContain('briefDraftId');
    expect(cli).not.toContain('nonce');
    expect(cli).not.toContain('[object Object]');
    expect(formatComposerDesignBriefForCli(initial)).toBe(cli);
  });

  it('offers a short-audio duration that covers the canonical 15-second fixture', () => {
    const duration = composerDesignBriefCatalog.audio.find(
      (question) => question.id === 'audio.duration',
    );
    const short = duration?.options.find((option) => option.id === 'short');

    expect(short?.label).toBe('15–30 seconds');
  });

  it('copies and deeply freezes accepted answer arrays', () => {
    const source = ['mobile'];
    const brief = collectComposerDesignBrief({
      artifactType: 'product-prototype',
      knownAnswers: { 'prototype.platform': source },
    });
    source[0] = 'web';

    expect(brief.answers['prototype.platform']).toEqual(['mobile']);
    expect(Object.isFrozen(brief)).toBe(true);
    expect(Object.isFrozen(brief.answers)).toBe(true);
    expect(Object.isFrozen(brief.answers['prototype.platform'])).toBe(true);
  });
});
