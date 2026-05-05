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
  strokeWeight: 5,
  stationFillColor: '#2563eb',
  stationStrokeColor: '#ffffff',
  stationScale: 5,
  zIndex: 20
};

export const TRANSIT_PROPOSAL_DATASET: TransitProposalDataset = {
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: '2026-05-05',
  migrationNotes: [
    'Existing TRANSIT_LINES records remain the operational routing source for VR-001.',
    'Proposal statuses use operational instead of the existing routing status operating; migration should map operating to operational when proposal records are derived from live service.',
    'Proposal geometry uses GeoJSON LineString coordinates in [lon, lat] order and converts to Google Maps {lat, lng} paths through adapter helpers.'
  ],
  proposals: [
    {
      id: 'metro-d-line-extension-westwood',
      name: 'D Line Extension to Westwood',
      shortName: 'D Line Westwood Extension',
      kind: 'line',
      status: 'under_construction',
      mode: 'heavy_rail',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Seed example follows station-to-station alignment points. Replace with official alignment geometry in the import pipeline.',
        coordinates: [
          [-118.3088, 34.0618],
          [-118.3440, 34.0621],
          [-118.3614, 34.0623],
          [-118.3769, 34.0625],
          [-118.4003, 34.0627],
          [-118.4172, 34.0553],
          [-118.4450, 34.0630],
          [-118.4527, 34.0505]
        ]
      },
      stations: [
        {
          id: 'd-line-wilshire-western',
          name: 'Wilshire/Western',
          lat: 34.0618,
          lon: -118.3088,
          status: 'operational',
          role: 'transfer',
          existingLines: ['Purple'],
          notes: 'Connection to current D Line service.'
        },
        {
          id: 'd-line-wilshire-la-brea',
          name: 'Wilshire/La Brea',
          lat: 34.0621,
          lon: -118.3440,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2025,
          phase: 'Section 2'
        },
        {
          id: 'd-line-wilshire-fairfax',
          name: 'Wilshire/Fairfax',
          lat: 34.0623,
          lon: -118.3614,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2025,
          phase: 'Section 2'
        },
        {
          id: 'd-line-wilshire-la-cienega',
          name: 'Wilshire/La Cienega',
          lat: 34.0625,
          lon: -118.3769,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2025,
          phase: 'Section 2'
        },
        {
          id: 'd-line-wilshire-rodeo',
          name: 'Wilshire/Rodeo',
          lat: 34.0627,
          lon: -118.4003,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2027,
          phase: 'Section 3'
        },
        {
          id: 'd-line-century-city',
          name: 'Century City/Constellation',
          lat: 34.0553,
          lon: -118.4172,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2027,
          phase: 'Section 3'
        },
        {
          id: 'd-line-westwood-ucla',
          name: 'Westwood/UCLA',
          lat: 34.0630,
          lon: -118.4450,
          status: 'under_construction',
          role: 'transfer',
          openingYear: 2027,
          phase: 'Section 3',
          existingLines: ['Sepulveda Transit Corridor']
        },
        {
          id: 'd-line-westwood-va',
          name: 'Westwood/VA Hospital',
          lat: 34.0505,
          lon: -118.4527,
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
          accessedAt: '2026-05-05',
          note: 'Seed example uses approximate station points already present in the app.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'medium',
        stations: 'high',
        status: 'high',
        notes: 'Project and station list are official; geometry is simplified for schema coverage.'
      },
      timeline: {
        openingYear: 2027,
        phase: 'Sections 2 and 3',
        phaseOrder: 2
      },
      style: {
        strokeColor: '#A05DA5',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        stationFillColor: '#A05DA5',
        legendLabel: 'Future heavy rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      tags: ['future', 'metro', 'heavy-rail']
    },
    {
      id: 'vision-vermont-rapid-rail',
      name: 'Vermont Avenue Rapid Rail Vision',
      shortName: 'Vermont Rapid Rail',
      kind: 'line',
      status: 'vision',
      mode: 'heavy_rail',
      geometry: {
        type: 'LineString',
        geometrySource: 'conceptual',
        geometryNotes: 'Conceptual north-south line for visionary overlay testing.',
        coordinates: [
          [-118.2923, 34.0984],
          [-118.2917, 34.0617],
          [-118.2916, 34.0182],
          [-118.2917, 33.9290]
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
          lat: 34.0182,
          lon: -118.2916,
          status: 'vision',
          role: 'transfer',
          existingLines: ['Expo'],
          confidence: 'low'
        },
        {
          id: 'vermont-vision-athens',
          name: 'Vermont/Athens',
          lat: 33.9290,
          lon: -118.2917,
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
      style: {
        strokeColor: '#db2777',
        strokeOpacity: 0.72,
        strokeWeight: 5,
        strokePattern: 'dashed',
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
      style: {
        strokeColor: '#64748b',
        strokeOpacity: 0.75,
        strokeWeight: 4,
        strokePattern: 'dotted',
        legendLabel: 'Freight corridor'
      },
      rendering: {
        layerGroup: 'freight',
        minZoom: 9,
        clickable: true
      },
      freight: {
        owner: 'Alameda Corridor Transportation Authority',
        trackUsage: 'freight',
        electrification: 'unknown',
        suitabilityNotes: 'Passenger conversion suitability is intentionally deferred to VR-401 and VR-406.'
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
    role: station.role
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
