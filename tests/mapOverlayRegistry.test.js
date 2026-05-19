import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('map overlay registry has deterministic order and default visibility', async () => {
  const {
    getDefaultMapOverlayVisibility,
    getMapOverlayGroupDefinitions,
    getOrderedMapOverlayDefinitions
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const definitions = getOrderedMapOverlayDefinitions();

  assert.deepEqual(definitions.map((definition) => definition.id), [
    'current-transit',
    'future-projects',
    'visionary-concepts',
    'nationalized-rail',
    'bicycling'
  ]);
  assert.deepEqual(
    definitions.map((definition) => definition.order),
    [10, 20, 30, 40, 50]
  );

  const visibility = getDefaultMapOverlayVisibility();

  assert.equal(visibility['current-transit'], true);
  assert.equal(visibility['future-projects'], false);
  assert.equal(visibility['visionary-concepts'], false);
  assert.equal(visibility['nationalized-rail'], false);
  assert.equal(visibility.bicycling, false);

  const groups = getMapOverlayGroupDefinitions();

  assert.deepEqual(groups.map((group) => group.id), [
    'current',
    'future',
    'visionary',
    'nationalized'
  ]);
  assert.deepEqual(groups.map((group) => group.overlayIds), [
    ['current-transit', 'bicycling'],
    ['future-projects'],
    ['visionary-concepts'],
    ['nationalized-rail']
  ]);
});

test('map overlay legend items come from current registry and proposal labels', async () => {
  const {
    getMapOverlayLegendItems
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const legendItems = getMapOverlayLegendItems();
  const byLabel = new Map(legendItems.map((item) => [item.label, item]));

  assert.equal(byLabel.get('Google transit')?.overlayId, 'current-transit');
  assert.equal(byLabel.get('Google bicycling')?.overlayId, 'bicycling');
  assert.equal(byLabel.get('Future heavy rail')?.scenario, 'future');
  assert.equal(byLabel.get('Visionary concept')?.overlayId, 'visionary-concepts');
  assert.equal(byLabel.get('Freight corridor')?.scenario, 'nationalized');
  assert.ok(legendItems.every((item) => item.color));
});

test('overlay style config drives proposal rendering and native legend metadata', async () => {
  const {
    MAP_OVERLAY_STYLE_CONFIG,
    getMapOverlayLegendItems,
    getProposalOverlayStyle,
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  assert.equal(MAP_OVERLAY_STYLE_CONFIG.future.legend.scenario, 'future');
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.visionary.line.strokePattern, 'dashed');
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.freight_only.line.strokePattern, 'dotted');
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.converted_passenger.legend.scenario, 'nationalized');

  const [future] = getProposalOverlayInputsByGroup('future');
  const [visionary] = getProposalOverlayInputsByGroup('visionary');
  const freight = getProposalOverlayInputsByGroup('freight').find(
    ({ proposal }) => proposal.id === 'la-freight-alameda-corridor'
  );

  assert.ok(freight);

  const convertedPassenger = {
    ...freight.proposal,
    status: 'converted_passenger',
    style: undefined,
    rendering: {
      ...freight.proposal.rendering,
      layerGroup: 'converted_passenger'
    }
  };

  assert.equal(getProposalOverlayStyle(future.proposal).key, 'future');
  assert.equal(getProposalOverlayStyle(future.proposal).legend.label, 'Future heavy rail');
  assert.equal(getProposalOverlayStyle(visionary.proposal).key, 'visionary');
  assert.equal(getProposalOverlayStyle(visionary.proposal).line.strokePattern, 'dashed');
  assert.equal(getProposalOverlayStyle(freight.proposal).key, 'freight_only');
  assert.equal(getProposalOverlayStyle(freight.proposal).line.strokePattern, 'dotted');
  assert.equal(getProposalOverlayStyle(convertedPassenger).key, 'converted_passenger');

  const legendItems = getMapOverlayLegendItems();
  const byLabel = new Map(legendItems.map((item) => [item.label, item]));

  assert.equal(byLabel.get('Google transit')?.color, MAP_OVERLAY_STYLE_CONFIG.current.legend.color);
  assert.equal(byLabel.get('Google bicycling')?.color, MAP_OVERLAY_STYLE_CONFIG.context.legend.color);
});

test('proposal overlay groups expose imported sample layers independently', async () => {
  const {
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');
  const {
    IMPORTED_TRANSIT_PROPOSALS
  } = await loadAppModule('/src/data/transitProposalSources.ts');

  const future = getProposalOverlayInputsByGroup('future');
  const visionary = getProposalOverlayInputsByGroup('visionary');
  const nationalized = getProposalOverlayInputsByGroup(['freight', 'converted_passenger']);

  assert.equal(
    future[0],
    IMPORTED_TRANSIT_PROPOSALS.overlays.find(({ proposal }) => proposal.id === 'metro-d-line-extension-westwood')
  );
  assert.deepEqual(future.map(({ proposal }) => proposal.id), [
    'metro-d-line-extension-westwood',
    'metro-east-san-fernando-valley-lrt',
    'metro-southeast-gateway-line',
    'metro-k-line-extension-torrance',
    'metro-eastside-transit-corridor-phase-2',
    'metro-noho-pasadena-brt',
    'metro-vermont-brt'
  ]);
  assert.deepEqual(visionary.map(({ proposal }) => proposal.id), [
    'vision-vermont-rapid-rail'
  ]);
  assert.deepEqual(nationalized.map(({ proposal }) => proposal.id), [
    'freight-alameda-corridor',
    'la-freight-alameda-corridor',
    'la-freight-bnsf-los-angeles-san-bernardino',
    'la-freight-union-pacific-los-angeles-inland-empire',
    'la-freight-pacific-harbor-line-port-complex'
  ]);
  assert.ok(future[0].polyline.path.length > 1);
  assert.ok(nationalized.every(({ polyline }) => polyline.path.length > 1));
  assert.ok(future[0].markers.length > 1);
  assert.ok(future.every(({ proposal }) => proposal.classification === 'official'));
});

test('future overlay only accepts official planned, funded, or under-construction proposals', async () => {
  const {
    isOfficialFutureProposal
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');
  const {
    TRANSIT_PROPOSAL_DATASET
  } = await loadAppModule('/src/data/transitProposals.ts');

  const futureProposal = TRANSIT_PROPOSAL_DATASET.proposals.find(
    proposal => proposal.id === 'metro-d-line-extension-westwood'
  );

  assert.ok(futureProposal);
  assert.equal(isOfficialFutureProposal(futureProposal), true);
  assert.equal(isOfficialFutureProposal({ ...futureProposal, status: 'operational' }), false);
  assert.equal(isOfficialFutureProposal({ ...futureProposal, classification: 'speculative' }), false);
});

test('future station markers use zoom-aware visibility and status styling', async () => {
  const {
    FUTURE_STATION_MIN_ZOOM,
    getProposalMarkerZoomRange,
    getStationStatusStyle
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');
  const {
    TRANSIT_PROPOSAL_DATASET
  } = await loadAppModule('/src/data/transitProposals.ts');

  const futureProposal = TRANSIT_PROPOSAL_DATASET.proposals.find(
    proposal => proposal.id === 'metro-d-line-extension-westwood'
  );

  assert.ok(futureProposal);
  assert.equal(getProposalMarkerZoomRange(futureProposal).minZoom, FUTURE_STATION_MIN_ZOOM);
  assert.notEqual(
    getStationStatusStyle('under_construction').fillColor,
    getStationStatusStyle('operational').fillColor
  );
});

test('proposal metadata exposes station details and reachable provenance', async () => {
  const {
    getProposalInfoContent,
    getProposalMetadata,
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const [future] = getProposalOverlayInputsByGroup('future');
  const station = future.markers.find(marker => marker.openingYear);
  const metadata = getProposalMetadata(future.proposal, station);
  const content = getProposalInfoContent(future.proposal, station);

  assert.equal(metadata.kind, 'station');
  assert.equal(metadata.statusLabel, 'under construction');
  assert.equal(metadata.classificationLabel, 'official');
  assert.ok(metadata.sources.some(source => source.url));
  assert.match(content, /Sources/);
  assert.match(content, /href=/);
  assert.match(content, /Opening:/);
  assert.match(content, /Phase:/);
});

test('freight corridor metadata includes ownership, uncertainty, and source links', async () => {
  const {
    getProposalMetadata,
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const freight = getProposalOverlayInputsByGroup('freight').find(
    ({ proposal }) => proposal.id === 'la-freight-alameda-corridor'
  );

  assert.ok(freight);

  const metadata = getProposalMetadata(freight.proposal);
  const details = new Map(metadata.details.map((detail) => [detail.label, detail.value]));

  assert.equal(metadata.kind, 'corridor');
  assert.equal(metadata.badgeLabel, 'Freight only');
  assert.equal(metadata.statusLabel, 'freight only');
  assert.equal(details.get('Owner'), 'Alameda Corridor Transportation Authority');
  assert.equal(details.get('Track usage'), 'freight');
  assert.match(metadata.disclaimer, /approximate VeloRail geometry/i);
  assert.ok(metadata.sources.some(source => source.url && source.accessedAt === '2026-05-19'));
});

test('map overlay store toggles one overlay without mutating others', async () => {
  const {
    useMapOverlayStore
  } = await loadAppModule('/src/stores/mapOverlayStore.ts');

  useMapOverlayStore.getState().resetOverlayVisibility();
  const before = useMapOverlayStore.getState().visibility;

  useMapOverlayStore.getState().toggleOverlay('visionary-concepts');

  const after = useMapOverlayStore.getState().visibility;

  assert.equal(after['visionary-concepts'], !before['visionary-concepts']);
  assert.equal(after['current-transit'], before['current-transit']);
  assert.equal(after['future-projects'], before['future-projects']);
  assert.equal(after['nationalized-rail'], before['nationalized-rail']);
});
