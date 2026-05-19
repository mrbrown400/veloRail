import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  ProposalClassificationCategory,
  ProposalStatus,
  TransitProposalDataset
} from '@/types/proposals';
import { assertValidVisionaryTransitProposalDataset } from './transitProposalValidation';

const VISIONARY_TRANSIT_REVIEWED_AT = '2026-05-19';
const VISIONARY_ALLOWED_CLASSIFICATIONS = [
  'commentary_summary',
  'advocacy_derived',
  'speculative'
] as const satisfies readonly ProposalClassificationCategory[];
const VISIONARY_ALLOWED_STATUSES = [
  'vision',
  'concept'
] as const satisfies readonly ProposalStatus[];

export const VISIONARY_TRANSIT_PROPOSAL_REGISTRY_POLICY = {
  datasetId: 'visionary-transit-proposals',
  sourceName: 'visionary-transit-proposals.v1.ts',
  lastReviewedAt: VISIONARY_TRANSIT_REVIEWED_AT,
  allowedClassifications: VISIONARY_ALLOWED_CLASSIFICATIONS,
  allowedStatuses: VISIONARY_ALLOWED_STATUSES,
  geometryPolicy: [
    'Use conceptual or approximate geometry only.',
    'Keep coordinates coarse enough to read as a scenario sketch, not surveyed alignment data.',
    'Do not copy Google Maps basemap linework or treat Google Maps as evidence for custom geometry.'
  ],
  sourceLinkingPolicy: [
    'Link to the commentary, advocacy, public writing, or internal scenario note that justifies the record.',
    'For internally authored concepts with no external proponent, use sourceType internal_example and leave url unset.',
    'Do not cite Google Maps as source evidence for visionary proposal geometry.',
    'Source notes must identify which facts came from the source and which geometry, station, or service assumptions VeloRail added.'
  ],
  editorialReview: [
    'Use speculative language in names, notes, legends, and disclaimers.',
    'Keep official future projects in the official future dataset, not this registry.',
    'Refresh accessedAt only after reviewing the cited source or internal scenario note.'
  ]
} as const;

export const VISIONARY_TRANSIT_PROPOSAL_DATASET: TransitProposalDataset = assertValidVisionaryTransitProposalDataset({
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: VISIONARY_TRANSIT_REVIEWED_AT,
  migrationNotes: [
    'VR-202/VR-203 dedicated visionary registry. Records are unofficial concepts rendered through the Vision overlay, not the Future Transit overlay.',
    'Geometry is rough scenario geometry for Google Maps polyline rendering. Google Maps is the renderer only and is not used as source evidence.',
    'The registry policy in this module defines source-linking, uncertainty, and editorial review rules for new visionary concepts.'
  ],
  proposals: [
    {
      id: 'vision-la-river-rail',
      name: 'Los Angeles River Rail Vision',
      shortName: 'LA River Rail Vision',
      kind: 'line',
      status: 'vision',
      mode: 'light_rail',
      classification: 'speculative',
      geometry: {
        type: 'LineString',
        geometrySource: 'conceptual',
        geometryNotes: 'Rough VeloRail-authored corridor sketch following the Los Angeles River travel market from Glendale/Atwater through Union Station toward Long Beach. Not sourced survey geometry.',
        coordinates: [
          [-118.2606, 34.1526],
          [-118.2705, 34.1173],
          [-118.2437, 34.0560],
          [-118.2230, 34.0090],
          [-118.2050, 33.9500],
          [-118.1965, 33.8750],
          [-118.1892, 33.7701]
        ]
      },
      stations: [
        {
          id: 'la-river-vision-glendale',
          name: 'Glendale Narrows',
          lat: 34.1526,
          lon: -118.2606,
          status: 'vision',
          role: 'terminal',
          confidence: 'low',
          notes: 'Illustrative northern anchor for the corridor sketch.'
        },
        {
          id: 'la-river-vision-atwater',
          name: 'Atwater Village',
          lat: 34.1173,
          lon: -118.2705,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'la-river-vision-union-station',
          name: 'Union Station Riverfront',
          lat: 34.0560,
          lon: -118.2437,
          status: 'vision',
          role: 'transfer',
          confidence: 'medium',
          existingLines: ['A Line', 'B Line', 'D Line', 'J Line', 'Metrolink', 'Amtrak'],
          notes: 'Transfer anchor is conceptual and does not imply an approved station site.'
        },
        {
          id: 'la-river-vision-vernon',
          name: 'Vernon Riverfront',
          lat: 34.0090,
          lon: -118.2230,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'la-river-vision-south-gate',
          name: 'South Gate',
          lat: 33.9500,
          lon: -118.2050,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'la-river-vision-long-beach',
          name: 'Long Beach River Gateway',
          lat: 33.7701,
          lon: -118.1892,
          status: 'vision',
          role: 'terminal',
          confidence: 'low',
          notes: 'Terminal point is a scenario anchor, not a proposed project location.'
        }
      ],
      provenance: [
        {
          sourceId: 'velorail-la-river-vision-note',
          title: 'VeloRail LA River rail vision registry example',
          sourceType: 'internal_example',
          publisher: 'VeloRail',
          accessedAt: VISIONARY_TRANSIT_REVIEWED_AT,
          note: 'Internal scenario record created to exercise the dedicated visionary registry. VeloRail authored the concept, station anchors, and rough geometry; no Google Maps source evidence is used.'
        }
      ],
      confidence: {
        level: 'low',
        geometry: 'low',
        stations: 'low',
        status: 'medium',
        notes: 'The record is an editorial scenario example. It is useful for overlay behavior, not as a project claim.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'The source establishes only that this is a VeloRail-authored registry example. All alignment, station, and service details are scenario assumptions.',
        assumptions: [
          'Station anchors are selected to make the corridor legible at regional map scale.',
          'The checked-in line generalizes a travel market rather than a right-of-way.',
          'No agency has approved, funded, or adopted this record as a project.'
        ],
        disclaimer: 'Speculative VeloRail scenario. Not an approved agency project, funded project, or Google Maps transit route.'
      },
      style: {
        strokeColor: '#be123c',
        strokeOpacity: 0.72,
        strokeWeight: 5,
        strokePattern: 'dashed',
        stationFillColor: '#be123c',
        stationStrokeColor: '#881337',
        stationScale: 4.75,
        legendLabel: 'Speculative river rail vision'
      },
      rendering: {
        layerGroup: 'visionary',
        minZoom: 9,
        clickable: true
      },
      notes: 'Editorial note: label this record as a speculative VeloRail scenario wherever metadata is shown. Do not merge it into official future transit or cite the Google basemap as provenance.',
      tags: ['visionary', 'speculative', 'la-river', 'vr-202', 'vr-203']
    }
  ]
});
