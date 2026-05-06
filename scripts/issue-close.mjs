import { runIssueCloseCli } from './issue-gate-runner.mjs';

runIssueCloseCli().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

