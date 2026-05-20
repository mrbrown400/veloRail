import { runTaskCloseCli } from './task-gate-runner.mjs';

runTaskCloseCli().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
