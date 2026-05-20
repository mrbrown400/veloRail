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
        geometryNotes: 'Approximate track-aligned display centerline simplified from Caltrans California Rail Network ACTA/PHL Alameda Corridor features and public ACTA/port context. Not surveyed engineering geometry.',
        coordinates: [
          [-118.25295, 33.74951],
          [-118.25243, 33.75383],
          [-118.25200, 33.75487],
          [-118.25097, 33.75583],
          [-118.24784, 33.75709],
          [-118.24140, 33.76045],
          [-118.24012, 33.76169],
          [-118.23992, 33.76215],
          [-118.23989, 33.76332],
          [-118.24101, 33.77549],
          [-118.24020, 33.77849],
          [-118.23771, 33.78234],
          [-118.23740, 33.78339],
          [-118.23753, 33.78738],
          [-118.23720, 33.78638],
          [-118.23639, 33.78575],
          [-118.23753, 33.78738],
          [-118.23812, 33.79327],
          [-118.23849, 33.79394],
          [-118.23998, 33.79571],
          [-118.24019, 33.79638],
          [-118.24015, 33.79708],
          [-118.23840, 33.80004],
          [-118.23002, 33.82290],
          [-118.22965, 33.82426],
          [-118.22957, 33.82631],
          [-118.22874, 33.82875],
          [-118.22832, 33.82958],
          [-118.22671, 33.83180],
          [-118.21889, 33.85289],
          [-118.21852, 33.85414],
          [-118.21757, 33.85961],
          [-118.21643, 33.86248],
          [-118.21579, 33.86637],
          [-118.21590, 33.86937],
          [-118.22745, 33.94177],
          [-118.23763, 33.98861],
          [-118.23794, 33.99052],
          [-118.23922, 34.00547],
          [-118.23964, 34.01204],
          [-118.23938, 34.01330],
          [-118.23846, 34.01450],
          [-118.23255, 34.01783],
          [-118.23119, 34.01818],
          [-118.22370, 34.01830]
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
        },
        {
          sourceId: 'caltrans-california-rail-network',
          title: 'California Rail Network feature layer',
          sourceType: 'public_agency',
          publisher: 'California Department of Transportation',
          url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/chrailroad/california_rail_network/MapServer/0',
          accessedAt: ACCESSED_AT,
          note: 'Caltrans rail layer includes ACTA Alameda Corridor and PHL connector features used to replace the earlier schematic display centerline with track-aligned overlay geometry. License/terms: ArcGIS service copyright text is blank; source is cited as public agency reference data and geometry is simplified.'
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
        strokeColor: '#5f6368',
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
        geometryNotes: 'Approximate track-aligned display centerline simplified from Caltrans California Rail Network San Bernardino subdivision features. It is still generalized for browser overlay rendering, not engineering design.',
        coordinates: [
          [-118.23009, 34.01821],
          [-118.22718, 34.01801],
          [-118.22453, 34.01616],
          [-118.22078, 34.01626],
          [-118.21787, 34.01589],
          [-118.11337, 33.98056],
          [-118.11025, 33.97898],
          [-118.09591, 33.96918],
          [-118.07813, 33.96344],
          [-118.07635, 33.96255],
          [-118.06326, 33.95037],
          [-118.06197, 33.94844],
          [-118.06133, 33.94516],
          [-118.06121, 33.91964],
          [-118.06022, 33.91657],
          [-118.05841, 33.91432],
          [-118.05683, 33.91315],
          [-118.01806, 33.89109],
          [-117.99364, 33.87756],
          [-117.98968, 33.87620],
          [-117.94607, 33.86842],
          [-117.91746, 33.86868],
          [-117.91486, 33.86821],
          [-117.87389, 33.86827],
          [-117.86776, 33.86873],
          [-117.84342, 33.86790],
          [-117.83330, 33.86805],
          [-117.81153, 33.86570],
          [-117.79120, 33.86233],
          [-117.78530, 33.86256],
          [-117.77983, 33.86393],
          [-117.77740, 33.86545],
          [-117.77271, 33.87054],
          [-117.76983, 33.87261],
          [-117.76633, 33.87385],
          [-117.75929, 33.87471],
          [-117.74840, 33.87782],
          [-117.74555, 33.87943],
          [-117.74133, 33.88335],
          [-117.73880, 33.88422],
          [-117.73674, 33.88399],
          [-117.73498, 33.88305],
          [-117.73091, 33.87839],
          [-117.72836, 33.87495],
          [-117.72730, 33.87422],
          [-117.72521, 33.87357],
          [-117.72254, 33.87373],
          [-117.71165, 33.87565],
          [-117.70351, 33.87763],
          [-117.70055, 33.87795],
          [-117.69213, 33.87740],
          [-117.68783, 33.87680],
          [-117.68073, 33.87432],
          [-117.67639, 33.87386],
          [-117.67223, 33.87463],
          [-117.66348, 33.87874],
          [-117.66089, 33.87947],
          [-117.65876, 33.87970],
          [-117.64817, 33.87953],
          [-117.63630, 33.88315],
          [-117.62660, 33.88366],
          [-117.58911, 33.88998],
          [-117.58512, 33.89029],
          [-117.58051, 33.88932],
          [-117.56967, 33.88376],
          [-117.56786, 33.88310],
          [-117.55575, 33.88034],
          [-117.54163, 33.87790],
          [-117.53900, 33.87786],
          [-117.52758, 33.87989],
          [-117.44906, 33.90747],
          [-117.44375, 33.91049],
          [-117.44027, 33.91408],
          [-117.43884, 33.91510],
          [-117.43693, 33.91574],
          [-117.42760, 33.91755],
          [-117.41832, 33.92275],
          [-117.38561, 33.94617],
          [-117.38470, 33.94764],
          [-117.38451, 33.95080],
          [-117.38412, 33.95181],
          [-117.37936, 33.95576],
          [-117.37776, 33.95806],
          [-117.37728, 33.95957],
          [-117.37666, 33.96437],
          [-117.37532, 33.96755],
          [-117.36438, 33.98347],
          [-117.35076, 33.99519],
          [-117.33417, 34.01495],
          [-117.33366, 34.01695],
          [-117.33304, 34.03199],
          [-117.32911, 34.05449],
          [-117.32919, 34.06075],
          [-117.32679, 34.07218],
          [-117.31620, 34.09846],
          [-117.31589, 34.10373],
          [-117.31475, 34.10441],
          [-117.31046, 34.10456]
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
        strokeColor: '#5f6368',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
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
        geometryNotes: 'Approximate track-aligned display centerline simplified from Caltrans California Rail Network Alhambra subdivision features from the LA River east through the San Gabriel Valley. Not surveyed engineering geometry.',
        coordinates: [
          [-118.22148, 34.06274],
          [-118.21641, 34.06322],
          [-118.20553, 34.06526],
          [-118.20350, 34.06536],
          [-118.18591, 34.06215],
          [-118.18454, 34.06200],
          [-118.18301, 34.06218],
          [-118.18160, 34.06277],
          [-118.18058, 34.06360],
          [-118.17635, 34.06868],
          [-118.17505, 34.06993],
          [-118.16761, 34.07609],
          [-118.16525, 34.07752],
          [-118.16354, 34.07792],
          [-118.14835, 34.07946],
          [-118.14572, 34.07998],
          [-118.14169, 34.08147],
          [-118.11150, 34.09444],
          [-118.10693, 34.09614],
          [-118.10405, 34.09692],
          [-118.10072, 34.09739],
          [-118.09712, 34.09744],
          [-118.09352, 34.09702],
          [-118.09094, 34.09639],
          [-118.04466, 34.08116],
          [-118.04077, 34.07969],
          [-118.03703, 34.07783],
          [-118.02270, 34.06826],
          [-117.96745, 34.03019],
          [-117.94926, 34.01577],
          [-117.94471, 34.01308],
          [-117.93993, 34.01132],
          [-117.93676, 34.01059],
          [-117.88753, 34.00266],
          [-117.88245, 34.00188],
          [-117.87830, 34.00159],
          [-117.87345, 34.00224],
          [-117.87005, 34.00332],
          [-117.86841, 34.00408],
          [-117.85469, 34.01184],
          [-117.84830, 34.01640],
          [-117.84614, 34.01754],
          [-117.83946, 34.01993],
          [-117.83149, 34.02548],
          [-117.82758, 34.02852],
          [-117.82623, 34.03007],
          [-117.80749, 34.05413],
          [-117.80438, 34.05629],
          [-117.80175, 34.05728],
          [-117.79948, 34.05772],
          [-117.58611, 34.06311],
          [-117.36239, 34.06844],
          [-117.35624, 34.06792],
          [-117.35125, 34.06671],
          [-117.34998, 34.06699],
          [-117.34879, 34.06793],
          [-117.34774, 34.06830],
          [-117.34405, 34.06826],
          [-117.33169, 34.06607]
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
        },
        {
          sourceId: 'caltrans-california-rail-network',
          title: 'California Rail Network feature layer',
          sourceType: 'public_agency',
          publisher: 'California Department of Transportation',
          url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/chrailroad/california_rail_network/MapServer/0',
          accessedAt: ACCESSED_AT,
          note: 'Caltrans rail layer Alhambra subdivision features are used for the track-aligned overlay display geometry. License/terms: ArcGIS service copyright text is blank; source is cited as public agency reference data and geometry is simplified.'
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
        strokeColor: '#5f6368',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
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
        geometryNotes: 'Approximate track-aligned display centerline simplified from Caltrans California Rail Network Pacific Harbor Line and Alameda Corridor connector features. It still abstracts detailed terminal leads and yard tracks.',
        coordinates: [
          [-118.25295, 33.74951],
          [-118.25243, 33.75383],
          [-118.25200, 33.75487],
          [-118.25097, 33.75583],
          [-118.24784, 33.75709],
          [-118.24140, 33.76045],
          [-118.24012, 33.76169],
          [-118.23992, 33.76215],
          [-118.23989, 33.76332],
          [-118.24101, 33.77549],
          [-118.24020, 33.77849],
          [-118.23828, 33.78139],
          [-118.23941, 33.77992],
          [-118.24095, 33.77866],
          [-118.24320, 33.77789],
          [-118.25339, 33.77212],
          [-118.25733, 33.77101],
          [-118.25869, 33.77022],
          [-118.26145, 33.76806],
          [-118.23828, 33.78139],
          [-118.23771, 33.78234],
          [-118.23740, 33.78339],
          [-118.23753, 33.78738],
          [-118.23720, 33.78638],
          [-118.23639, 33.78575],
          [-118.24106, 33.78710],
          [-118.24183, 33.78790],
          [-118.24195, 33.78894],
          [-118.23814, 33.79933],
          [-118.23766, 33.80195],
          [-118.23840, 33.80004],
          [-118.24000, 33.79752],
          [-118.24020, 33.79662],
          [-118.23992, 33.79561],
          [-118.23849, 33.79394],
          [-118.23806, 33.79308],
          [-118.23749, 33.78605],
          [-118.23348, 33.78494],
          [-118.23112, 33.78460],
          [-118.22918, 33.78407],
          [-118.22803, 33.78343],
          [-118.21062, 33.77858],
          [-118.20857, 33.77747],
          [-118.20786, 33.77681],
          [-118.20759, 33.77605],
          [-118.20744, 33.77146],
          [-118.20772, 33.76982],
          [-118.20778, 33.76728]
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
        },
        {
          sourceId: 'caltrans-california-rail-network',
          title: 'California Rail Network feature layer',
          sourceType: 'public_agency',
          publisher: 'California Department of Transportation',
          url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/chrailroad/california_rail_network/MapServer/0',
          accessedAt: ACCESSED_AT,
          note: 'Caltrans Pacific Harbor Line, port connector, and Alameda Corridor features are used for the track-aligned overlay display geometry. License/terms: ArcGIS service copyright text is blank; source is cited as public agency reference data and detailed terminal trackage is still simplified for map readability.'
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
        strokeColor: '#5f6368',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        strokePattern: 'solid',
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
