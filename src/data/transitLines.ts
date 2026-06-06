// LA Metro Transit Lines Data
// Re-exported from original transit_data.js with TypeScript types

import type { TransitLines } from '@/types';
import {
  LADOT_COMMUTER_EXPRESS_PATTERNS,
  LADOT_COMMUTER_EXPRESS_STATIONS,
} from '@/data/ladotCommuterExpressStops';

const LADOT_COMMUTER_EXPRESS_SOURCE = {
  name: "LADOT GTFS static feed and LADOT Transit route pages",
  url: "https://ladotbus.com/gtfs",
  reviewedAt: "2026-06-06",
  confidence: "medium",
  notes:
    "Explicit stop patterns from official LADOT GTFS; schedule windows remain coarse route-page estimates.",
} as const;

export const TRANSIT_LINES: TransitLines = {
  "Red": {
    color: "#E31837",
    gtfsRouteId: "802",
    schedule: {
      type: "rail",
      frequency: 6
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "Civic Center/Grand Park", lat: 34.0549, lon: -118.2460 },
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
      { name: "North Hollywood", lat: 34.1685, lon: -118.3765 }
    ]
  },
  "Purple": {
    color: "#A05DA5",
    gtfsRouteId: "805",
    schedule: {
      type: "rail",
      frequency: 6
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Wilshire/Vermont", lat: 34.0617, lon: -118.2917 },
      { name: "Wilshire/Normandie", lat: 34.0618, lon: -118.3014 },
      { name: "Wilshire/Western", lat: 34.0618, lon: -118.3088 },
      { name: "Wilshire/La Brea", lat: 34.0619, lon: -118.3440 },
      { name: "Wilshire/Fairfax", lat: 34.0631, lon: -118.3623 },
      { name: "Wilshire/La Cienega", lat: 34.0652, lon: -118.3762 }
    ]
  },
  "Blue": {
    color: "#0072CE",
    gtfsRouteId: "801",
    schedule: {
      type: "rail",
      frequency: 6
    },
    stations: [
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Pico", lat: 34.0407, lon: -118.2661 },
      { name: "LATTC/Ortho Institute", lat: 34.0318, lon: -118.2657 },
      { name: "Grand/LATTC", lat: 34.0332, lon: -118.2693 },
      { name: "San Pedro Street", lat: 34.0267, lon: -118.2555 },
      { name: "Washington", lat: 34.0196, lon: -118.2430 },
      { name: "Vernon", lat: 34.0040, lon: -118.2429 },
      { name: "Slauson", lat: 33.9888, lon: -118.2434 },
      { name: "Florence", lat: 33.9745, lon: -118.2427 },
      { name: "Firestone", lat: 33.9596, lon: -118.2426 },
      { name: "103rd Street/Watts Towers", lat: 33.9427, lon: -118.2425 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
      { name: "Compton", lat: 33.8959, lon: -118.2242 },
      { name: "Artesia", lat: 33.8760, lon: -118.2215 },
      { name: "Del Amo", lat: 33.8471, lon: -118.2111 },
      { name: "Wardlow", lat: 33.8188, lon: -118.1963 },
      { name: "Willow Street", lat: 33.8055, lon: -118.1889 },
      { name: "Pacific Coast Highway", lat: 33.7892, lon: -118.1895 },
      { name: "Anaheim Street", lat: 33.7820, lon: -118.1893 },
      { name: "5th Street", lat: 33.7725, lon: -118.1903 },
      { name: "1st Street", lat: 33.7686, lon: -118.1901 },
      { name: "Downtown Long Beach", lat: 33.7681, lon: -118.1929 }
    ]
  },
  "Green": {
    color: "#3CB371",
    gtfsRouteId: "803",
    schedule: {
      type: "rail",
      frequency: 8
    },
    stations: [
      { name: "Redondo Beach", lat: 33.8936, lon: -118.3698 },
      { name: "Douglas", lat: 33.9056, lon: -118.3862 },
      { name: "El Segundo", lat: 33.9160, lon: -118.3870 },
      { name: "Mariposa", lat: 33.9218, lon: -118.3879 },
      { name: "Aviation/LAX", lat: 33.9312, lon: -118.3887 },
      { name: "Hawthorne/Lennox", lat: 33.9268, lon: -118.3582 },
      { name: "Crenshaw", lat: 33.9294, lon: -118.3308 },
      { name: "Vermont/Athens", lat: 33.9283, lon: -118.2916 },
      { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
      { name: "Long Beach Blvd", lat: 33.9238, lon: -118.1884 },
      { name: "Lakewood Blvd", lat: 33.9160, lon: -118.1180 },
      { name: "Norwalk", lat: 33.9008, lon: -118.0827 }
    ]
  },
  "Gold": {
    color: "#FFD700",
    gtfsRouteId: "804",
    schedule: {
      type: "rail",
      frequency: 8
    },
    stations: [
      { name: "Union Station", lat: 34.0561, lon: -118.2375 },
      { name: "Little Tokyo/Arts District", lat: 34.0500, lon: -118.2375 },
      { name: "Pico/Aliso", lat: 34.0370, lon: -118.2315 },
      { name: "Mariachi Plaza", lat: 34.0312, lon: -118.2198 },
      { name: "Soto", lat: 34.0330, lon: -118.2104 },
      { name: "Indiana", lat: 34.0335, lon: -118.1940 },
      { name: "Maravilla", lat: 34.0335, lon: -118.1777 },
      { name: "East LA Civic Center", lat: 34.0334, lon: -118.1614 },
      { name: "Atlantic", lat: 34.0335, lon: -118.1533 }
    ]
  },
  "Expo": {
    color: "#66CDAA",
    gtfsRouteId: "806",
    schedule: {
      type: "rail",
      frequency: 6
    },
    stations: [
      { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
      { name: "Pico", lat: 34.0407, lon: -118.2658 },
      { name: "LATTC/Ortho Institute", lat: 34.0318, lon: -118.2657 },
      { name: "Jefferson/USC", lat: 34.0188, lon: -118.2793 },
      { name: "Expo Park/USC", lat: 34.0133, lon: -118.2857 },
      { name: "Expo/Vermont", lat: 34.0183, lon: -118.2923 },
      { name: "Expo/Western", lat: 34.0184, lon: -118.3090 },
      { name: "Expo/Crenshaw", lat: 34.0201, lon: -118.3335 },
      { name: "Farmdale", lat: 34.0227, lon: -118.3509 },
      { name: "Expo/La Brea", lat: 34.0236, lon: -118.3660 },
      { name: "La Cienega/Jefferson", lat: 34.0237, lon: -118.3831 },
      { name: "Culver City", lat: 34.0283, lon: -118.3890 },
      { name: "Palms", lat: 34.0291, lon: -118.4045 },
      { name: "Westwood/Rancho Park", lat: 34.0362, lon: -118.4230 },
      { name: "Expo/Sepulveda", lat: 34.0368, lon: -118.4395 },
      { name: "Expo/Bundy", lat: 34.0323, lon: -118.4530 },
      { name: "26th Street/Bergamot", lat: 34.0289, lon: -118.4669 },
      { name: "17th Street/SMC", lat: 34.0247, lon: -118.4792 },
      { name: "Downtown Santa Monica", lat: 34.0152, lon: -118.4963 }
    ]
  },
  "K Line": {
    color: "#F58220",
    gtfsRouteId: "807",
    schedule: {
      type: "light_rail",
      frequency: 10
    },
    stations: [
      { name: "Expo/Crenshaw", lat: 34.0201, lon: -118.3335 },
      { name: "Martin Luther King Jr", lat: 34.0095, lon: -118.3336 },
      { name: "Leimert Park", lat: 33.9994, lon: -118.3336 },
      { name: "Hyde Park", lat: 33.9920, lon: -118.3336 },
      { name: "Fairview Heights", lat: 33.9840, lon: -118.3336 },
      { name: "Downtown Inglewood", lat: 33.9611, lon: -118.3536 },
      { name: "Westchester/Veterans", lat: 33.9589, lon: -118.3765 },
      { name: "Aviation/Century", lat: 33.9465, lon: -118.3809 }
    ]
  },
  // Bounded LADOT Commuter Express active routing dataset.
  // Stop locations and patterns come from the official LADOT GTFS static feed.
  // Times are coarse schedule windows for routing, not realtime GTFS departures.
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 142"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 142"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 409"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 409"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 419"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 419"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 422"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 422"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 423"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 423"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 431"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 431"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 437"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 437"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 438"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 438"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 439"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 439"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 448"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 448"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 534"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 534"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 549"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 549"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 573"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 573"],
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
    source: LADOT_COMMUTER_EXPRESS_SOURCE,
    stations: LADOT_COMMUTER_EXPRESS_STATIONS["LADOT CE 574"],
    patterns: LADOT_COMMUTER_EXPRESS_PATTERNS["LADOT CE 574"],
  },

};
