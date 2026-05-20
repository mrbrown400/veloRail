import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  ProposalSourceType,
  TransitProposalDataset
} from '@/types/proposals';
import type {
  OfficialFutureTransitDriftCheck,
  OfficialFutureTransitSourceWatchTarget
} from './transitProposalValidation';

const OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT = '2026-05-19';
const OFFICIAL_FUTURE_TRANSIT_NEXT_REVIEW_DUE = '2026-08-17';
const OFFICIAL_FUTURE_TRANSIT_REVIEW_CADENCE_DAYS = 90;
const OFFICIAL_FUTURE_TRANSIT_STALE_AFTER_DAYS = 120;
const OFFICIAL_FUTURE_TRANSIT_REQUIRED_STATUSES = [
  'planned',
  'funded',
  'under_construction'
] as const;
const OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS = [
  'project_status',
  'opening_year',
  'station_list',
  'source_url',
  'geometry_notes'
] satisfies OfficialFutureTransitDriftCheck[];

export const OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY = {
  datasetId: 'official-la-future-transit',
  sourceName: 'official-la-future-transit.v1.ts',
  lastReviewedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
  nextReviewDue: OFFICIAL_FUTURE_TRANSIT_NEXT_REVIEW_DUE,
  reviewCadenceDays: OFFICIAL_FUTURE_TRANSIT_REVIEW_CADENCE_DAYS,
  staleAfterDays: OFFICIAL_FUTURE_TRANSIT_STALE_AFTER_DAYS,
  allowedRenderableStatuses: OFFICIAL_FUTURE_TRANSIT_REQUIRED_STATUSES,
  reviewChecklist: [
    'Re-check each official source URL before changing project facts.',
    'Compare status, opening year, project phase, station list or representative station anchors, source URL, and geometry notes.',
    'Update provenance accessedAt only after human review of the cited public source.',
    'Keep advocacy, commentary, and speculative records out of the official future layer.'
  ]
} as const;

function officialFutureWatchTarget(
  proposalId: string,
  sourceId: string,
  label: string,
  publisher: string,
  sourceType: ProposalSourceType,
  url: string,
  driftChecks: readonly OfficialFutureTransitDriftCheck[],
  note: string
): OfficialFutureTransitSourceWatchTarget {
  return {
    proposalId,
    sourceId,
    label,
    publisher,
    sourceType,
    url,
    lastReviewedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
    nextReviewDue: OFFICIAL_FUTURE_TRANSIT_NEXT_REVIEW_DUE,
    reviewCadenceDays: OFFICIAL_FUTURE_TRANSIT_REVIEW_CADENCE_DAYS,
    driftChecks,
    note
  };
}

export const OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS = [
  officialFutureWatchTarget(
    'metro-east-san-fernando-valley-lrt',
    'metro-east-sfv-project-page',
    'East San Fernando Valley Light Rail Transit project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/east-sfv/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for project status, opening year, corridor, station count, and named station areas.'
  ),
  officialFutureWatchTarget(
    'metro-east-san-fernando-valley-lrt',
    'metro-esfv-construction-notice',
    'East San Fernando Valley construction notices',
    'LA Metro The Source',
    'public_agency',
    'https://thesource.metro.net/upcoming-directional-closures-on-van-nuys-boulevard-for-work-on-east-san-fernando-valley-light-rail-project/',
    ['project_status', 'source_url'],
    'Secondary source for active construction status and corridor work notices.'
  ),
  officialFutureWatchTarget(
    'metro-southeast-gateway-line',
    'metro-southeast-gateway-project-page',
    'Southeast Gateway Line project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/southeastgateway/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for design status, completion target, station count, and published station areas.'
  ),
  officialFutureWatchTarget(
    'metro-k-line-extension-torrance',
    'metro-k-line-extension-project-page',
    'K Line Extension to Torrance project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/k-line-extension-to-torrance/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for approved alignment option, funding status, station count, and completion target.'
  ),
  officialFutureWatchTarget(
    'metro-k-line-northern-extension',
    'metro-k-line-northern-extension-project-page',
    'K Line Northern Extension project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/kline-northern-extension/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for planning status, selected LPA, route length, station count, opening range, and transfer lines.'
  ),
  officialFutureWatchTarget(
    'metro-sepulveda-transit-corridor-valley-westside',
    'metro-sepulveda-transit-corridor-project-page',
    'Sepulveda Transit Corridor project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/sepulvedacorridor/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for LPA status, selected Valley-Westside route, phase refinement, and environmental review status.'
  ),
  officialFutureWatchTarget(
    'metro-sepulveda-transit-corridor-valley-westside',
    'metro-sepulveda-lpa-media-release',
    'Metro Board initial approval for Sepulveda Pass corridor',
    'Los Angeles County Metropolitan Transportation Authority',
    'public_agency',
    'https://www.metro.net/about/metro-boards-initial-approval-sets-stage-for-generational-transformation-of-sepulveda-pass-corridor/',
    ['project_status', 'station_list', 'source_url', 'geometry_notes'],
    'Secondary source for Board-selected underground heavy rail LPA, major transfer connections, and travel-time claims.'
  ),
  officialFutureWatchTarget(
    'metro-sepulveda-transit-corridor-westside-lax',
    'metro-sepulveda-westside-lax-measure-m-board-report',
    'Metro Measure M Sepulveda Westside-LAX board report',
    'Los Angeles County Metropolitan Transportation Authority',
    'public_plan',
    'https://metro.legistar.com/LegislationDetail.aspx?FullText=1&GUID=43869F50-9A8C-478A-AC2C-3D653F8231BC&ID=4539342&Options=&Search=',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for the official long-range Westside-LAX segment, Measure M phasing, and planned 2057-2059 opening window.'
  ),
  officialFutureWatchTarget(
    'metro-eastside-transit-corridor-phase-2',
    'metro-eastside-phase-2-project-page',
    'Eastside Transit Corridor Phase 2 project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/eastside_phase2/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for phase status, federal review, opening range, and station list.'
  ),
  officialFutureWatchTarget(
    'metro-noho-pasadena-brt',
    'metro-noho-pasadena-project-page',
    'North Hollywood to Pasadena BRT project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/noho-pasadena-corridor/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for construction status, service target, corridor communities, and station count.'
  ),
  officialFutureWatchTarget(
    'metro-vermont-brt',
    'metro-vermont-corridor-project-page',
    'Vermont Transit Corridor project page',
    'Los Angeles County Metropolitan Transportation Authority',
    'official_project',
    'https://www.metro.net/projects/vermont-corridor/',
    OFFICIAL_FUTURE_PRIMARY_DRIFT_CHECKS,
    'Primary source for LPA status, BRT opening target, transfer anchors, and rail-conversion boundary notes.'
  )
] as const;

export const OFFICIAL_FUTURE_TRANSIT_DISCOVERY_TARGETS = [
  {
    id: 'metro-projects-listing',
    label: 'Metro project listing',
    publisher: 'Los Angeles County Metropolitan Transportation Authority',
    url: 'https://www.metro.net/projects-listing/',
    note: 'Broad project discovery page for newly listed Metro rail, BRT, and transit corridor projects.'
  },
  {
    id: 'metro-source-projects',
    label: 'LA Metro The Source projects feed',
    publisher: 'LA Metro The Source',
    url: 'https://thesource.metro.net/projects/',
    note: 'Agency news feed that often announces Board actions, project milestones, and new public review periods.'
  }
] as const;

export const OFFICIAL_LA_FUTURE_TRANSIT_DATASET: TransitProposalDataset = {
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
  migrationNotes: [
    'Official LA-area future transit batch. Sources are Metro official project pages, public agency notices, and Metro board materials checked on 2026-05-19.',
    'Geometry is simplified corridor geometry for Google Maps rendering and must not be treated as surveyed engineering alignment.',
    'Station records are retained as planning metadata where Metro publishes station areas, but proposal overlays do not display individual station dots by default.'
  ],
  proposals: [
    {
      id: 'metro-east-san-fernando-valley-lrt',
      name: 'East San Fernando Valley Light Rail Transit',
      shortName: 'East San Fernando Valley LRT',
      kind: 'line',
      status: 'under_construction',
      mode: 'light_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate centerline following Van Nuys Boulevard from the G Line to San Fernando Road. Not surveyed engineering geometry.',
        coordinates: [
          [-118.4486, 34.1689],
          [-118.4483, 34.1868],
          [-118.4480, 34.2013],
          [-118.4477, 34.2115],
          [-118.4382, 34.2410],
          [-118.4104, 34.2753]
        ]
      },
      stations: [
        {
          id: 'esfv-van-nuys-g-line',
          name: 'Van Nuys G Line Station',
          lat: 34.1689,
          lon: -118.4486,
          status: 'under_construction',
          role: 'terminal',
          openingYear: 2031,
          confidence: 'medium',
          existingLines: ['G Line'],
          notes: 'Approximate future LRT transfer area at the existing G Line station.'
        },
        {
          id: 'esfv-victory',
          name: 'Victory',
          lat: 34.1868,
          lon: -118.4483,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2031,
          confidence: 'medium'
        },
        {
          id: 'esfv-sherman-way',
          name: 'Sherman Way',
          lat: 34.2013,
          lon: -118.4480,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2031,
          confidence: 'medium'
        },
        {
          id: 'esfv-van-nuys-metrolink',
          name: 'Van Nuys Metrolink',
          lat: 34.2115,
          lon: -118.4477,
          status: 'under_construction',
          role: 'transfer',
          openingYear: 2031,
          confidence: 'medium',
          existingLines: ['Metrolink', 'Amtrak'],
          notes: 'Approximate transfer area cited by Metro as one of the planned station locations.'
        },
        {
          id: 'esfv-arleta',
          name: 'Arleta',
          lat: 34.2410,
          lon: -118.4382,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2031,
          confidence: 'low'
        },
        {
          id: 'esfv-san-fernando',
          name: 'San Fernando',
          lat: 34.2753,
          lon: -118.4104,
          status: 'under_construction',
          role: 'terminal',
          openingYear: 2031,
          confidence: 'medium',
          notes: 'Approximate Van Nuys Boulevard and San Fernando Road northern terminal area for the southern segment.'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-east-sfv-project-page',
          title: 'East San Fernando Valley Light Rail Transit',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/east-sfv/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the project in construction, with a 6.7-mile alignment, 11 stations, 2031 completion, and station areas including Van Nuys G Line, Victory, Sherman Way, Van Nuys Metrolink, Arleta, and San Fernando.'
        },
        {
          sourceId: 'metro-esfv-construction-notice',
          title: 'Upcoming directional closures on Van Nuys Boulevard for work on East San Fernando Valley Light Rail Project',
          sourceType: 'public_agency',
          publisher: 'LA Metro The Source',
          url: 'https://thesource.metro.net/upcoming-directional-closures-on-van-nuys-boulevard-for-work-on-east-san-fernando-valley-light-rail-project/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro construction notice confirms active utility work and the 6.7-mile line with 11 stations.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'medium',
        status: 'high',
        notes: 'Project status and station areas are official. Coordinates are VeloRail approximations.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro sources establish the project, status, corridor, station count, and selected station areas. VeloRail approximates the line and station coordinates from the named corridor.',
        assumptions: [
          'The checked-in station list is a representative subset of the eleven planned stations.',
          'Coordinates should be replaced by official GIS or engineering station coordinates when available.'
        ],
        disclaimer: 'Official project record with approximate VeloRail geometry.'
      },
      timeline: {
        openingYear: 2031,
        phase: 'Southern segment',
        phaseOrder: 1,
        scheduleNotes: 'Metro lists major construction from 2026 to 2031.'
      },
      style: {
        strokeColor: '#f97316',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        stationFillColor: '#f97316',
        legendLabel: 'Future light rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Included because the project is official, under construction, LA-area, and useful for the Future Transit overlay.',
      tags: ['future', 'metro', 'light-rail', 'san-fernando-valley', 'vr-105']
    },
    {
      id: 'metro-southeast-gateway-line',
      name: 'Southeast Gateway Line',
      shortName: 'Southeast Gateway',
      kind: 'line',
      status: 'planned',
      mode: 'light_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate corridor from the A Line at Slauson to Artesia using published station areas. Not surveyed alignment geometry.',
        coordinates: [
          [-118.2434, 33.9888],
          [-118.2140, 33.9735],
          [-118.1970, 33.9545],
          [-118.1760, 33.9142],
          [-118.1510, 33.9138],
          [-118.1630, 33.9020],
          [-118.1250, 33.8880],
          [-118.0825, 33.8677]
        ]
      },
      stations: [
        {
          id: 'southeast-gateway-slauson-a-line',
          name: 'Slauson/A Line',
          lat: 33.9888,
          lon: -118.2434,
          status: 'planned',
          role: 'transfer',
          openingYear: 2035,
          confidence: 'medium',
          existingLines: ['A Line']
        },
        {
          id: 'southeast-gateway-i-105-c-line',
          name: 'I-105/C Line Infill',
          lat: 33.9142,
          lon: -118.1760,
          status: 'planned',
          role: 'transfer',
          openingYear: 2035,
          confidence: 'low',
          existingLines: ['C Line'],
          notes: 'Metro describes one new C Line infill station at I-105; exact station coordinates are approximate.'
        },
        {
          id: 'southeast-gateway-paramount-rosecrans',
          name: 'Paramount/Rosecrans',
          lat: 33.9020,
          lon: -118.1630,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2035,
          confidence: 'medium'
        },
        {
          id: 'southeast-gateway-bellflower',
          name: 'Bellflower Blvd',
          lat: 33.8880,
          lon: -118.1250,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2035,
          confidence: 'medium'
        },
        {
          id: 'southeast-gateway-pioneer-artesia',
          name: 'Pioneer Station (Artesia)',
          lat: 33.8677,
          lon: -118.0825,
          status: 'planned',
          role: 'terminal',
          openingYear: 2035,
          confidence: 'medium'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-southeast-gateway-project-page',
          title: 'Southeast Gateway Line',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/southeastgateway/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the project in design, with 14.5 miles, nine new light rail stations, one C Line infill station, 2035 completion, and example station areas.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'medium',
        status: 'high',
        notes: 'Project and current phase are official. Station coordinates are approximate station areas.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro source establishes the project, status, completion estimate, station count, and several station areas. VeloRail approximates geometry from those published areas.',
        assumptions: [
          'Station list is intentionally partial because Metro marks station areas as subject to change in future design phases.',
          'The C Line infill marker is approximate until an official station name and coordinates are encoded.'
        ],
        disclaimer: 'Official project record with approximate VeloRail geometry.'
      },
      timeline: {
        openingYear: 2035,
        phase: 'Design',
        scheduleNotes: 'Metro lists estimated project completion as 2035.'
      },
      style: {
        strokeColor: '#14b8a6',
        strokeOpacity: 0.86,
        strokeWeight: 3,
        stationFillColor: '#14b8a6',
        legendLabel: 'Future light rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Included as an official designed light rail project with completed environmental milestones.',
      tags: ['future', 'metro', 'light-rail', 'gateway-cities', 'vr-105']
    },
    {
      id: 'metro-k-line-extension-torrance',
      name: 'K Line Extension to Torrance',
      shortName: 'K Line Torrance Extension',
      kind: 'line',
      status: 'planned',
      mode: 'light_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate Hawthorne Option geometry from Redondo Beach (Marine) to Torrance Transit Center via Hawthorne Boulevard and the Metro-owned right-of-way.',
        coordinates: [
          [-118.3698, 33.8936],
          [-118.3630, 33.8840],
          [-118.3528, 33.8722],
          [-118.3524, 33.8560],
          [-118.3426, 33.8333]
        ]
      },
      stations: [
        {
          id: 'k-line-redondo-beach-marine',
          name: 'Redondo Beach (Marine)',
          lat: 33.8936,
          lon: -118.3698,
          status: 'operational',
          role: 'transfer',
          confidence: 'medium',
          existingLines: ['C Line'],
          notes: 'Existing station and northern connection point for the planned extension.'
        },
        {
          id: 'k-line-south-bay-galleria',
          name: 'South Bay Galleria',
          lat: 33.8722,
          lon: -118.3528,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2036,
          confidence: 'medium',
          notes: 'Approximate station area along Hawthorne Boulevard.'
        },
        {
          id: 'k-line-torrance-transit-center',
          name: 'Torrance Transit Center',
          lat: 33.8333,
          lon: -118.3426,
          status: 'planned',
          role: 'terminal',
          openingYear: 2036,
          confidence: 'medium'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-k-line-extension-project-page',
          title: 'K Line Extension to Torrance',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/k-line-extension-to-torrance/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the 4.5-mile extension, two new stations, January 2026 Final EIR certification and Hawthorne Option approval, planning phase, and late 2036 completion pending funding.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'medium',
        stations: 'medium',
        status: 'high',
        notes: 'Alignment option and station areas are official; coordinates are simplified for map overlay display.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro source establishes the approved Hawthorne Option, route description, station count, and terminal station. VeloRail approximates line geometry and station coordinates.',
        assumptions: [
          'The South Bay Galleria station marker is approximate until an official GIS station point is added.',
          'The extension is encoded as planned because Metro says it is entering further planning and design and pursuing additional funding.'
        ],
        disclaimer: 'Official project record with approximate VeloRail geometry.'
      },
      timeline: {
        openingYear: 2036,
        phase: 'Planning and design',
        scheduleNotes: 'Metro lists late 2036 completion pending funding availability.'
      },
      style: {
        strokeColor: '#22c55e',
        strokeOpacity: 0.88,
        strokeWeight: 3,
        stationFillColor: '#22c55e',
        legendLabel: 'Future light rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      tags: ['future', 'metro', 'light-rail', 'south-bay', 'vr-105']
    },
    {
      id: 'metro-k-line-northern-extension',
      name: 'K Line Northern Extension',
      shortName: 'K Line North',
      kind: 'line',
      status: 'planned',
      mode: 'light_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate San Vicente-Fairfax LPA corridor from Expo/Crenshaw to Hollywood using Metro-published route description and major destination anchors. Not surveyed alignment geometry.',
        coordinates: [
          [-118.3352, 34.0220],
          [-118.3565, 34.0510],
          [-118.3612, 34.0623],
          [-118.3714, 34.0749],
          [-118.3800, 34.0835],
          [-118.3389, 34.1016],
          [-118.3390, 34.1122]
        ]
      },
      stations: [
        {
          id: 'k-line-north-expo-crenshaw',
          name: 'Expo/Crenshaw',
          lat: 34.0220,
          lon: -118.3352,
          status: 'operational',
          role: 'transfer',
          confidence: 'medium',
          existingLines: ['E Line', 'K Line'],
          notes: 'Existing K and E Line transfer station and southern connection point for the extension.'
        },
        {
          id: 'k-line-north-museum-row',
          name: 'Museum Row / Miracle Mile',
          lat: 34.0623,
          lon: -118.3612,
          status: 'planned',
          role: 'transfer',
          openingYear: 2049,
          confidence: 'low',
          existingLines: ['D Line'],
          notes: 'Representative anchor for Museum Row, Miracle Mile, and the D Line transfer area on the selected San Vicente-Fairfax alignment.'
        },
        {
          id: 'k-line-north-west-hollywood',
          name: 'West Hollywood / Santa Monica Boulevard',
          lat: 34.0835,
          lon: -118.3800,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2049,
          confidence: 'low',
          notes: 'Representative anchor for the Rainbow District and Santa Monica Boulevard corridor cited by Metro.'
        },
        {
          id: 'k-line-north-hollywood-highland',
          name: 'Hollywood/Highland',
          lat: 34.1016,
          lon: -118.3389,
          status: 'planned',
          role: 'transfer',
          openingYear: 2049,
          confidence: 'medium',
          existingLines: ['B Line'],
          notes: 'Representative B Line transfer area for the northern end of the selected alignment.'
        },
        {
          id: 'k-line-north-hollywood-bowl',
          name: 'Hollywood Bowl',
          lat: 34.1122,
          lon: -118.3390,
          status: 'planned',
          role: 'terminal',
          openingYear: 2049,
          confidence: 'low',
          notes: 'Metro states the selected route ultimately terminates at the Hollywood Bowl; coordinates are approximate.'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-k-line-northern-extension-project-page',
          title: 'K Line Northern Extension',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/kline-northern-extension/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the K Line Northern Extension in planning, with the Board-selected San Vicente-Fairfax LPA, about 10 miles of underground rail, ten new stations, and anticipated opening between 2047 and 2049.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'low',
        status: 'high',
        notes: 'Project, LPA selection, station count, and opening range are official. VeloRail station anchors are representative until Metro publishes final station coordinates.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro source establishes the project, selected LPA, underground rail mode, station count, and major destinations. VeloRail approximates route geometry and uses representative station anchors rather than a complete ten-station list.',
        assumptions: [
          'Opening year uses the later end of Metro listed 2047-2049 range for conservative display.',
          'Station records intentionally summarize major connection anchors and are not a complete station list.'
        ],
        disclaimer: 'Official project record with representative VeloRail geometry.'
      },
      timeline: {
        openingYear: 2049,
        phase: 'Planning and environmental review',
        scheduleNotes: 'Metro lists construction funding becoming available in 2041 and anticipated service between 2047 and 2049.'
      },
      style: {
        strokeColor: '#f59e0b',
        strokeOpacity: 0.88,
        strokeWeight: 3,
        stationFillColor: '#f59e0b',
        legendLabel: 'Future light rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Included because it is an official Metro planned K Line extension with a Board-selected LPA.',
      tags: ['future', 'metro', 'light-rail', 'k-line', 'central-la', 'hollywood']
    },
    {
      id: 'metro-sepulveda-transit-corridor-valley-westside',
      name: 'Sepulveda Transit Corridor Valley-Westside',
      shortName: 'Sepulveda Valley-Westside',
      kind: 'line',
      status: 'planned',
      mode: 'heavy_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate selected LPA corridor from Van Nuys Metrolink to Expo/Sepulveda, including the higher-priority G Line to D Line initial operating segment. Not surveyed engineering geometry.',
        coordinates: [
          [-118.4495, 34.1897],
          [-118.4486, 34.1689],
          [-118.4487, 34.1435],
          [-118.4440, 34.0705],
          [-118.4444, 34.0586],
          [-118.4410, 34.0450],
          [-118.4395, 34.0368]
        ]
      },
      stations: [
        {
          id: 'sepulveda-valley-westside-van-nuys-metrolink',
          name: 'Van Nuys Metrolink',
          lat: 34.1897,
          lon: -118.4495,
          status: 'planned',
          role: 'terminal',
          openingYear: 2035,
          phase: 'Full Valley-Westside LPA',
          confidence: 'medium',
          existingLines: ['Metrolink', 'Amtrak', 'East San Fernando Valley LRT'],
          notes: 'Northern endpoint of the Board-selected LPA; may follow the initial operating segment depending on phasing and funding.'
        },
        {
          id: 'sepulveda-valley-westside-van-nuys-g-line',
          name: 'Van Nuys G Line',
          lat: 34.1689,
          lon: -118.4486,
          status: 'planned',
          role: 'transfer',
          openingYear: 2035,
          phase: 'Initial Operating Segment',
          confidence: 'medium',
          existingLines: ['G Line', 'East San Fernando Valley LRT'],
          notes: 'Metro has prioritized connecting the San Fernando Valley at the G Line and ESFV Light Rail with the Westside at the D Line in the initial operating segment.'
        },
        {
          id: 'sepulveda-valley-westside-ventura',
          name: 'Ventura Boulevard',
          lat: 34.1435,
          lon: -118.4487,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2035,
          phase: 'Initial Operating Segment',
          confidence: 'low'
        },
        {
          id: 'sepulveda-valley-westside-ucla',
          name: 'UCLA',
          lat: 34.0705,
          lon: -118.4440,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2035,
          phase: 'Initial Operating Segment',
          confidence: 'low',
          notes: 'Representative UCLA campus station anchor.'
        },
        {
          id: 'sepulveda-valley-westside-westwood-ucla',
          name: 'Westwood/UCLA',
          lat: 34.0586,
          lon: -118.4444,
          status: 'planned',
          role: 'transfer',
          openingYear: 2035,
          phase: 'Initial Operating Segment',
          confidence: 'medium',
          existingLines: ['D Line']
        },
        {
          id: 'sepulveda-valley-westside-santa-monica',
          name: 'Santa Monica Boulevard',
          lat: 34.0450,
          lon: -118.4410,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2035,
          phase: 'Full Valley-Westside LPA',
          confidence: 'low'
        },
        {
          id: 'sepulveda-valley-westside-expo-sepulveda',
          name: 'Expo/Sepulveda',
          lat: 34.0368,
          lon: -118.4395,
          status: 'planned',
          role: 'terminal',
          openingYear: 2035,
          phase: 'Full Valley-Westside LPA',
          confidence: 'medium',
          existingLines: ['E Line']
        }
      ],
      provenance: [
        {
          sourceId: 'metro-sepulveda-transit-corridor-project-page',
          title: 'Sepulveda Transit Corridor',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/sepulvedacorridor/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the project in planning and environmental review and says the Board selected an underground heavy rail LPA between Van Nuys Metrolink and Expo/Sepulveda in January 2026.'
        },
        {
          sourceId: 'metro-sepulveda-lpa-media-release',
          title: 'Metro Board initial approval sets stage for generational transformation of Sepulveda Pass corridor',
          sourceType: 'public_agency',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/about/metro-boards-initial-approval-sets-stage-for-generational-transformation-of-sepulveda-pass-corridor/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro media release confirms the underground heavy rail LPA, Van Nuys to E Line connection, D/E/G/ESFV/Metrolink/UCLA connections, and continued design refinement.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'medium',
        status: 'high',
        notes: 'Board-selected LPA and major station areas are official. VeloRail geometry is approximate and phasing remains subject to refinement.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro sources establish the selected LPA, underground heavy rail mode, endpoint stations, transfer lines, and ongoing environmental review. Metro is still refining phasing, maintenance/storage approach, and design details.',
        assumptions: [
          'Opening year uses the Measure M Valley-Westside 2033-2035 planning window because Metro says an updated construction timeline will be shared later.',
          'The first operating segment is represented through station phase metadata instead of a separate overlapping line record.'
        ],
        disclaimer: 'Official project record with approximate VeloRail geometry and phasing notes.'
      },
      timeline: {
        openingYear: 2035,
        phase: 'Valley-Westside LPA with G Line to D Line initial operating segment',
        phaseOrder: 1,
        scheduleNotes: 'Metro current project page says the project is in planning and environmental review and that an updated construction timeline will be shared when available; Measure M identified Valley-Westside for 2033-2035.'
      },
      style: {
        strokeColor: '#fb923c',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        stationFillColor: '#fb923c',
        legendLabel: 'Future heavy rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Included because it is the official Metro Sepulveda Transit Corridor LPA selected by the Metro Board in January 2026.',
      tags: ['future', 'metro', 'heavy-rail', 'sepulveda', 'valley', 'westside']
    },
    {
      id: 'metro-sepulveda-transit-corridor-westside-lax',
      name: 'Sepulveda Transit Corridor Westside-LAX',
      shortName: 'Sepulveda Westside-LAX',
      kind: 'line',
      status: 'planned',
      mode: 'unknown',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate long-range Westside-LAX connection from Expo/Sepulveda to LAX/Metro Transit Center. Metro has official Measure M phasing for this segment, but no final alignment is encoded here.',
        coordinates: [
          [-118.4395, 34.0368],
          [-118.4330, 34.0190],
          [-118.4090, 34.0010],
          [-118.3970, 33.9595],
          [-118.3771, 33.9546]
        ]
      },
      stations: [
        {
          id: 'sepulveda-westside-lax-expo-sepulveda',
          name: 'Expo/Sepulveda',
          lat: 34.0368,
          lon: -118.4395,
          status: 'planned',
          role: 'transfer',
          openingYear: 2059,
          confidence: 'medium',
          existingLines: ['E Line', 'Sepulveda Transit Corridor Valley-Westside'],
          notes: 'Northern connection point from the selected Valley-Westside LPA into the long-range Westside-LAX segment.'
        },
        {
          id: 'sepulveda-westside-lax-culver-westside',
          name: 'Westside/Culver City area',
          lat: 34.0010,
          lon: -118.4090,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2059,
          confidence: 'low',
          notes: 'Representative intermediate anchor only; Metro has not finalized the Westside-LAX station list in the checked source.'
        },
        {
          id: 'sepulveda-westside-lax-lax-metro-transit-center',
          name: 'LAX/Metro Transit Center',
          lat: 33.9546,
          lon: -118.3771,
          status: 'planned',
          role: 'terminal',
          openingYear: 2059,
          confidence: 'medium',
          existingLines: ['C Line', 'K Line', 'LAX APM'],
          notes: 'Existing regional airport transit hub and official long-range target for the Sepulveda Westside-LAX segment.'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-sepulveda-westside-lax-measure-m-board-report',
          title: 'Sepulveda Transit Corridor board report',
          sourceType: 'public_plan',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://metro.legistar.com/LegislationDetail.aspx?FullText=1&GUID=43869F50-9A8C-478A-AC2C-3D653F8231BC&ID=4539342&Options=&Search=',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro board report describes the Measure M Sepulveda Transit Corridor implementation in two phases, with Valley-Westside by 2033-2035 and Westside-LAX by 2057-2059.'
        },
        {
          sourceId: 'metro-sepulveda-transit-corridor-project-page',
          title: 'Sepulveda Transit Corridor',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/sepulvedacorridor/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro current project page describes the corridor as connecting the Valley, Westside, and eventually LAX.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'low',
        status: 'medium',
        notes: 'The long-range segment and LAX target are official in Metro planning sources. Alignment, station list, technology, and schedule are lower confidence than the selected Valley-Westside LPA.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'Metro sources establish the official Westside-LAX segment and long-range Measure M timing, but no final alignment or station list is encoded in the current source set.',
        assumptions: [
          'Geometry is a broad corridor placeholder from Expo/Sepulveda toward LAX/Metro Transit Center.',
          'Opening year uses the later end of the 2057-2059 Measure M range for conservative display.',
          'Mode remains unknown until Metro selects technology and alignment for the Westside-LAX segment.'
        ],
        disclaimer: 'Official long-range project segment with conceptual VeloRail geometry.'
      },
      timeline: {
        openingYear: 2059,
        phase: 'Westside-LAX long-range segment',
        phaseOrder: 2,
        scheduleNotes: 'Metro Measure M documentation identifies the Westside-LAX extension for 2057-2059; current project work is focused on Valley-Westside planning and environmental review.'
      },
      style: {
        strokeColor: '#fdba74',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        strokePattern: 'dashed',
        stationFillColor: '#fdba74',
        legendLabel: 'Long-range future rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Included as official long-range Metro planning, with lower confidence than the Board-selected Valley-Westside LPA.',
      tags: ['future', 'metro', 'sepulveda', 'westside', 'lax', 'long-range']
    },
    {
      id: 'metro-eastside-transit-corridor-phase-2',
      name: 'Eastside Transit Corridor Phase 2',
      shortName: 'Eastside Phase 2',
      kind: 'line',
      status: 'planned',
      mode: 'light_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate E Line extension geometry from Atlantic to Lambert using Metro-published station areas.',
        coordinates: [
          [-118.1540, 34.0334],
          [-118.1537, 34.0245],
          [-118.1510, 34.0060],
          [-118.1050, 34.0150],
          [-118.0950, 33.9920],
          [-118.0720, 33.9450],
          [-118.0300, 33.9500]
        ]
      },
      stations: [
        {
          id: 'eastside-atlantic-existing',
          name: 'Atlantic',
          lat: 34.0334,
          lon: -118.1540,
          status: 'operational',
          role: 'transfer',
          confidence: 'medium',
          existingLines: ['E Line'],
          notes: 'Existing E Line terminus and extension connection point.'
        },
        {
          id: 'eastside-atlantic-whittier',
          name: 'Atlantic/Whittier',
          lat: 34.0245,
          lon: -118.1537,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2037,
          confidence: 'medium'
        },
        {
          id: 'eastside-commerce-citadel',
          name: 'Commerce/Citadel',
          lat: 34.0060,
          lon: -118.1510,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2037,
          confidence: 'medium'
        },
        {
          id: 'eastside-greenwood',
          name: 'Greenwood',
          lat: 34.0150,
          lon: -118.1050,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2037,
          phase: 'Phase 2A',
          confidence: 'medium'
        },
        {
          id: 'eastside-rosemead',
          name: 'Rosemead',
          lat: 33.9920,
          lon: -118.0950,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2037,
          phase: 'Phase 2B',
          confidence: 'medium'
        },
        {
          id: 'eastside-norwalk',
          name: 'Norwalk',
          lat: 33.9450,
          lon: -118.0720,
          status: 'planned',
          role: 'intermediate',
          openingYear: 2037,
          phase: 'Phase 2B',
          confidence: 'medium'
        },
        {
          id: 'eastside-lambert',
          name: 'Lambert',
          lat: 33.9500,
          lon: -118.0300,
          status: 'planned',
          role: 'terminal',
          openingYear: 2037,
          phase: 'Phase 2B',
          confidence: 'medium'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-eastside-phase-2-project-page',
          title: 'Eastside Transit Corridor Phase 2',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/eastside_phase2/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the nearly 9-mile E Line extension, planning phase, 2035-2037 completion for the initial segment pending funding, federal environmental review, and six planned station areas.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'medium',
        status: 'high',
        notes: 'Project and station areas are official. Coordinates are approximate station areas.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro source establishes the project scope, status, phasing, and six planned stations. VeloRail approximates geometry from the named station areas.',
        assumptions: [
          'Opening year uses the later end of Metro listed 2035-2037 range for conservative display.',
          'Phase 2A and 2B labels follow Metro description of the initial East LA to Montebello segment and later extension to Whittier.'
        ],
        disclaimer: 'Official project record with approximate VeloRail geometry.'
      },
      timeline: {
        openingYear: 2037,
        phase: 'Phase 2A and Phase 2B',
        scheduleNotes: 'Metro lists 2035-2037 for the initial segment pending funding and notes construction could begin as early as 2029.'
      },
      style: {
        strokeColor: '#06b6d4',
        strokeOpacity: 0.86,
        strokeWeight: 3,
        stationFillColor: '#06b6d4',
        legendLabel: 'Future light rail'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      tags: ['future', 'metro', 'light-rail', 'eastside', 'vr-105']
    },
    {
      id: 'metro-noho-pasadena-brt',
      name: 'North Hollywood to Pasadena Bus Rapid Transit',
      shortName: 'NoHo-Pasadena BRT',
      kind: 'line',
      status: 'under_construction',
      mode: 'brt',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate east-west BRT corridor through North Hollywood, Burbank, Glendale, Eagle Rock, and Pasadena.',
        coordinates: [
          [-118.3772, 34.1685],
          [-118.3090, 34.1808],
          [-118.2550, 34.1460],
          [-118.2110, 34.1380],
          [-118.1185, 34.1446]
        ]
      },
      stations: [
        {
          id: 'noho-pasadena-north-hollywood',
          name: 'North Hollywood',
          lat: 34.1685,
          lon: -118.3772,
          status: 'under_construction',
          role: 'terminal',
          openingYear: 2028,
          confidence: 'medium',
          existingLines: ['B Line', 'G Line']
        },
        {
          id: 'noho-pasadena-burbank',
          name: 'Burbank',
          lat: 34.1808,
          lon: -118.3090,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2028,
          confidence: 'low',
          notes: 'Representative station area for the Burbank segment.'
        },
        {
          id: 'noho-pasadena-glendale',
          name: 'Glendale',
          lat: 34.1460,
          lon: -118.2550,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2028,
          confidence: 'low',
          notes: 'Representative station area for the Glendale segment.'
        },
        {
          id: 'noho-pasadena-eagle-rock',
          name: 'Eagle Rock',
          lat: 34.1380,
          lon: -118.2110,
          status: 'under_construction',
          role: 'intermediate',
          openingYear: 2028,
          confidence: 'low'
        },
        {
          id: 'noho-pasadena-pasadena-city-college',
          name: 'Pasadena City College',
          lat: 34.1446,
          lon: -118.1185,
          status: 'under_construction',
          role: 'terminal',
          openingYear: 2028,
          confidence: 'medium'
        }
      ],
      provenance: [
        {
          sourceId: 'metro-noho-pasadena-project-page',
          title: 'North Hollywood to Pasadena Bus Rapid Transit',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/noho-pasadena-corridor/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the project in construction, with a 19-mile corridor, 22 enhanced stations, full construction in 2026-2027, and planned 2028 service.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'low',
        stations: 'low',
        status: 'high',
        notes: 'Project status and corridor communities are official. Coordinates are representative anchors, not a complete 22-station list.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Metro source establishes the project, construction status, corridor communities, 22 enhanced stations, and 2028 completion target. VeloRail uses representative station anchors until full station coordinates are added.',
        assumptions: [
          'Station markers are not the complete 22-station set.',
          'The line geometry intentionally simplifies street-running BRT segments.'
        ],
        disclaimer: 'Official project record with representative VeloRail geometry.'
      },
      timeline: {
        openingYear: 2028,
        phase: 'Construction',
        scheduleNotes: 'Metro states construction begins in 2026 and continues through late 2027, with service targeted for 2028.'
      },
      style: {
        strokeColor: '#ef4444',
        strokeOpacity: 0.86,
        strokeWeight: 3,
        stationFillColor: '#ef4444',
        legendLabel: 'Future BRT'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      tags: ['future', 'metro', 'brt', 'san-fernando-valley', 'san-gabriel-valley', 'vr-105']
    },
    {
      id: 'metro-vermont-brt',
      name: 'Vermont Transit Corridor BRT',
      shortName: 'Vermont BRT',
      kind: 'line',
      status: 'planned',
      mode: 'brt',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate Vermont Avenue BRT corridor from Sunset Boulevard to 120th Street.',
        coordinates: [
          [-118.2923, 34.0984],
          [-118.2917, 34.0617],
          [-118.2923, 34.0183],
          [-118.2916, 33.9283]
        ]
      },
      stations: [
        {
          id: 'vermont-brt-sunset',
          name: 'Vermont/Sunset',
          lat: 34.0984,
          lon: -118.2923,
          status: 'planned',
          role: 'terminal',
          openingYear: 2028,
          confidence: 'medium',
          existingLines: ['B Line']
        },
        {
          id: 'vermont-brt-wilshire',
          name: 'Wilshire/Vermont',
          lat: 34.0617,
          lon: -118.2917,
          status: 'planned',
          role: 'transfer',
          openingYear: 2028,
          confidence: 'medium',
          existingLines: ['B Line', 'D Line']
        },
        {
          id: 'vermont-brt-expo',
          name: 'Expo/Vermont',
          lat: 34.0183,
          lon: -118.2923,
          status: 'planned',
          role: 'transfer',
          openingYear: 2028,
          confidence: 'medium',
          existingLines: ['E Line']
        },
        {
          id: 'vermont-brt-120th',
          name: 'Vermont/120th',
          lat: 33.9283,
          lon: -118.2916,
          status: 'planned',
          role: 'terminal',
          openingYear: 2028,
          confidence: 'medium',
          existingLines: ['C Line']
        }
      ],
      provenance: [
        {
          sourceId: 'metro-vermont-corridor-project-page',
          title: 'Vermont Transit Corridor',
          sourceType: 'official_project',
          publisher: 'Los Angeles County Metropolitan Transportation Authority',
          url: 'https://www.metro.net/projects/vermont-corridor/',
          accessedAt: OFFICIAL_FUTURE_TRANSIT_REVIEWED_AT,
          note: 'Metro lists the 12.4-mile BRT from Sunset Boulevard to 120th Street, planning phase, LPA approval, preliminary engineering and NEPA review, and 2028 completion target.'
        }
      ],
      confidence: {
        level: 'official',
        geometry: 'medium',
        stations: 'medium',
        status: 'high',
        notes: 'The official near-term BRT is represented separately from the existing unofficial Vermont rapid rail vision seed.'
      },
      uncertainty: {
        level: 'low',
        sourceNotes: 'Metro source establishes the BRT corridor endpoints, route on Vermont Avenue, LPA status, and completion target. VeloRail approximates station coordinates at major transfer intersections.',
        assumptions: [
          'Station markers are major transfer anchors, not the complete 26-station LPA set.',
          'The later rail conversion mentioned by Metro remains outside this official future BRT record.'
        ],
        disclaimer: 'Official BRT project record with approximate VeloRail station geometry.'
      },
      timeline: {
        openingYear: 2028,
        phase: 'Planning and preliminary engineering',
        scheduleNotes: 'Metro states BRT infrastructure construction begins in late 2026 or early 2027, with a goal of opening by the 2028 Summer Olympic and Paralympic Games.'
      },
      style: {
        strokeColor: '#0f766e',
        strokeOpacity: 0.86,
        strokeWeight: 3,
        stationFillColor: '#0f766e',
        legendLabel: 'Future BRT'
      },
      rendering: {
        layerGroup: 'future',
        minZoom: 9,
        clickable: true
      },
      notes: 'Official near-term BRT kept separate from the unofficial Vermont heavy rail concept seed.',
      tags: ['future', 'metro', 'brt', 'vermont', 'vr-105']
    }
  ]
};
