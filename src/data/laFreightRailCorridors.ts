import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  TransitProposalDataset
} from '@/types/proposals';

const ACCESSED_AT = '2026-05-19';

export const LA_FREIGHT_RAIL_CORRIDOR_DATASET: TransitProposalDataset = {
  schemaVersion: TRANSIT_PROPOSAL_SCHEMA_VERSION,
  updatedAt: ACCESSED_AT,
  migrationNotes: [
    'VR-402 initial LA freight corridor batch. Sources are public agency, FRA/Caltrans rail network, freight-owner, and port pages checked on 2026-05-19.',
    'VR-404/VR-405 adds deterministic passenger-conversion scenarios to selected freight records while keeping the freight records themselves freight_only.',
    'Geometry is simplified centerline geometry for Google Maps polyline rendering; it is not surveyed railroad engineering geometry.',
    'Google Maps remains the renderer only. The Google basemap is not used as a source for corridor existence, ownership, operations, or geometry.'
  ],
  proposals: [
    {
      id: 'la-freight-alameda-corridor',
      name: 'Alameda Corridor Freight Expressway',
      shortName: 'Alameda Corridor',
      kind: 'corridor',
      status: 'freight_only',
      mode: 'freight_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate 20-mile port-to-downtown centerline from the San Pedro Bay port rail complex to the transcontinental rail yards near downtown Los Angeles. Not surveyed ACTA alignment geometry.',
        coordinates: [
          [-118.2626, 33.7490],
          [-118.2513, 33.7857],
          [-118.2405, 33.8391],
          [-118.2386, 33.8873],
          [-118.2402, 33.9419],
          [-118.2354, 33.9862],
          [-118.2278, 34.0188]
        ]
      },
      provenance: [
        {
          sourceId: 'acta-corridor-home',
          title: 'Alameda Corridor Transportation Authority corridor overview',
          sourceType: 'public_agency',
          publisher: 'Alameda Corridor Transportation Authority',
          url: 'https://www.acta.org/',
          accessedAt: ACCESSED_AT,
          note: 'ACTA identifies the corridor as linking the Ports of Los Angeles and Long Beach to the transcontinental railroad. License/terms: public web source cited for facts only; no ACTA linework is copied.'
        },
        {
          sourceId: 'port-la-rail-page',
          title: 'Rail supply chain overview',
          sourceType: 'public_agency',
          publisher: 'Port of Los Angeles',
          url: 'https://portoflosangeles.org/business/supply-chain/rail',
          accessedAt: ACCESSED_AT,
          note: 'Port of Los Angeles describes the Alameda Corridor as a 20-mile freight rail expressway connecting the ports to rail hubs near downtown Los Angeles. License/terms: public web source cited for facts only; geometry is a VeloRail approximation.'
        },
        {
          sourceId: 'fra-narn-lines',
          title: 'North American Rail Network Lines',
          sourceType: 'public_agency',
          publisher: 'Federal Railroad Administration / Bureau of Transportation Statistics',
          url: 'https://catalog.data.gov/dataset/north-american-rail-network-lines-24470',
          accessedAt: ACCESSED_AT,
          note: 'FRA NARN provides national rail ownership, trackage-rights, and geometry reference data at 1:24,000 or better. License/terms: data.gov lists this dataset under the U.S. public domain label.'
        }
      ],
      confidence: {
        level: 'high',
        geometry: 'medium',
        status: 'high',
        notes: 'Corridor identity, public authority, and freight use are official; checked-in linework is generalized for overlay display.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'ACTA and Port of Los Angeles sources establish corridor purpose and endpoints. VeloRail drew an approximate centerline for the Google Maps freight overlay.',
        assumptions: [
          'The checked-in centerline generalizes the trench and approach tracks into a single corridor.',
          'Exact track count, turnouts, and yard leads are intentionally outside this dataset.'
        ],
        disclaimer: 'Official freight corridor record with approximate VeloRail geometry. Do not infer passenger service.'
      },
      style: {
        strokeColor: '#64748b',
        strokeOpacity: 0.78,
        strokeWeight: 5,
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
        operator: 'BNSF Railway / Union Pacific Railroad',
        trackUsage: 'freight',
        electrification: 'unknown',
        ownershipSourceId: 'acta-corridor-home',
        usageSourceId: 'port-la-rail-page',
        electrificationSourceId: 'fra-narn-lines',
        conversionScenarioId: 'alameda-corridor-south-alameda-passenger-conversion',
        conversionScenarios: [
          {
            id: 'alameda-corridor-south-alameda-passenger-conversion',
            name: 'Alameda Corridor South Alameda passenger conversion concept',
            status: 'converted_passenger',
            targetMode: 'commuter_rail',
            sourceFreightCorridorId: 'la-freight-alameda-corridor',
            serviceConcept: 'Hypothetical Metro or Metrolink-style passenger overlay using the sourced Alameda Corridor freight right-of-way between San Pedro Bay and downtown Los Angeles.',
            stationAssumptions: [
              'Southern station would need a new passenger access point near the port rail complex.',
              'South Alameda/Slauson is a planning placeholder for the South Alameda feedback corridor, not a sourced station plan.',
              'Downtown interface would need a separate terminal, transfer, and freight-conflict study.'
            ],
            assumptions: [
              'The source records support an existing freight right-of-way, not approved passenger service.',
              'Passenger conversion would require public acquisition, dispatching, safety, platform, and freight-conflict analysis.',
              'The South Alameda framing is derived from the current Alameda Corridor geometry and user feedback, not from an official service plan.'
            ],
            notes: 'Captures the South Alameda feedback where the current sourced Alameda Corridor record supports an existing freight right-of-way.'
          }
        ],
        suitability: {
          rating: 'unknown',
          factors: [
            {
              factor: 'right-of-way continuity',
              effect: 'positive',
              note: 'Public sources support a continuous freight corridor between the port complex and downtown rail network.'
            },
            {
              factor: 'passenger conversion evidence',
              effect: 'unknown',
              note: 'No checked source in VR-402 establishes an official passenger conversion project for this corridor.'
            }
          ],
          notes: 'Suitability scoring is deferred to a later Nationalized Rail planning issue.'
        },
        suitabilityNotes: 'Dataset only establishes a sourced freight corridor and approximate overlay geometry.'
      },
      notes: 'Production freight source record that supersedes the earlier seed for source coverage, while leaving the seed untouched for schema examples.',
      tags: ['freight', 'nationalized-rail', 'ports', 'alameda-corridor', 'vr-402']
    },
    {
      id: 'la-freight-bnsf-los-angeles-san-bernardino',
      name: 'BNSF Los Angeles to San Bernardino Freight Corridor',
      shortName: 'BNSF LA-San Bernardino',
      kind: 'corridor',
      status: 'freight_only',
      mode: 'mixed_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate BNSF regional freight corridor from Hobart/Commerce toward Fullerton, Riverside, and San Bernardino. It is generalized from public rail network and BNSF facility sources.',
        coordinates: [
          [-118.1700, 34.0060],
          [-118.0410, 33.9930],
          [-117.9250, 33.8720],
          [-117.7730, 33.8840],
          [-117.5750, 34.0110],
          [-117.3000, 34.1050]
        ]
      },
      provenance: [
        {
          sourceId: 'bnsf-facility-listings',
          title: 'BNSF facility listings',
          sourceType: 'freight_owner',
          publisher: 'BNSF Railway',
          url: 'https://bnsf.com/ship-with-bnsf/support-services/facility-listings.page',
          accessedAt: ACCESSED_AT,
          note: 'BNSF lists Los Angeles and San Bernardino intermodal facilities, supporting regional BNSF freight anchors for the corridor. License/terms: public carrier web source cited for facts only; no BNSF map artwork is copied.'
        },
        {
          sourceId: 'bnsf-network-maps',
          title: 'BNSF rail network maps',
          sourceType: 'freight_owner',
          publisher: 'BNSF Railway',
          url: 'https://bnsf.com/ship-with-bnsf/maps-and-shipping-locations/rail-network-maps.page',
          accessedAt: ACCESSED_AT,
          note: 'BNSF publishes network and intermodal map resources that identify Los Angeles on its freight network. License/terms: public carrier web source cited for facts only; VeloRail stores simplified coordinates.'
        },
        {
          sourceId: 'caltrans-california-rail-network',
          title: 'California Rail Network feature layer',
          sourceType: 'public_agency',
          publisher: 'California Department of Transportation',
          url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/chrailroad/california_rail_network/MapServer/0',
          accessedAt: ACCESSED_AT,
          note: 'Caltrans rail layer includes alignment for passenger, freight, commuter, recreational, and shortline rail with ROW_OWNER, FREIGHT_OP, and subdivision fields. License/terms: ArcGIS service copyright text is blank; source is cited as public agency reference data and geometry is simplified.'
        }
      ],
      confidence: {
        level: 'high',
        geometry: 'medium',
        status: 'high',
        notes: 'BNSF facility and network presence are official. Segment-level alignment is generalized from public rail network references.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'BNSF and public rail network sources support the corridor anchors and freight role; VeloRail approximates a single regional centerline.',
        assumptions: [
          'The record groups multiple railroad segments into one overlay corridor for regional planning.',
          'Passenger operations on portions of the route are represented as mixed track usage, not as a passenger conversion proposal.'
        ],
        disclaimer: 'Official freight/mixed corridor record with approximate VeloRail geometry.'
      },
      style: {
        strokeColor: '#ea580c',
        strokeOpacity: 0.78,
        strokeWeight: 4,
        strokePattern: 'dotted',
        legendLabel: 'BNSF freight corridor'
      },
      rendering: {
        layerGroup: 'freight',
        minZoom: 8,
        clickable: true
      },
      freight: {
        owner: 'BNSF Railway',
        operator: 'BNSF Railway',
        trackUsage: 'mixed',
        electrification: 'unknown',
        ownershipSourceId: 'caltrans-california-rail-network',
        usageSourceId: 'bnsf-facility-listings',
        electrificationSourceId: 'caltrans-california-rail-network',
        conversionScenarioId: 'bnsf-la-san-bernardino-passenger-conversion',
        conversionScenarios: [
          {
            id: 'bnsf-la-san-bernardino-passenger-conversion',
            name: 'BNSF LA to San Bernardino passenger conversion concept',
            status: 'converted_passenger',
            targetMode: 'commuter_rail',
            sourceFreightCorridorId: 'la-freight-bnsf-los-angeles-san-bernardino',
            serviceConcept: 'Hypothetical regional passenger overlay on the sourced BNSF freight corridor between the LA freight terminal area and San Bernardino.',
            stationAssumptions: [
              'Western station would need a passenger access point near Hobart/Commerce freight facilities.',
              'Intermediate transfer area is a corridor placeholder only.',
              'San Bernardino terminal would need a separate interface with existing passenger services and freight operations.'
            ],
            assumptions: [
              'The source records support BNSF freight anchors and network presence, not an approved passenger service.',
              'Station spacing, dispatching priority, and freight capacity are unresolved.',
              'The generalized line is sufficient for Google Maps overlay planning, not operational design.'
            ],
            notes: 'Generated as an inland regional conversion candidate from the current freight record.'
          }
        ],
        suitability: {
          rating: 'unknown',
          factors: [
            {
              factor: 'regional reach',
              effect: 'positive',
              note: 'The corridor connects the Los Angeles freight terminal area to inland regional rail facilities.'
            },
            {
              factor: 'shared operations',
              effect: 'unknown',
              note: 'The production dataset does not score conflicts between freight and passenger movements.'
            }
          ],
          notes: 'Useful as a Nationalized Rail overlay input, but not scored for conversion feasibility.'
        },
        suitabilityNotes: 'Suitability scoring requires operational, ownership, and passenger-service detail beyond VR-402.'
      },
      notes: 'Bounded regional corridor record for BNSF freight-owned or freight-operated LA basin rail movements.',
      tags: ['freight', 'nationalized-rail', 'bnsf', 'regional', 'vr-402']
    },
    {
      id: 'la-freight-union-pacific-los-angeles-inland-empire',
      name: 'Union Pacific Los Angeles to Inland Empire Freight Corridor',
      shortName: 'UP LA-Inland Empire',
      kind: 'corridor',
      status: 'freight_only',
      mode: 'mixed_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate Union Pacific corridor from Los Angeles east through the San Gabriel Valley toward Ontario/Colton, generalized from UP California materials and public rail network sources.',
        coordinates: [
          [-118.2250, 34.0440],
          [-118.0870, 34.0440],
          [-117.9480, 34.0620],
          [-117.8460, 34.0500],
          [-117.6510, 34.0630],
          [-117.3220, 34.0670]
        ]
      },
      provenance: [
        {
          sourceId: 'up-california-guide',
          title: 'Union Pacific in California',
          sourceType: 'freight_owner',
          publisher: 'Union Pacific Railroad',
          url: 'https://www.up.com/content/dam/upcom/corp-comm/documents/us-guide/pdf-california--usguide.pdf',
          accessedAt: ACCESSED_AT,
          note: 'Union Pacific describes its Los Angeles Service Unit, California freight operations, and freight links to the Ports of Los Angeles and Long Beach. License/terms: public carrier PDF cited for facts only; no UP map artwork is copied.'
        },
        {
          sourceId: 'up-system-map',
          title: 'Union Pacific system map',
          sourceType: 'freight_owner',
          publisher: 'Union Pacific Railroad',
          url: 'https://www.up.com/content/upcom/us/en/about-us/maps.html',
          accessedAt: ACCESSED_AT,
          note: 'Union Pacific publishes a system map and state resources for its western rail network. License/terms: public carrier web source cited for facts only; checked-in geometry is a VeloRail approximation.'
        },
        {
          sourceId: 'fra-narn-lines',
          title: 'North American Rail Network Lines',
          sourceType: 'public_agency',
          publisher: 'Federal Railroad Administration / Bureau of Transportation Statistics',
          url: 'https://catalog.data.gov/dataset/north-american-rail-network-lines-24470',
          accessedAt: ACCESSED_AT,
          note: 'FRA NARN provides national rail ownership, trackage-rights, and geometry reference data at 1:24,000 or better. License/terms: data.gov lists this dataset under the U.S. public domain label.'
        }
      ],
      confidence: {
        level: 'high',
        geometry: 'medium',
        status: 'high',
        notes: 'Union Pacific freight role is official. Corridor geometry is generalized for regional display.'
      },
      uncertainty: {
        level: 'medium',
        sourceNotes: 'Union Pacific and FRA sources support the operator and regional freight role. VeloRail approximates one east-west corridor rather than encoding each subdivision segment separately.',
        assumptions: [
          'The record represents a planning corridor across multiple UP route segments in the LA basin.',
          'Shared passenger use where present is captured as mixed rail, not as an official passenger conversion project.'
        ],
        disclaimer: 'Official freight/mixed corridor record with approximate VeloRail geometry.'
      },
      style: {
        strokeColor: '#ca8a04',
        strokeOpacity: 0.78,
        strokeWeight: 4,
        strokePattern: 'dotted',
        legendLabel: 'Union Pacific freight corridor'
      },
      rendering: {
        layerGroup: 'freight',
        minZoom: 8,
        clickable: true
      },
      freight: {
        owner: 'Union Pacific Railroad',
        operator: 'Union Pacific Railroad',
        trackUsage: 'mixed',
        electrification: 'unknown',
        ownershipSourceId: 'up-california-guide',
        usageSourceId: 'up-california-guide',
        electrificationSourceId: 'fra-narn-lines',
        conversionScenarioId: 'up-la-inland-empire-passenger-conversion',
        conversionScenarios: [
          {
            id: 'up-la-inland-empire-passenger-conversion',
            name: 'Union Pacific LA to Inland Empire passenger conversion concept',
            status: 'converted_passenger',
            targetMode: 'commuter_rail',
            sourceFreightCorridorId: 'la-freight-union-pacific-los-angeles-inland-empire',
            serviceConcept: 'Hypothetical passenger overlay using the sourced Union Pacific freight corridor from Los Angeles toward Inland Empire gateways.',
            stationAssumptions: [
              'Western terminal is a planning placeholder near LA basin freight yards.',
              'San Gabriel Valley interface is a midpoint assumption and not a sourced station site.',
              'Inland Empire gateway terminal would need separate passenger access and service integration work.'
            ],
            assumptions: [
              'The source records support Union Pacific freight presence and regional reach, not passenger conversion approval.',
              'Segment ownership, dispatching, track capacity, and grade-crossing impacts are unresolved.',
              'The converted line inherits approximate geometry from the freight overlay only.'
            ],
            notes: 'Generated as a regional conversion candidate from the current freight record.'
          }
        ],
        suitability: {
          rating: 'unknown',
          factors: [
            {
              factor: 'regional reach',
              effect: 'positive',
              note: 'Union Pacific sources support a California freight network serving Los Angeles and the ports.'
            },
            {
              factor: 'segment detail',
              effect: 'unknown',
              note: 'This dataset does not yet separate individual UP subdivisions, track counts, or dispatching constraints.'
            }
          ],
          notes: 'Nationalized Rail suitability is intentionally unscored in this source import.'
        },
        suitabilityNotes: 'Operational constraints and conversion assumptions belong in later planning/scenario issues.'
      },
      notes: 'Bounded regional corridor record for Union Pacific freight movements from the LA basin toward inland gateways.',
      tags: ['freight', 'nationalized-rail', 'union-pacific', 'regional', 'vr-402']
    },
    {
      id: 'la-freight-pacific-harbor-line-port-complex',
      name: 'Pacific Harbor Line San Pedro Bay Port Rail Complex',
      shortName: 'Pacific Harbor Line',
      kind: 'corridor',
      status: 'freight_only',
      mode: 'freight_rail',
      classification: 'official',
      geometry: {
        type: 'LineString',
        geometrySource: 'approximate',
        geometryNotes: 'Approximate port-terminal switching corridor across the San Pedro Bay port complex and Alameda Corridor connection. It intentionally abstracts detailed yard, terminal, and lead tracks.',
        coordinates: [
          [-118.2626, 33.7490],
          [-118.2440, 33.7605],
          [-118.2160, 33.7710],
          [-118.2020, 33.7560],
          [-118.2380, 33.7350],
          [-118.2760, 33.7320],
          [-118.2890, 33.7470],
          [-118.2626, 33.7490]
        ]
      },
      provenance: [
        {
          sourceId: 'phl-anacostia-profile',
          title: 'Pacific Harbor Line company profile',
          sourceType: 'freight_owner',
          publisher: 'Anacostia Rail Holdings',
          url: 'https://www.anacostia.com/our-companies/phl/',
          accessedAt: ACCESSED_AT,
          note: 'PHL profile identifies the Ports of Long Beach and Los Angeles, 19 route miles, 96 track miles, connections with BNSF and UP, and terminal/switching role. License/terms: public carrier web source cited for facts only; no detailed terminal map is copied.'
        },
        {
          sourceId: 'up-phl-shortline',
          title: 'Pacific Harbor Line PHL #600',
          sourceType: 'freight_owner',
          publisher: 'Union Pacific Railroad',
          url: 'https://www.up.com/shipping/short-line/lines/phl',
          accessedAt: ACCESSED_AT,
          note: 'Union Pacific short-line profile says PHL serves the Ports of Long Beach and Los Angeles and coordinates train movement within the ports. License/terms: public carrier web source cited for facts only.'
        },
        {
          sourceId: 'port-la-rail-page',
          title: 'Rail supply chain overview',
          sourceType: 'public_agency',
          publisher: 'Port of Los Angeles',
          url: 'https://portoflosangeles.org/business/supply-chain/rail',
          accessedAt: ACCESSED_AT,
          note: 'Port of Los Angeles describes on-dock rail and the Alameda Corridor freight connection. License/terms: public web source cited for facts only; port terminal geometry is approximate.'
        }
      ],
      confidence: {
        level: 'high',
        geometry: 'low',
        status: 'high',
        notes: 'PHL role, port scope, and Class I connections are official. The geometry is a schematic port-complex corridor.'
      },
      uncertainty: {
        level: 'high',
        sourceNotes: 'Public sources support the operator and port complex role, but do not provide a checked-in terminal track geometry license for this dataset.',
        assumptions: [
          'The corridor uses a simplified loop to show the port-terminal freight complex rather than every track.',
          'Detailed terminal access, ownership by terminal, and dispatching boundaries are outside the VR-402 source import.'
        ],
        disclaimer: 'Official freight terminal railroad record with schematic VeloRail geometry.'
      },
      style: {
        strokeColor: '#0891b2',
        strokeOpacity: 0.72,
        strokeWeight: 4,
        strokePattern: 'dotted',
        legendLabel: 'Port terminal rail'
      },
      rendering: {
        layerGroup: 'freight',
        minZoom: 10,
        clickable: true
      },
      freight: {
        owner: 'Ports of Los Angeles and Long Beach rail infrastructure owners',
        operator: 'Pacific Harbor Line',
        trackUsage: 'freight',
        electrification: 'unknown',
        ownershipSourceId: 'port-la-rail-page',
        usageSourceId: 'phl-anacostia-profile',
        electrificationSourceId: 'phl-anacostia-profile',
        suitability: {
          rating: 'unknown',
          factors: [
            {
              factor: 'first-mile and last-mile freight role',
              effect: 'positive',
              note: 'PHL sources establish the terminal railroad role for port rail movement.'
            },
            {
              factor: 'passenger conversion evidence',
              effect: 'negative',
              note: 'The source set supports freight terminal/switching use, not passenger conversion.'
            }
          ],
          notes: 'Included for freight overlay completeness, not as a conversion candidate.'
        },
        suitabilityNotes: 'Port-terminal switching trackage should remain freight context unless a later sourced passenger concept explicitly targets it.'
      },
      notes: 'Port complex freight terminal record included to ground the Nationalized Rail overlay near San Pedro Bay.',
      tags: ['freight', 'nationalized-rail', 'ports', 'pacific-harbor-line', 'vr-402']
    }
  ]
};
