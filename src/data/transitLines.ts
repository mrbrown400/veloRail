// LA Metro Transit Lines Data
// Re-exported from original transit_data.js with TypeScript types

import type { TransitLines } from "@/types";

export const TRANSIT_LINES: TransitLines = {
  Red: {
    color: "#E31837",
    gtfsRouteId: "802",
    schedule: {
      type: "rail",
      frequency: 6,
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "Civic Center/Grand Park", lat: 34.0549, lon: -118.246 },
      { name: "Pershing Square", lat: 34.0493, lon: -118.2513 },
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Westlake/MacArthur Park", lat: 34.0564, lon: -118.2749 },
      { name: "Wilshire/Vermont", lat: 34.0617, lon: -118.2917 },
      { name: "Vermont/Beverly", lat: 34.0765, lon: -118.2917 },
      { name: "Vermont/Santa Monica", lat: 34.0907, lon: -118.2922 },
      { name: "Vermont/Sunset", lat: 34.0984, lon: -118.2923 },
      { name: "Hollywood/Western", lat: 34.1016, lon: -118.3088 },
      { name: "Hollywood/Vine", lat: 34.1017, lon: -118.3253 },
      { name: "Hollywood/Highland", lat: 34.1017, lon: -118.3389 },
      { name: "Universal City/Studio City", lat: 34.1389, lon: -118.3625 },
      { name: "North Hollywood", lat: 34.1685, lon: -118.3765 },
    ],
  },
  Purple: {
    color: "#A05DA5",
    gtfsRouteId: "805",
    schedule: {
      type: "rail",
      frequency: 6,
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Wilshire/Vermont", lat: 34.0617, lon: -118.2917 },
      { name: "Wilshire/Normandie", lat: 34.0618, lon: -118.3014 },
      { name: "Wilshire/Western", lat: 34.0618, lon: -118.3088 },
      { name: "Wilshire/La Brea", lat: 34.0619, lon: -118.344 },
      { name: "Wilshire/Fairfax", lat: 34.0631, lon: -118.3623 },
      { name: "Wilshire/La Cienega", lat: 34.0652, lon: -118.3762 },
    ],
  },
  Blue: {
    color: "#0072CE",
    gtfsRouteId: "801",
    schedule: {
      type: "rail",
      frequency: 6,
    },
    stations: [
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Pico", lat: 34.0407, lon: -118.2661 },
      { name: "LATTC/Ortho Institute", lat: 34.0318, lon: -118.2657 },
      { name: "Grand/LATTC", lat: 34.0332, lon: -118.2693 },
      { name: "San Pedro Street", lat: 34.0267, lon: -118.2555 },
      { name: "Washington", lat: 34.0196, lon: -118.243 },
      { name: "Vernon", lat: 34.004, lon: -118.2429 },
      { name: "Slauson", lat: 33.9888, lon: -118.2434 },
      { name: "Florence", lat: 33.9745, lon: -118.2427 },
      { name: "Firestone", lat: 33.9596, lon: -118.2426 },
      { name: "103rd Street/Watts Towers", lat: 33.9427, lon: -118.2425 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
      { name: "Compton", lat: 33.8959, lon: -118.2242 },
      { name: "Artesia", lat: 33.876, lon: -118.2215 },
      { name: "Del Amo", lat: 33.8471, lon: -118.2111 },
      { name: "Wardlow", lat: 33.8188, lon: -118.1963 },
      { name: "Willow Street", lat: 33.8055, lon: -118.1889 },
      { name: "Pacific Coast Highway", lat: 33.7892, lon: -118.1895 },
      { name: "Anaheim Street", lat: 33.782, lon: -118.1893 },
      { name: "5th Street", lat: 33.7725, lon: -118.1903 },
      { name: "1st Street", lat: 33.7686, lon: -118.1901 },
      { name: "Downtown Long Beach", lat: 33.7681, lon: -118.1929 },
    ],
  },
  Green: {
    color: "#3CB371",
    gtfsRouteId: "803",
    schedule: {
      type: "rail",
      frequency: 8,
    },
    stations: [
      { name: "Redondo Beach", lat: 33.8936, lon: -118.3698 },
      { name: "Douglas", lat: 33.9056, lon: -118.3862 },
      { name: "El Segundo", lat: 33.916, lon: -118.387 },
      { name: "Mariposa", lat: 33.9218, lon: -118.3879 },
      { name: "Aviation/LAX", lat: 33.9312, lon: -118.3887 },
      { name: "Hawthorne/Lennox", lat: 33.9268, lon: -118.3582 },
      { name: "Crenshaw", lat: 33.9294, lon: -118.3308 },
      { name: "Vermont/Athens", lat: 33.9283, lon: -118.2916 },
      { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
      { name: "Long Beach Blvd", lat: 33.9238, lon: -118.1884 },
      { name: "Lakewood Blvd", lat: 33.916, lon: -118.118 },
      { name: "Norwalk", lat: 33.9008, lon: -118.0827 },
    ],
  },
  Gold: {
    color: "#FFD700",
    gtfsRouteId: "804",
    schedule: {
      type: "rail",
      frequency: 8,
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "Little Tokyo/Arts District", lat: 34.05, lon: -118.2375 },
      { name: "Pico/Aliso", lat: 34.037, lon: -118.2315 },
      { name: "Mariachi Plaza", lat: 34.0312, lon: -118.2198 },
      { name: "Soto", lat: 34.033, lon: -118.2104 },
      { name: "Indiana", lat: 34.0335, lon: -118.194 },
      { name: "Maravilla", lat: 34.0335, lon: -118.1777 },
      { name: "East LA Civic Center", lat: 34.0334, lon: -118.1614 },
      { name: "Atlantic", lat: 34.0335, lon: -118.1533 },
    ],
  },
  Expo: {
    color: "#66CDAA",
    gtfsRouteId: "806",
    schedule: {
      type: "rail",
      frequency: 6,
    },
    stations: [
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Pico", lat: 34.0407, lon: -118.2658 },
      { name: "LATTC/Ortho Institute", lat: 34.0318, lon: -118.2657 },
      { name: "Jefferson/USC", lat: 34.0188, lon: -118.2793 },
      { name: "Expo Park/USC", lat: 34.0133, lon: -118.2857 },
      { name: "Expo/Vermont", lat: 34.0183, lon: -118.2923 },
      { name: "Expo/Western", lat: 34.0184, lon: -118.309 },
      { name: "Expo/Crenshaw", lat: 34.0201, lon: -118.3335 },
      { name: "Farmdale", lat: 34.0227, lon: -118.3509 },
      { name: "Expo/La Brea", lat: 34.0236, lon: -118.366 },
      { name: "La Cienega/Jefferson", lat: 34.0237, lon: -118.3831 },
      { name: "Culver City", lat: 34.0283, lon: -118.389 },
      { name: "Palms", lat: 34.0291, lon: -118.4045 },
      { name: "Westwood/Rancho Park", lat: 34.0362, lon: -118.423 },
      { name: "Expo/Sepulveda", lat: 34.0368, lon: -118.4395 },
      { name: "Expo/Bundy", lat: 34.0323, lon: -118.453 },
      { name: "26th Street/Bergamot", lat: 34.0289, lon: -118.4669 },
      { name: "17th Street/SMC", lat: 34.0247, lon: -118.4792 },
      { name: "Downtown Santa Monica", lat: 34.0152, lon: -118.4963 },
    ],
  },
  "K Line": {
    color: "#F58220",
    gtfsRouteId: "807",
    schedule: {
      type: "light_rail",
      frequency: 10,
    },
    stations: [
      { name: "Expo/Crenshaw", lat: 34.0201, lon: -118.3335 },
      { name: "Martin Luther King Jr", lat: 34.0095, lon: -118.3336 },
      { name: "Leimert Park", lat: 33.9994, lon: -118.3336 },
      { name: "Hyde Park", lat: 33.992, lon: -118.3336 },
      { name: "Fairview Heights", lat: 33.984, lon: -118.3336 },
      { name: "Downtown Inglewood", lat: 33.9611, lon: -118.3536 },
      { name: "Westchester/Veterans", lat: 33.9589, lon: -118.3765 },
      { name: "Aviation/Century", lat: 33.9465, lon: -118.3809 },
    ],
  },
  "LADOT CE 142": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: 30,
      operatingHours: {
        weekday: { start: "05:30", end: "23:30" },
        saturday: { start: "06:00", end: "23:30" },
        sunday: { start: "06:00", end: "23:30" },
      },
      scheduleNotes:
        "LADOT Commuter Express static schedule window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes:
        "Coarse anchors migrated from legacy src/transit_data.js; no exact stop pattern or GTFS shape in this issue.",
    },
    stations: [
      { name: "San Pedro Ports O'Call", lat: 33.7335, lon: -118.2764 },
      { name: "Long Beach Transit Gallery", lat: 33.7709, lon: -118.1924 },
    ],
  },
  "LADOT CE 409": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "09:00" },
          pm_peak: { start: "15:30", end: "19:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown Los Angeles / Union Station",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Glendale College",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Glendale College", lat: 34.1668, lon: -118.2323 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 419": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:00", end: "09:00" },
          pm_peak: { start: "15:00", end: "19:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown Los Angeles",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Chatsworth",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Chatsworth Station", lat: 34.2569, lon: -118.5986 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 422": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "09:00" },
          pm_peak: { start: "15:30", end: "19:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "reverse",
          label:
            "AM toward Hollywood / San Fernando Valley / Agoura Hills / Thousand Oaks",
        },
        {
          window: "pm_peak",
          direction: "forward",
          label: "PM toward San Fernando Valley / Hollywood / Downtown",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures. Direction labels are uncertainty-safe from source audit summary.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Thousand Oaks Transp. Ctr", lat: 34.175, lon: -118.8612 },
      { name: "Warner Center", lat: 34.1797, lon: -118.5979 },
      { name: "Universal City/Studio City", lat: 34.1394, lon: -118.3624 },
      { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 },
    ],
  },
  "LADOT CE 423": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "09:00" },
          pm_peak: { start: "15:30", end: "19:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown / USC",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Encino / Calabasas / Agoura Hills / Thousand Oaks",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Thousand Oaks Transp. Ctr", lat: 34.175, lon: -118.8612 },
      { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 },
      { name: "USC", lat: 34.0224, lon: -118.2851 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 431": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:00", end: "09:00" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Westwood",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Westwood (Weyburn/Westwood)", lat: 34.062, lon: -118.4455 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 437": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:00", end: "09:00" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Culver City / Marina del Rey / Venice",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Venice (Pacific/Washington)", lat: 33.9859, lon: -118.4731 },
      { name: "Culver City", lat: 34.0284, lon: -118.3887 },
      { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 },
    ],
  },
  "LADOT CE 438": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "09:00" },
          pm_peak: { start: "15:30", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Redondo Beach",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Redondo Beach Pier", lat: 33.8397, lon: -118.3927 },
      { name: "Harbor Gateway", lat: 33.8693, lon: -118.2874 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 439": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:00", end: "09:00" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "reverse",
          label: "AM toward El Segundo / Douglas",
        },
        {
          window: "pm_peak",
          direction: "forward",
          label: "PM toward Downtown / Union Station",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express 439 reverse-commute window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes:
        "Coarse anchors only; direction metadata prevents opposite-peak recommendations.",
    },
    stations: [
      { name: "Douglas", lat: 33.9056, lon: -118.3862 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 448": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "08:30" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward Downtown",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Rancho Palos Verdes",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      {
        name: "Rancho Palos Verdes (Hawthorne/Crest)",
        lat: 33.7612,
        lon: -118.4061,
      },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 534": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:00", end: "09:00" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "reverse",
          label: "AM toward West Los Angeles",
        },
        {
          window: "pm_peak",
          direction: "forward",
          label: "PM toward Downtown / Union Station",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "West LA (Sepulveda/National)", lat: 34.0267, lon: -118.4116 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
    ],
  },
  "LADOT CE 549": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:00", end: "09:00" },
          pm_peak: { start: "16:00", end: "19:00" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "both",
          label:
            "Peak direction varies between Pasadena / Glendale / Encino anchors",
        },
        {
          window: "pm_peak",
          direction: "both",
          label:
            "Peak direction varies between Pasadena / Glendale / Encino anchors",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures. Direction kept permissive because the bounded audit only supplies coarse eastbound/westbound anchors.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes:
        "Coarse anchors only; exact directional branch handling deferred to GTFS/shape work.",
    },
    stations: [
      { name: "Pasadena (Del Mar)", lat: 34.1426, lon: -118.1488 },
      { name: "Glendale (Brand/Broadway)", lat: 34.147, lon: -118.255 },
      { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 },
    ],
  },
  "LADOT CE 573": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 20,
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "06:30", end: "09:00" },
          pm_peak: { start: "16:00", end: "18:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM southbound toward Westwood / Century City",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM northbound toward Encino / Mission Hills",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 },
      { name: "Century City", lat: 34.0577, lon: -118.4168 },
    ],
  },
  "LADOT CE 574": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequency: 30,
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingHours: {
        weekday: {
          am_peak: { start: "05:30", end: "08:30" },
          pm_peak: { start: "16:30", end: "19:30" },
        },
        saturday: null,
        sunday: null,
      },
      directionalService: [
        {
          window: "am_peak",
          direction: "forward",
          label: "AM toward LAX City Bus Center",
        },
        {
          window: "pm_peak",
          direction: "reverse",
          label: "PM toward Encino / Granada Hills",
        },
      ],
      scheduleNotes:
        "Peak-period LADOT Commuter Express window; estimated waits only, not realtime departures.",
    },
    source: {
      name: "LADOT Transit route list and legacy VeloRail transit_data.js audit boundary",
      url: "https://www.ladotbus.com/simple/regions/8/routes",
      reviewedAt: "2026-06-06",
      confidence: "medium",
      notes: "Coarse anchors only.",
    },
    stations: [
      { name: "Granada Hills (Zelzah/Chatsworth)", lat: 34.265, lon: -118.524 },
      { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 },
      { name: "LAX City Bus Center", lat: 33.96, lon: -118.404 },
    ],
  },
};
