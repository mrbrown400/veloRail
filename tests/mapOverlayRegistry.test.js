import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('map overlay registry has deterministic order and default visibility', async () => {
  const {
    getDefaultMapOverlayVisibility,
    getMapOverlayComparisonModeForVisibility,
    getMapOverlayComparisonModes,
    getMapOverlayGroupDefinitions,
    getOrderedMapOverlayDefinitions,
    MAP_OVERLAY_FUTURE_SERVICE_NOTICE,
    MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE,
    MAP_OVERLAY_VISIONARY_SERVICE_NOTICE
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
  assert.equal(getMapOverlayComparisonModeForVisibility(visibility), 'present-only');

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

  const comparisonModes = getMapOverlayComparisonModes();

  assert.deepEqual(comparisonModes.map((mode) => mode.id), [
    'present-only',
    'present-plus-future'
  ]);
  assert.equal(comparisonModes[0].futureOverlayVisible, false);
  assert.equal(comparisonModes[1].futureOverlayVisible, true);
  assert.match(MAP_OVERLAY_FUTURE_SERVICE_NOTICE, /not current Google Maps operational service/);
  assert.match(MAP_OVERLAY_VISIONARY_SERVICE_NOTICE, /not Google Maps transit data/);
  assert.match(MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE, /candidates require review/);
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
  assert.equal(byLabel.get('Speculative river rail vision')?.overlayId, 'visionary-concepts');
  assert.equal(byLabel.get('Freight corridor')?.scenario, 'nationalized');
  assert.equal(byLabel.get('Passenger conversion')?.scenario, 'nationalized');
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
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.visionary.line.strokePattern, 'solid');
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.freight_only.line.strokePattern, 'solid');
  assert.equal(MAP_OVERLAY_STYLE_CONFIG.converted_passenger.legend.scenario, 'nationalized');

  const [future] = getProposalOverlayInputsByGroup('future');
  const [visionary] = getProposalOverlayInputsByGroup('visionary');
  const freight = getProposalOverlayInputsByGroup('freight').find(
    ({ proposal }) => proposal.id === 'la-freight-alameda-corridor'
  );
  const convertedPassenger = getProposalOverlayInputsByGroup('converted_passenger').find(
    ({ proposal }) => proposal.id === 'alameda-corridor-south-alameda-passenger-conversion'
  );

  assert.ok(freight);
  assert.ok(convertedPassenger);

  assert.equal(getProposalOverlayStyle(future.proposal).key, 'future');
  assert.equal(getProposalOverlayStyle(future.proposal).legend.label, 'Future heavy rail');
  assert.equal(getProposalOverlayStyle(visionary.proposal).key, 'visionary');
  assert.equal(getProposalOverlayStyle(visionary.proposal).line.strokePattern, 'solid');
  assert.equal(getProposalOverlayStyle(freight.proposal).key, 'freight_only');
  assert.equal(getProposalOverlayStyle(freight.proposal).line.strokePattern, 'solid');
  assert.equal(getProposalOverlayStyle(convertedPassenger.proposal).key, 'converted_passenger');

  const legendItems = getMapOverlayLegendItems();
  const byLabel = new Map(legendItems.map((item) => [item.label, item]));

  assert.equal(byLabel.get('Google transit')?.color, MAP_OVERLAY_STYLE_CONFIG.current.legend.color);
  assert.equal(byLabel.get('Google bicycling')?.color, MAP_OVERLAY_STYLE_CONFIG.context.legend.color);
});

test('proposal overlay groups expose imported sample layers independently', async () => {
  const {
    getProposalOverlayInputsByGroup,
    shouldRenderProposalStationMarkers
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
    'vision-vermont-rapid-rail',
    'vision-la-river-rail',
    'vision-westside-crosstown-rail',
    'vision-valley-orbital-rail'
  ]);
  assert.deepEqual(nationalized.map(({ proposal }) => proposal.id), [
    'freight-alameda-corridor',
    'la-freight-alameda-corridor',
    'la-freight-bnsf-los-angeles-san-bernardino',
    'la-freight-union-pacific-los-angeles-inland-empire',
    'la-freight-pacific-harbor-line-port-complex',
    'alameda-corridor-south-alameda-passenger-conversion',
    'bnsf-la-san-bernardino-passenger-conversion',
    'up-la-inland-empire-passenger-conversion'
  ]);
  assert.ok(future[0].polyline.path.length > 1);
  assert.ok(nationalized.every(({ polyline }) => polyline.path.length > 1));
  assert.ok(future[0].markers.length > 1);
  assert.ok(nationalized.filter(({ proposal }) => proposal.status === 'converted_passenger').every(
    ({ markers }) => markers.length >= 3
  ));
  assert.ok([...future, ...visionary, ...nationalized].every(
    ({ proposal }) => shouldRenderProposalStationMarkers(proposal) === false
  ));
  assert.ok(future.every(({ proposal }) => proposal.classification === 'official'));
  assert.ok(visionary.every(({ proposal }) => proposal.classification !== 'official'));
  assert.ok(visionary.every(({ proposal }) => proposal.rendering?.layerGroup === 'visionary'));
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

test('D Line future overlay excludes opened Section 1 stations and geometry', async () => {
  const {
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const dLine = getProposalOverlayInputsByGroup('future').find(
    ({ proposal }) => proposal.id === 'metro-d-line-extension-westwood'
  );

  assert.ok(dLine);
  assert.equal(dLine.polyline.path[0].lng, -118.3769);
  assert.deepEqual(dLine.markers.map(marker => marker.title), [
    'Wilshire/Rodeo',
    'Century City/Constellation',
    'Westwood/UCLA',
    'Westwood/VA Hospital'
  ]);
  assert.ok(dLine.markers.every(marker => marker.openingYear === 2027));
  assert.ok(!dLine.markers.some(marker => /La Brea|Fairfax|La Cienega/.test(marker.title)));
  assert.ok(!dLine.polyline.path.some(point => point.lng === -118.3440 || point.lng === -118.3614));
});

test('future station metadata stays available without rendering station dots by default', async () => {
  const {
    FUTURE_STATION_MIN_ZOOM,
    getProposalMarkerZoomRange,
    getStationStatusStyle,
    shouldRenderProposalStationMarkers
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');
  const {
    TRANSIT_PROPOSAL_DATASET
  } = await loadAppModule('/src/data/transitProposals.ts');

  const futureProposal = TRANSIT_PROPOSAL_DATASET.proposals.find(
    proposal => proposal.id === 'metro-d-line-extension-westwood'
  );

  assert.ok(futureProposal);
  assert.equal(shouldRenderProposalStationMarkers(futureProposal), false);
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

test('visionary registry metadata includes speculative language and provenance', async () => {
  const {
    getProposalInfoContent,
    getProposalMetadata,
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const visionary = getProposalOverlayInputsByGroup('visionary').find(
    ({ proposal }) => proposal.id === 'vision-la-river-rail'
  );

  assert.ok(visionary);

  const metadata = getProposalMetadata(visionary.proposal);
  const details = new Map(metadata.details.map((detail) => [detail.label, detail.value]));
  const content = getProposalInfoContent(visionary.proposal);

  assert.equal(metadata.kind, 'line');
  assert.equal(metadata.badgeLabel, 'Visionary');
  assert.equal(metadata.statusLabel, 'vision');
  assert.equal(metadata.classificationLabel, 'speculative');
  assert.equal(metadata.uncertaintyLabel, 'high');
  assert.equal(details.get('Classification'), 'speculative');
  assert.equal(details.get('Geometry'), 'conceptual');
  assert.match(metadata.disclaimer, /Speculative VeloRail scenario/i);
  assert.ok(metadata.sources.some(source => source.sourceType === 'internal_example'));
  assert.ok(metadata.sources.some(source => source.publisher === 'VeloRail' && source.accessedAt === '2026-05-19'));
  assert.match(content, /Sources/);
  assert.match(content, /Speculative VeloRail scenario/);
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
  assert.equal(details.get('Suitability'), 'medium');
  assert.match(details.get('Suitability score'), /^\d+\/100$/);
  assert.equal(details.get('Suitability method'), 'vr-406-transparent-heuristic-v1');
  assert.match(details.get('Missing scoring data'), /passenger demand/);
  assert.match(metadata.disclaimer, /approximate VeloRail geometry/i);
  assert.ok(metadata.sources.some(source => source.url && source.accessedAt === '2026-05-19'));
});

test('nationalized rail corridors use track-aligned source geometry for map display', async () => {
  const {
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const freight = getProposalOverlayInputsByGroup('freight');
  const byId = new Map(freight.map(({ proposal, polyline }) => [proposal.id, { proposal, polyline }]));

  assert.ok(byId.get('la-freight-alameda-corridor')?.polyline.path.length > 40);
  assert.ok(byId.get('la-freight-bnsf-los-angeles-san-bernardino')?.polyline.path.length > 90);
  assert.ok(byId.get('la-freight-union-pacific-los-angeles-inland-empire')?.polyline.path.length > 50);
  assert.match(
    byId.get('la-freight-alameda-corridor')?.proposal.geometry.geometryNotes ?? '',
    /Caltrans California Rail Network/
  );
  assert.ok(byId.get('la-freight-alameda-corridor')?.proposal.provenance.some(
    source => source.sourceId === 'caltrans-california-rail-network'
  ));
});

test('converted passenger metadata links back to source freight corridor and station assumptions', async () => {
  const {
    getProposalMetadata,
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const converted = getProposalOverlayInputsByGroup('converted_passenger').find(
    ({ proposal }) => proposal.id === 'alameda-corridor-south-alameda-passenger-conversion'
  );

  assert.ok(converted);

  const metadata = getProposalMetadata(converted.proposal);
  const stationMetadata = getProposalMetadata(converted.proposal, converted.markers[1]);
  const details = new Map(metadata.details.map((detail) => [detail.label, detail.value]));

  assert.equal(metadata.kind, 'line');
  assert.equal(metadata.badgeLabel, 'Passenger conversion');
  assert.equal(metadata.statusLabel, 'converted passenger');
  assert.equal(metadata.classificationLabel, 'speculative');
  assert.equal(details.get('Source corridor'), 'la-freight-alameda-corridor');
  assert.match(details.get('Station assumptions'), /South Alameda\/Slauson/);
  assert.match(metadata.disclaimer, /Hypothetical passenger-conversion planning concept/);
  assert.equal(stationMetadata.kind, 'station');
  assert.equal(stationMetadata.title, 'South Alameda / Slauson');
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

test('map overlay store synchronizes @VR-104 comparison mode with future overlay visibility', async () => {
  const {
    useMapOverlayStore
  } = await loadAppModule('/src/stores/mapOverlayStore.ts');

  useMapOverlayStore.getState().resetOverlayVisibility();

  assert.equal(useMapOverlayStore.getState().comparisonMode, 'present-only');
  assert.equal(useMapOverlayStore.getState().visibility['future-projects'], false);

  useMapOverlayStore.getState().setComparisonMode('present-plus-future');

  assert.equal(useMapOverlayStore.getState().comparisonMode, 'present-plus-future');
  assert.equal(useMapOverlayStore.getState().visibility['future-projects'], true);
  assert.equal(useMapOverlayStore.getState().visibility['current-transit'], true);

  useMapOverlayStore.getState().toggleOverlay('future-projects');

  assert.equal(useMapOverlayStore.getState().comparisonMode, 'present-only');
  assert.equal(useMapOverlayStore.getState().visibility['future-projects'], false);

  useMapOverlayStore.getState().setOverlayVisible('future-projects', true);

  assert.equal(useMapOverlayStore.getState().comparisonMode, 'present-plus-future');
  assert.equal(useMapOverlayStore.getState().visibility['future-projects'], true);
});
