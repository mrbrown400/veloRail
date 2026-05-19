#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

function readOptions(argv) {
  const options = {
    asOf: new Date().toISOString().slice(0, 10),
    maxAgeDays: undefined,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--as-of') {
      options.asOf = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--max-age-days') {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value)) {
        throw new Error('--max-age-days must be a finite number.');
      }
      options.maxAgeDays = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run validate:official-future-transit -- [--as-of YYYY-MM-DD] [--max-age-days N]

Validates the checked-in official future transit dataset and source watch
manifest. This command is offline: it checks that maintainers reviewed public
sources recently, but it does not fetch or mutate source pages.`);
}

function printIssues(title, issues) {
  if (issues.length === 0) return;

  console.error(title);
  issues.forEach((issue) => {
    console.error(`- ${issue.path} (${issue.code}): ${issue.message}`);
  });
}

async function createViteModuleLoader() {
  return createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'error',
    optimizeDeps: {
      entries: []
    },
    resolve: {
      alias: {
        '@': path.resolve('src')
      }
    },
    server: {
      hmr: false,
      middlewareMode: true,
      ws: false
    }
  });
}

async function main() {
  const options = readOptions(process.argv);

  if (options.help) {
    printHelp();
    return;
  }

  const server = await createViteModuleLoader();

  try {
    const {
      OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY,
      OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS,
      OFFICIAL_LA_FUTURE_TRANSIT_DATASET
    } = await server.ssrLoadModule('/src/data/officialFutureTransitProposals.ts');
    const {
      validateOfficialFutureTransitDatasetFreshness,
      validateOfficialFutureTransitSourceWatchTargets
    } = await server.ssrLoadModule('/src/data/transitProposalValidation.ts');
    const {
      importTransitProposalDataset
    } = await server.ssrLoadModule('/src/data/transitProposalImport.ts');

    const freshnessOptions = {
      asOf: options.asOf,
      maxSourceAgeDays: options.maxAgeDays ?? OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY.staleAfterDays
    };
    const datasetResult = validateOfficialFutureTransitDatasetFreshness(
      OFFICIAL_LA_FUTURE_TRANSIT_DATASET,
      freshnessOptions
    );
    const watchResult = validateOfficialFutureTransitSourceWatchTargets(
      OFFICIAL_LA_FUTURE_TRANSIT_DATASET,
      OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS,
      freshnessOptions
    );

    printIssues('Official future transit dataset validation failed:', datasetResult.issues);
    printIssues('Official future transit source watch validation failed:', watchResult.issues);

    if (!datasetResult.valid || !watchResult.valid) {
      process.exitCode = 1;
      return;
    }

    const importResult = importTransitProposalDataset(OFFICIAL_LA_FUTURE_TRANSIT_DATASET, {
      sourceName: OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY.sourceName
    });

    console.log('Official future transit validation passed.');
    console.log(`As of ${options.asOf}: ${importResult.dataset.proposals.length} proposals, ${OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS.length} watch targets, ${importResult.overlays.length} overlays.`);
    console.log(`Freshness policy: review every ${OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY.reviewCadenceDays} days; stale after ${freshnessOptions.maxSourceAgeDays} days.`);
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
