import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GTFSParseError,
  parseCSV,
  parseGTFSFeedFiles,
  summarizeGTFSFeed
} from '../src/gtfs/gtfs_loader.js';
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

test('GTFS CSV parser preserves quoted newlines', () => {
  const rows = parseCSV(`stop_id,stop_name,description
1,"Union Station","Line one
Line two"`);

  assert.deepEqual(rows, [
    {
      stop_id: '1',
      stop_name: 'Union Station',
      description: 'Line one\nLine two'
    }
  ]);
});

test('GTFS feed parser validates and returns required LA Metro tables', () => {
  const feed = parseGTFSFeedFiles(buildFixtureGTFSFiles(), {
    sourceName: 'fixture metro rail'
  });
  const summary = summarizeGTFSFeed(feed);

  assert.equal(feed.routes.length, 1);
  assert.equal(feed.stops.length, 2);
  assert.equal(feed.trips[0].trip_id, 'trip-a');
  assert.equal(feed.stopTimes[1].stop_sequence, '2');
  assert.equal(feed.calendar[0].service_id, 'weekday');
  assert.equal(feed.calendarDates[0].exception_type, '2');
  assert.equal(summary.routeCount, 1);
  assert.equal(summary.stopCount, 2);
  assert.equal(summary.tripCount, 1);
  assert.equal(summary.stopTimeCount, 2);
  assert.equal(summary.feedStartDate, '20260601');
  assert.equal(summary.feedEndDate, '20261231');
});

test('GTFS feed parser reports missing required files with source and path', () => {
  const files = buildFixtureGTFSFiles();
  delete files['stop_times.txt'];

  assert.throws(
    () => parseGTFSFeedFiles(files, { sourceName: 'bad feed' }),
    (error) => {
      assert.ok(error instanceof GTFSParseError);
      assert.match(error.message, /bad feed/);
      assert.match(error.message, /stop_times\.txt/);
      return true;
    }
  );
});

test('GTFS feed parser reports row-specific validation errors', () => {
  const files = buildFixtureGTFSFiles({
    'routes.txt': `route_id,route_short_name,route_long_name,route_type
801,A,A Line,`
  });

  assert.throws(
    () => parseGTFSFeedFiles(files, { sourceName: 'bad feed' }),
    (error) => {
      assert.ok(error instanceof GTFSParseError);
      assert.match(error.message, /routes\.txt/);
      assert.match(error.message, /row 2/);
      assert.match(error.message, /route_type/);
      return true;
    }
  );
});

test('GTFS feed parser reports stop_time references to unknown trips', () => {
  const files = buildFixtureGTFSFiles({
    'stop_times.txt': `trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type
missing-trip,08:00:00,08:00:00,80122,1,0,0`
  });

  assert.throws(
    () => parseGTFSFeedFiles(files, { sourceName: 'bad feed' }),
    (error) => {
      assert.ok(error instanceof GTFSParseError);
      assert.match(error.message, /stop_times\.txt/);
      assert.match(error.message, /unknown trip_id/);
      return true;
    }
  );
});

function buildFixtureGTFSFiles(overrides = {}) {
  return {
    'routes.txt': `route_id,agency_id,route_short_name,route_long_name,route_type,route_color
801,LACMTA,A,A Line,0,0072CE`,
    'stops.txt': `stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station
80122,Union Station,34.0561,-118.2375,1,
80119,7th St/Metro Center,34.0486,-118.2588,1,`,
    'trips.txt': `route_id,service_id,trip_id,trip_headsign,direction_id
801,weekday,trip-a,Long Beach,0`,
    'stop_times.txt': `trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type
trip-a,08:00:00,08:00:00,80122,1,0,0
trip-a,08:07:00,08:07:00,80119,2,0,0`,
    'calendar.txt': `service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
weekday,1,1,1,1,1,0,0,20260601,20261231`,
    'calendar_dates.txt': `service_id,date,exception_type
weekday,20260704,2`,
    'feed_info.txt': `feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,feed_end_date
LA Metro,https://www.metro.net,en,20260601,20261231`,
    ...overrides
  };
}
