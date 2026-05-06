import { runIssueGateCli } from './issue-gate-runner.mjs';

runIssueGateCli().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

