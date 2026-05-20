import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  ProposalMarkerInput,
  ProposalPolylineInput,
  ProposalStation,
  ProposalStylingHints,
  TransitProposal,
  TransitProposalDataset
} from '@/types/proposals';
import { assertValidTransitProposalDataset } from './transitProposalValidation';

const DEFAULT_STYLE: Required<Pick<
  ProposalStylingHints,
  'strokeColor' | 'strokeOpacity' | 'strokeWeight' | 'stationFillColor' | 'stationStrokeColor' | 'stationScale' | 'zIndex'
>> = {
  strokeColor: '#2563eb',
  strokeOpacity: 0.85,
  strokeWeight: 3,
  stationFillColor: '#2563eb',
  stationStrokeColor: '#ffffff',
  stationScale: 5,
  zIndex: 20
};

export const TRANSIT_PROPOSAL_DATASET: TransitProposalDataset = {
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: '2026-05-19',
  migrationNotes: [
    'Existing TRANSIT_LINES records remain the operational routing source for VR-001.',
    'Proposal statuses use operational instead of the existing routing status operating; migration should map operating to operational when proposal records are derived from live service.',
    'Proposal geometry uses GeoJSON LineString coordinates in [lon, lat] order and converts to Google Maps {lat, lng} paths through adapter helpers.',
    'D Line Section 1 opened on 2026-05-08, so the seed future overlay uses Wilshire/La Cienega as a current-service connection anchor and only represents Sections 2 and 3.'
  ],
  proposals: [
    {
      id: 'metro-d-line-extension-westwood',
      name: 'D Line Extension to Westwood',
      shortName: 'D Line Westwood Extension',
      kind: 'line',
      status: 'under_construction',
      mode: 'heavy_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Seed example follows Google Maps and Metro station-location references for the still-future westward extension only. The first coordinate is the current Wilshire/La Cienega terminal connection anchor, not a future station marker.',
        coordinates: [
          [-118.3762, 34.0652],
          [-118.3867, 34.0662],
          [-118.3983, 34.0668],
          [-118.4158, 34.0587],
          [-118.4444, 34.0586],
          [-118.4547, 34.0541]
        ]
      },
      stations: [
        {
          id: 'd-line-wilshire-rodeo',
          name: 'Wilshire/Rodeo',
          lat: 34.0668,
          lon: -118.3983,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2027,
          phase: 'Section 3'
        },
        {
          id: 'd-line-century-city',
          name: 'Century City/Constellation',
          lat: 34.0587,
          lon: -118.4158,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2027,
          phase: 'Section 3'
        },
        {
          id: 'd-line-westwood-ucla',
          name: 'Westwood/UCLA',
          lat: 34.0586,
          lon: -118.4444,
          status: 'under_construction',
          role: 'transfer',
          openingYear: 2027,
          phase: 'Section 3',
          existingLines: ['Sepulveda Transit Corridor']
        },
        {
          id: 'd-line-westwood-va',
          name: 'Westwood/VA Hospital',
          lat: 34.0541,
          lon: -118.4547,
          status: 'under_construction',
          role: 'terminal',
          openingYear: 2027,
          phase: 'Section 3'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-d-line-extension-project-page',
          title: 'Metro D Line Subway Extension project materials',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/westside/',
          accessedAt: '2026-05-19',
          note: 'Metro lists Section 1 as open on May 8, 2026, with Sections 2 and 3 still under construction; this seed record now tracks only the still-future westward extension and keeps Wilshire/La Cienega as a non-station connection anchor.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'medium',
        stations: 'high',
        status: 'high',
        notes: 'Sections 2 and 3 project and station list are official; geometry is simplified for schema coverage.'
      },
      uncertainty: {
        level: 'low',
        sourceNotes: 'Official Metro project materials establish Section 1 as open and Sections 2 and 3 as still under construction; VeloRail seed geometry is simplified for validation coverage.',
        disclaimer: 'Official project record with simplified VeloRail geometry.'
      },
      timeline: {
        openingYear: 2027,
        phase: 'Sections 2 and 3',
        phaseOrder: 2,
        scheduleNotes: 'Metro project status checked on 2026-05-19: Section 1 is open, while Sections 2 and 3 remain under construction.'
      },
      style: {
        strokeColor: '#A05DA5',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        stationFillColor: '#A05DA5',
        legendLabel: 'Future heavy rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      tags: ['future', 'metro', 'heavy-rail', 'd-line', 'sections-2-3']
    },
    {
      id: 'vision-vermont-rapid-rail',
      name: 'Vermont Avenue Rapid Rail Vision',
      shortName: 'Vermont Rapid Rail',
      kind: 'line',
      status: 'vision',
      mode: 'heavy_rail',
      classification: 'speculative',
      geometry: {
        type: 'LineString',
        geometrySource: 'conceptual',
        geometryNotes: 'Conceptual north-south line for visionary overlay testing.',
        coordinates: [
          [-118.2923, 34.0984],
          [-118.2917, 34.0617],
          [-118.2923, 34.0183],
          [-118.2916, 33.9283]
        ]
      },
      stations: [
        {
          id: 'vermont-vision-sunset',
          name: 'Vermont/Sunset',
          lat: 34.0984,
          lon: -118.2923,
          status: 'vision',
          role: 'terminal',
          existingLines: ['Red'],
          confidence: 'medium'
        },
        {
          id: 'vermont-vision-wilshire',
          name: 'Wilshire/Vermont',
          lat: 34.0617,
          lon: -118.2917,
          status: 'vision',
          role: 'transfer',
          existingLines: ['Red', 'Purple'],
          confidence: 'medium'
        },
        {
          id: 'vermont-vision-expo',
          name: 'Expo/Vermont',
          lat: 34.0183,
          lon: -118.2923,
          status: 'vision',
          role: 'transfer',
          existingLines: ['Expo'],
          confidence: 'low'
        },
        {
          id: 'vermont-vision-athens',
          name: 'Vermont/Athens',
          lat: 33.9283,
          lon: -118.2916,
          status: 'vision',
          role: 'terminal',
          existingLines: ['Green'],
          confidence: 'low'
        }
      ],
      provenance: [
        {
          sourceId: 'velorail-vision-seed',
          title: 'VeloRail visionary overlay seed example',
          sourceType: 'internal_example',
          publisher: 'VeloRail',
          accessedAt: '2026-05-05',
          note: 'Illustrative concept record for schema and renderer development; not an approved project.'
        }
      ],
      confidence: {
        level: 'low',
        geometry: 'low',
        stations: 'low',
        status: 'medium',
        notes: 'Visionary example intended to exercise unofficial proposal fields.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'Internal VeloRail seed concept used for visionary overlay testing; it is not derived from an approved agency project.',
        assumptions: [
          'Station list is illustrative.',
          'Alignment is a conceptual corridor sketch.'
        ],
        disclaimer: 'Unofficial VeloRail scenario. Not an approved agency project or Google Maps transit route.'
      },
      style: {
        strokeColor: '#db2777',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
        stationFillColor: '#db2777',
        legendLabel: 'Visionary concept'
      },
      rendering: {
        layerGroup: 'visionary',
        minZoom: 10,
        clickable: true
      },
      notes: 'Display with clear unofficial or visionary language.',
      tags: ['visionary', 'concept', 'north-south']
    },
    {
      id: 'freight-alameda-corridor',
      name: 'Alameda Corridor Freight Corridor',
      shortName: 'Alameda Corridor',
      kind: 'corridor',
      status: 'freight_only',
      mode: 'freight_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Simplified corridor centerline for freight schema coverage.',
        coordinates: [
          [-118.2280, 34.0190],
          [-118.2370, 33.9820],
          [-118.2390, 33.9290],
          [-118.2380, 33.8750],
          [-118.2410, 33.8100],
          [-118.2630, 33.7490]
        ]
      },
      provenance: [
        {
          sourceId: 'acta-corridor-overview',
          title: 'Alameda Corridor public corridor overview',
          sourceType: 'public_agency',
          publisher: 'Alameda Corridor Transportation Authority',
          url: 'https://www.acta.org/',
          accessedAt: '2026-05-05',
          note: 'Seed geometry is approximate and must be replaced by a sourced freight dataset in VR-402.'
        }
      ],
      confidence: {
        level: 'medium',
        geometry: 'low',
        status: 'high',
        notes: 'Corridor identity is public; geometry is a simplified placeholder for model validation.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Public ACTA corridor materials establish the corridor identity; seed geometry is a simplified centerline and passenger suitability is deferred.',
        disclaimer: 'Freight corridor record with simplified VeloRail geometry; do not imply passenger service.'
      },
      style: {
        strokeColor: '#64748b',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
        legendLabel: 'Freight corridor'
      },
      rendering: {
        layerGroup: 'freight',
        minZoom: 9,
        clickable: true
      },
      freight: {
        owner: 'Alameda Corridor Transportation Authority',
        operator: 'BNSF Railway / Union Pacific Railroad',
        trackUsage: 'freight',
        electrification: 'unknown',
        ownershipSourceId: 'acta-corridor-overview',
        usageSourceId: 'acta-corridor-overview',
        electrificationSourceId: 'acta-corridor-overview',
        conversionScenarioId: 'alameda-corridor-regional-passenger-conversion',
        conversionScenarios: [
          {
            id: 'alameda-corridor-regional-passenger-conversion',
            name: 'Alameda Corridor regional passenger conversion concept',
            status: 'converted_passenger',
            targetMode: 'commuter_rail',
            sourceFreightCorridorId: 'freight-alameda-corridor',
            serviceConcept: 'Hypothetical regional passenger overlay sharing or converting the freight corridor right-of-way.',
            stationAssumptions: [
              'Stations are not defined in VR-401.',
              'Future scenario work must identify stations separately with provenance and uncertainty.'
            ],
            assumptions: [
              'Freight ownership and operations remain source metadata on the corridor record.',
              'Passenger service is a hypothetical conversion concept, not an official plan.'
            ],
            notes: 'VR-405 should define any concrete passenger line records that inherit this corridor geometry.'
          }
        ],
        suitability: {
          rating: 'unknown',
          factors: [
            {
              factor: 'right-of-way continuity',
              effect: 'positive',
              note: 'The corridor is modeled as a continuous freight right-of-way for overlay and conversion planning.'
            },
            {
              factor: 'station feasibility',
              effect: 'unknown',
              note: 'Station locations, passenger access, and platform feasibility are not assessed in VR-401.'
            }
          ],
          notes: 'VR-406 should replace this placeholder suitability metadata with a documented scoring method.'
        },
        suitabilityNotes: 'Suitability is intentionally unknown until VR-406 defines scoring inputs and weights.'
      },
      notes: 'Freight-only example record; do not imply passenger service.',
      tags: ['freight', 'nationalized-rail', 'corridor']
    }
  ]
};

export const VALIDATED_TRANSIT_PROPOSALS = assertValidTransitProposalDataset(TRANSIT_PROPOSAL_DATASET);

export function proposalPathToGoogleLatLng(proposal: TransitProposal): google.maps.LatLngLiteral[] {
  return proposal.geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon }));
}

export function proposalStationsToGoogleMarkers(proposal: TransitProposal): ProposalMarkerInput[] {
  return (proposal.stations ?? []).map((station: ProposalStation) => ({
    id: station.id,
    title: station.name,
    position: { lat: station.lat, lng: station.lon },
    status: station.status ?? proposal.status,
    proposalId: proposal.id,
    role: station.role,
    openingYear: station.openingYear,
    phase: station.phase,
    confidence: station.confidence,
    notes: station.notes
  }));
}

export function proposalToGooglePolylineInput(proposal: TransitProposal): ProposalPolylineInput {
  const style = { ...DEFAULT_STYLE, ...proposal.style };

  return {
    id: `${proposal.id}-polyline`,
    proposalId: proposal.id,
    status: proposal.status,
    path: proposalPathToGoogleLatLng(proposal),
    options: {
      path: proposalPathToGoogleLatLng(proposal),
      strokeColor: style.strokeColor,
      strokeOpacity: style.strokeOpacity,
      strokeWeight: style.strokeWeight,
      zIndex: style.zIndex,
      clickable: proposal.rendering?.clickable ?? true
    }
  };
}

export function proposalDatasetToGoogleMapInputs(dataset: TransitProposalDataset = VALIDATED_TRANSIT_PROPOSALS) {
  return dataset.proposals.map((proposal) => ({
    proposal,
    polyline: proposalToGooglePolylineInput(proposal),
    markers: proposalStationsToGoogleMarkers(proposal)
  }));
}
