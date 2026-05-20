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
    'Refresh accessedAt only after reviewing the cited source or internal scenario note.',
    'For video-derived or commentary-derived ideas, summarize only the concept and cite the source instead of copying transcript text.',
    'Record reusable review decisions in repo docs and update the relevant Linear plan when geometry, schema, or map-layer contracts change.'
  ]
} as const;

export const VISIONARY_TRANSIT_PROPOSAL_DATASET: TransitProposalDataset = assertValidVisionaryTransitProposalDataset({
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: VISIONARY_TRANSIT_REVIEWED_AT,
  migrationNotes: [
    'VR-202/VR-203 dedicated visionary registry. Records are unofficial concepts rendered through the Vision overlay, not the Future Transit overlay.',
    'VR-205 adds a bounded initial LA visionary bundle using internal scenario records with explicit uncertainty and source notes.',
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
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
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
    },
    {
      id: 'vision-westside-crosstown-rail',
      name: 'Westside Crosstown Rail Vision',
      shortName: 'Westside Crosstown Vision',
      kind: 'line',
      status: 'vision',
      mode: 'light_rail',
      classification: 'speculative',
      geometry: {
        type: 'LineString',
        geometrySource: 'conceptual',
        geometryNotes: 'Rough VeloRail-authored crosstown sketch from Hollywood through West Hollywood and Century City toward Westwood. Not sourced survey geometry.',
        coordinates: [
          [-118.3387, 34.1016],
          [-118.3617, 34.0900],
          [-118.3865, 34.0836],
          [-118.4140, 34.0610],
          [-118.4450, 34.0630]
        ]
      },
      stations: [
        {
          id: 'westside-crosstown-hollywood',
          name: 'Hollywood crosstown',
          lat: 34.1016,
          lon: -118.3387,
          status: 'vision',
          role: 'terminal',
          confidence: 'low',
          notes: 'Scenario anchor near the Hollywood travel market, not a proposed station site.'
        },
        {
          id: 'westside-crosstown-weho',
          name: 'West Hollywood',
          lat: 34.0900,
          lon: -118.3617,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'westside-crosstown-beverly',
          name: 'Beverly Grove',
          lat: 34.0836,
          lon: -118.3865,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'westside-crosstown-century-city',
          name: 'Century City interface',
          lat: 34.0610,
          lon: -118.4140,
          status: 'vision',
          role: 'transfer',
          confidence: 'low',
          notes: 'Transfer role is conceptual and does not imply an approved connection.'
        },
        {
          id: 'westside-crosstown-westwood',
          name: 'Westwood crosstown',
          lat: 34.0630,
          lon: -118.4450,
          status: 'vision',
          role: 'terminal',
          confidence: 'low'
        }
      ],
      provenance: [
        {
          sourceId: 'velorail-westside-crosstown-vision-note',
          title: 'VeloRail Westside crosstown rail vision registry example',
          sourceType: 'internal_example',
          publisher: 'VeloRail',
          accessedAt: VISIONARY_TRANSIT_REVIEWED_AT,
          note: 'Internal scenario record for a recurring east-west crosstown travel market. VeloRail authored the concept, stations, and rough geometry; no Google Maps source evidence is used.'
        }
      ],
      confidence: {
        level: 'low',
        geometry: 'low',
        stations: 'low',
        status: 'medium',
        notes: 'Scenario sketch for overlay exploration only.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'The source establishes only that this is a VeloRail-authored registry example. Alignment, station, and service details are assumptions.',
        assumptions: [
          'Station anchors represent travel markets rather than platform locations.',
          'The checked-in line is a crosstown corridor sketch, not right-of-way selection.',
          'No agency has approved, funded, or adopted this record as a project.'
        ],
        disclaimer: 'Speculative VeloRail scenario. Not an approved agency project, funded project, or Google Maps transit route.'
      },
      style: {
        strokeColor: '#be185d',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
        stationFillColor: '#be185d',
        stationStrokeColor: '#831843',
        stationScale: 4.75,
        legendLabel: 'Speculative westside crosstown vision'
      },
      rendering: {
        layerGroup: 'visionary',
        minZoom: 9,
        clickable: true
      },
      notes: 'Editorial note: use this as a bounded VR-205 bundle concept. Treat the line and station anchors as speculative VeloRail assumptions.',
      tags: ['visionary', 'speculative', 'westside', 'crosstown', 'vr-205']
    },
    {
      id: 'vision-valley-orbital-rail',
      name: 'San Fernando Valley Orbital Rail Vision',
      shortName: 'Valley Orbital Vision',
      kind: 'line',
      status: 'vision',
      mode: 'light_rail',
      classification: 'speculative',
      geometry: {
        type: 'LineString',
        geometrySource: 'conceptual',
        geometryNotes: 'Rough VeloRail-authored valley orbital sketch connecting North Hollywood, Van Nuys, Reseda, Warner Center, and Burbank travel markets. Not sourced survey geometry.',
        coordinates: [
          [-118.3768, 34.1684],
          [-118.4487, 34.1899],
          [-118.5364, 34.2011],
          [-118.6016, 34.1808],
          [-118.3089, 34.1808],
          [-118.3768, 34.1684]
        ]
      },
      stations: [
        {
          id: 'valley-orbital-noho',
          name: 'North Hollywood orbital',
          lat: 34.1684,
          lon: -118.3768,
          status: 'vision',
          role: 'transfer',
          confidence: 'low',
          existingLines: ['B Line', 'G Line']
        },
        {
          id: 'valley-orbital-van-nuys',
          name: 'Van Nuys civic',
          lat: 34.1899,
          lon: -118.4487,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'valley-orbital-reseda',
          name: 'Reseda corridor',
          lat: 34.2011,
          lon: -118.5364,
          status: 'vision',
          role: 'intermediate',
          confidence: 'low'
        },
        {
          id: 'valley-orbital-warner-center',
          name: 'Warner Center orbital',
          lat: 34.1808,
          lon: -118.6016,
          status: 'vision',
          role: 'terminal',
          confidence: 'low'
        },
        {
          id: 'valley-orbital-burbank',
          name: 'Burbank media district',
          lat: 34.1808,
          lon: -118.3089,
          status: 'vision',
          role: 'transfer',
          confidence: 'low',
          notes: 'Transfer role is a scenario assumption for regional connectivity.'
        }
      ],
      provenance: [
        {
          sourceId: 'velorail-valley-orbital-vision-note',
          title: 'VeloRail Valley orbital rail vision registry example',
          sourceType: 'internal_example',
          publisher: 'VeloRail',
          accessedAt: VISIONARY_TRANSIT_REVIEWED_AT,
          note: 'Internal scenario record for valley crosstown and orbital travel markets. VeloRail authored the concept, stations, and rough geometry; no Google Maps source evidence is used.'
        }
      ],
      confidence: {
        level: 'low',
        geometry: 'low',
        stations: 'low',
        status: 'medium',
        notes: 'Scenario sketch for overlay exploration only.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'The source establishes only that this is a VeloRail-authored registry example. Alignment, station, and service details are assumptions.',
        assumptions: [
          'The orbital shape is a map-scale travel-market sketch.',
          'Station anchors are selected to make the scenario legible, not to select right-of-way.',
          'No agency has approved, funded, or adopted this record as a project.'
        ],
        disclaimer: 'Speculative VeloRail scenario. Not an approved agency project, funded project, or Google Maps transit route.'
      },
      style: {
        strokeColor: '#9f1239',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
        stationFillColor: '#9f1239',
        stationStrokeColor: '#881337',
        stationScale: 4.75,
        legendLabel: 'Speculative valley orbital vision'
      },
      rendering: {
        layerGroup: 'visionary',
        minZoom: 9,
        clickable: true
      },
      notes: 'Editorial note: use this as a bounded VR-205 bundle concept. Treat the orbital shape and station anchors as speculative VeloRail assumptions.',
      tags: ['visionary', 'speculative', 'san-fernando-valley', 'orbital', 'vr-205']
    }
  ]
});
