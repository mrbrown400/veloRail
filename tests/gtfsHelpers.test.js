import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../src/gtfs/gtfs_loader.js';
import { secondsToTime, timeToSeconds } from '../src/gtfs/gtfs_store.js';

test('GTFS time helpers preserve after midnight service times', () => {
  assert.equal(timeToSeconds('00:00:05'), 5);
  assert.equal(timeToSeconds('25:30:00'), 91800);
  assert.equal(secondsToTime(91800), '25:30:00');
});

test('GTFS CSV parser handles quoted commas and escaped quotes', () => {
  const rows = parseCSV(`stop_id,stop_name,description
1,"Union Station, Los Angeles","Main hub"
2,"Quoted ""Stop""","Escaped quote"`);

  assert.deepEqual(rows, [
    {
      stop_id: '1',
      stop_name: 'Union Station, Los Angeles',
      description: 'Main hub'
    },
    {
      stop_id: '2',
      stop_name: 'Quoted "Stop"',
      description: 'Escaped quote'
    }
  ]);
});
