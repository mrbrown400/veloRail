import { runTaskGateCli } from './task-gate-runner.mjs';

runTaskGateCli().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
