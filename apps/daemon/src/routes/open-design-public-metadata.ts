import type { Express } from 'express';
import type {
  ComposerDesignDiscordPresenceResponse,
  ComposerDesignGithubLatestReleaseResponse,
  ComposerDesignGithubRepoResponse,
} from '@open-design/contracts';
import type { RouteDeps } from '../server-context.js';
import {
  OPEN_DESIGN_DISCORD_INVITE_URL,
  type ComposerDesignPublicMetadataService,
} from '../services/open-design-public-metadata.js';

export interface RegisterComposerDesignPublicMetadataRoutesDeps extends RouteDeps<'http'> {
  composerDesignPublicMetadata: ComposerDesignPublicMetadataService;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerComposerDesignPublicMetadataRoutes(
  app: Express,
  ctx: RegisterComposerDesignPublicMetadataRoutesDeps,
): void {
  const { composerDesignPublicMetadata } = ctx;

  app.get('/api/github/open-design', async (_req, res) => {
    try {
      const stats = await composerDesignPublicMetadata.readGithubRepoStats();
      const payload: ComposerDesignGithubRepoResponse = {
        repo: 'hawiyat/composer-design',
        stargazers_count: stats.stargazersCount,
        fetchedAt: stats.fetchedAt,
        stale: stats.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });

  app.get('/api/github/open-design/releases/latest', async (_req, res) => {
    try {
      const release = await composerDesignPublicMetadata.readLatestReleaseInfo();
      const payload: ComposerDesignGithubLatestReleaseResponse = {
        repo: 'hawiyat/composer-design',
        tag_name: release.tagName,
        html_url: release.htmlUrl,
        fetchedAt: release.fetchedAt,
        stale: release.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });

  app.get('/api/community/discord', async (_req, res) => {
    try {
      const presence = await composerDesignPublicMetadata.readDiscordPresence();
      const payload: ComposerDesignDiscordPresenceResponse = {
        inviteCode: 'mHAjSMV6gz',
        inviteUrl: OPEN_DESIGN_DISCORD_INVITE_URL,
        onlineCount: presence.onlineCount,
        memberCount: presence.memberCount,
        fetchedAt: presence.fetchedAt,
        stale: presence.stale,
      };
      res.json(payload);
    } catch (error) {
      res.status(502).json({ error: errorMessage(error) });
    }
  });
}
