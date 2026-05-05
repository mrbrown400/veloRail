import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('bike duration estimates combine flat speed and climbing penalty', async () => {
  const {
    estimateBikeDuration
  } = await loadAppModule('/src/services/bikeDurationService.ts');

  assert.equal(
    estimateBikeDuration(10, 0, { baseSpeedKmh: 20, riderWeightKg: 70 }),
    1800
  );
  assert.equal(
    estimateBikeDuration(10, 100, { baseSpeedKmh: 20, riderWeightKg: 70 }),
    2400
  );
});

test('grade adjusted speed slows uphill and caps downhill assistance', async () => {
  const {
    calculateSpeedForGrade
  } = await loadAppModule('/src/services/bikeDurationService.ts');

  const settings = { baseSpeedKmh: 20, riderWeightKg: 80 };
  const flatSpeed = calculateSpeedForGrade(0, settings);
  const uphillSpeed = calculateSpeedForGrade(6, settings);
  const steepUphillSpeed = calculateSpeedForGrade(40, settings);
  const downhillSpeed = calculateSpeedForGrade(-40, settings);

  assert.ok(flatSpeed > 19.9 && flatSpeed < 20.1);
  assert.ok(uphillSpeed < flatSpeed);
  assert.equal(steepUphillSpeed, 5);
  assert.equal(downhillSpeed, 50);
});
