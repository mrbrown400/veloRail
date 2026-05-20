import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  FreightConversionScenario,
  ProposalCoordinate,
  ProposalStation,
  TransitProposal,
  TransitProposalDataset
} from '@/types/proposals';

export const FREIGHT_PASSENGER_CONVERSION_SOURCE_NAME = 'generated-freight-passenger-conversions.v1.ts';

type StationRole = NonNullable<ProposalStation['role']>;
type StationCoordinateSelector = 'first' | 'middle' | 'last' | number;

interface ConversionStationPlan {
  idSuffix: string;
  name: string;
  coordinate: StationCoordinateSelector;
  role: StationRole;
  notes: string;
}

const CONVERSION_STATION_PLANS: Record<string, ConversionStationPlan[]> = {
  'alameda-corridor-south-alameda-passenger-conversion': [
    {
      idSuffix: 'san-pedro-bay',
      name: 'San Pedro Bay terminal',
      coordinate: 'first',
      role: 'terminal',
      notes: 'Conceptual southern terminal near the port rail complex; passenger access and terminal siting are not sourced.'
    },
    {
      idSuffix: 'south-alameda-slauson',
      name: 'South Alameda / Slauson',
      coordinate: 5,
      role: 'transfer',
      notes: 'Conceptual South Alameda stop for the user-feedback corridor; station feasibility is not assessed.'
    },
    {
      idSuffix: 'downtown-rail-yards',
      name: 'Downtown LA rail yards',
      coordinate: 'last',
      role: 'terminal',
      notes: 'Conceptual downtown interface with existing rail yards; not an approved terminal.'
    }
  ],
  'bnsf-la-san-bernardino-passenger-conversion': [
    {
      idSuffix: 'hobart-commerce',
      name: 'Hobart / Commerce',
      coordinate: 'first',
      role: 'terminal',
      notes: 'Conceptual western terminal near the freight terminal area.'
    },
    {
      idSuffix: 'orange-county-interface',
      name: 'Orange County interface',
      coordinate: 'middle',
      role: 'transfer',
      notes: 'Conceptual intermediate transfer area based on generalized corridor geometry.'
    },
    {
      idSuffix: 'san-bernardino',
      name: 'San Bernardino freight gateway',
      coordinate: 'last',
      role: 'terminal',
      notes: 'Conceptual inland terminal near the sourced freight anchor.'
    }
  ],
  'up-la-inland-empire-passenger-conversion': [
    {
      idSuffix: 'los-angeles-river',
      name: 'Los Angeles River rail yards',
      coordinate: 'first',
      role: 'terminal',
      notes: 'Conceptual western terminal near the LA basin freight gateway.'
    },
    {
      idSuffix: 'san-gabriel-valley',
      name: 'San Gabriel Valley interface',
      coordinate: 'middle',
      role: 'transfer',
      notes: 'Conceptual intermediate station area; the checked source batch does not define platforms.'
    },
    {
      idSuffix: 'inland-empire-gateway',
      name: 'Inland Empire gateway',
      coordinate: 'last',
      role: 'terminal',
      notes: 'Conceptual eastern terminal near the inland freight gateway.'
    }
  ]
};

export function createFreightPassengerConversionDataset(
  sourceDataset: TransitProposalDataset
): TransitProposalDataset {
  return {
    schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
    updatedAt: sourceDataset.updatedAt,
    migrationNotes: [
      'VR-404/VR-405 generated converted_passenger records from sourced freight corridors with explicit hypothetical disclaimers.',
      'Converted passenger geometry inherits the source freight corridor linework and remains speculative planning data.',
      'Station records are deterministic assumptions for overlay rendering only; they are not official station proposals.'
    ],
    proposals: sourceDataset.proposals.flatMap(generateFreightPassengerConversionRecords)
  };
}

export function generateFreightPassengerConversionRecords(
  source: TransitProposal
): TransitProposal[] {
  const scenarios = source.freight?.conversionScenarios ?? [];

  return scenarios.map((scenario) => createConversionRecord(source, scenario));
}

function createConversionRecord(
  source: TransitProposal,
  scenario: FreightConversionScenario
): TransitProposal {
  const proposalId = scenario.id;
  const normalizedScenario = normalizeScenario(source, scenario);
  const stationAssumptions = normalizedScenario.stationAssumptions ?? [];

  return {
    id: proposalId,
    name: normalizedScenario.name,
    shortName: source.shortName ? `${source.shortName} conversion` : undefined,
    kind: 'line',
    status: 'converted_passenger',
    mode: normalizedScenario.targetMode,
    classification: 'speculative',
    geometry: {
      type: 'LineString',
      geometrySource: 'conceptual',
      geometryNotes: `Generated passenger-conversion line using source freight corridor ${source.id}. ${source.geometry.geometryNotes ?? 'Source corridor geometry is reused as-is.'}`,
      coordinates: source.geometry.coordinates.map(cloneCoordinate)
    },
    provenance: [
      ...source.provenance.map((sourceEntry) => ({ ...sourceEntry })),
      {
        sourceId: `${proposalId}-generation`,
        title: `${normalizedScenario.name} generated conversion record`,
        sourceType: 'internal_example',
        publisher: 'VeloRail',
        accessedAt: '2026-05-19',
        note: `Generated by VeloRail from ${source.id}. Source records support the freight corridor only; this does not establish approved passenger service.`
      }
    ],
    confidence: {
      level: 'low',
      geometry: source.confidence.geometry ?? 'medium',
      stations: 'low',
      status: 'unknown',
      notes: 'Freight corridor geometry is sourced, but passenger service pattern and stations are VeloRail assumptions.'
    },
    uncertainty: {
      level: 'high',
      sourceNotes: `Generated from sourced freight corridor ${source.id}; checked sources do not approve passenger service.`,
      assumptions: [
        ...normalizedScenario.assumptions,
        ...stationAssumptions
      ],
      disclaimer: 'Hypothetical passenger-conversion planning concept generated from sourced freight corridor data. Not approved Metro, Metrolink, railroad, or public agency service.'
    },
    stations: buildConversionStations(proposalId, normalizedScenario, source),
    style: {
      strokeOpacity: 0.82,
      strokeWeight: 3,
      strokePattern: 'solid',
      legendLabel: 'Passenger conversion'
    },
    rendering: {
      layerGroup: 'converted_passenger',
      minZoom: source.rendering?.minZoom,
      maxZoom: source.rendering?.maxZoom,
      clickable: true
    },
    freight: {
      owner: source.freight?.owner ?? 'Unknown freight corridor owner',
      operator: source.freight?.operator ?? 'Unknown freight corridor operator',
      trackUsage: 'passenger',
      electrification: source.freight?.electrification ?? 'unknown',
      ownershipSourceId: source.freight?.ownershipSourceId,
      usageSourceId: source.freight?.usageSourceId,
      electrificationSourceId: source.freight?.electrificationSourceId,
      conversionScenarioId: normalizedScenario.id,
      conversionScenarios: [normalizedScenario],
      suitability: source.freight?.suitability,
      suitabilityNotes: `Passenger conversion inherits freight metadata from ${source.id}; feasibility, governance, and operations are not scored.`
    },
    notes: `${normalizedScenario.serviceConcept ?? 'Generated passenger conversion concept.'} Source corridor: ${source.id}.`,
    tags: uniqueTags([
      ...(source.tags ?? []),
      'converted-passenger',
      'hypothetical',
      'passenger-conversion',
      'vr-404',
      'vr-405'
    ])
  };
}

function normalizeScenario(
  source: TransitProposal,
  scenario: FreightConversionScenario
): FreightConversionScenario {
  return {
    ...scenario,
    sourceFreightCorridorId: scenario.sourceFreightCorridorId ?? source.id,
    assumptions: [...scenario.assumptions],
    stationAssumptions: scenario.stationAssumptions ? [...scenario.stationAssumptions] : undefined
  };
}

function buildConversionStations(
  proposalId: string,
  scenario: FreightConversionScenario,
  source: TransitProposal
): ProposalStation[] {
  const plans = CONVERSION_STATION_PLANS[scenario.id] ?? defaultStationPlans(source);

  return plans.flatMap((plan, index) => {
    const coordinate = selectCoordinate(source.geometry.coordinates, plan.coordinate);
    if (!coordinate) return [];

    const [lon, lat] = coordinate;

    return [{
      id: `${proposalId}-${plan.idSuffix}`,
      name: plan.name,
      lat,
      lon,
      status: 'converted_passenger',
      role: plan.role,
      confidence: 'low',
      notes: `${plan.notes} ${scenario.stationAssumptions?.[index] ?? ''}`.trim()
    }];
  });
}

function defaultStationPlans(source: TransitProposal): ConversionStationPlan[] {
  const baseName = source.shortName ?? source.name;

  return [
    {
      idSuffix: 'western-terminal',
      name: `${baseName} western terminal`,
      coordinate: 'first',
      role: 'terminal',
      notes: 'Generated endpoint station assumption.'
    },
    {
      idSuffix: 'intermediate-interface',
      name: `${baseName} intermediate interface`,
      coordinate: 'middle',
      role: 'transfer',
      notes: 'Generated midpoint station assumption.'
    },
    {
      idSuffix: 'eastern-terminal',
      name: `${baseName} eastern terminal`,
      coordinate: 'last',
      role: 'terminal',
      notes: 'Generated endpoint station assumption.'
    }
  ];
}

function selectCoordinate(
  coordinates: ProposalCoordinate[],
  selector: StationCoordinateSelector
): ProposalCoordinate | undefined {
  if (coordinates.length === 0) return undefined;

  if (selector === 'first') return coordinates[0];
  if (selector === 'last') return coordinates[coordinates.length - 1];
  if (selector === 'middle') return coordinates[Math.floor((coordinates.length - 1) / 2)];

  return coordinates[Math.max(0, Math.min(selector, coordinates.length - 1))];
}

function cloneCoordinate([lon, lat]: ProposalCoordinate): ProposalCoordinate {
  return [lon, lat];
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags));
}
