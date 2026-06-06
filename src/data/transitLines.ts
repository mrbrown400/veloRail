// LA Metro Transit Lines Data
// Re-exported from original transit_data.js with TypeScript types

import type { TransitLines } from '@/types';

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
  // Bounded LADOT Commuter Express first-pass dataset for active routing.
  // Source boundary: migrated from legacy VeloRail static records and checked against LADOT route pages
  // that describe these Commuter Express services as Monday-Friday routes. Times are peak-window estimates,
  // not realtime GTFS departures.
  "LADOT CE 431": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingWindows: {
        weekday: [{ start: "06:00", end: "09:00" }, { start: "16:00", end: "19:00" }]
      },
      scheduleNotes: "Weekday peak-only Commuter Express window; static estimate, not realtime.",
      sourceConfidence: "medium"
    },
    stations: [
      { name: "Westwood (Weyburn/Westwood)", lat: 34.0620, lon: -118.4455 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 }
    ]
  },
  "LADOT CE 437": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingWindows: {
        weekday: [{ start: "06:00", end: "09:00" }, { start: "16:00", end: "19:00" }]
      },
      scheduleNotes: "Weekday peak-only Commuter Express window; static estimate, not realtime.",
      sourceConfidence: "medium"
    },
    stations: [
      { name: "Venice (Pacific/Washington)", lat: 33.9859, lon: -118.4731 },
      { name: "Culver City", lat: 34.0284, lon: -118.3887 },
      { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 }
    ]
  },
  "LADOT CE 438": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequencyPeak: 20,
      frequencyOffpeak: null,
      operatingWindows: {
        weekday: [{ start: "05:30", end: "09:00" }, { start: "15:30", end: "19:00" }]
      },
      scheduleNotes: "Weekday peak-only Commuter Express window; static estimate, not realtime.",
      sourceConfidence: "medium"
    },
    stations: [
      { name: "Redondo Beach Pier", lat: 33.8397, lon: -118.3927 },
      { name: "Harbor Gateway", lat: 33.8693, lon: -118.2874 },
      { name: "Union Station", lat: 34.0561, lon: -118.2359 }
    ]
  },
  "LADOT CE 448": {
    color: "#0047BB",
    schedule: {
      type: "commuter_express",
      frequencyPeak: 30,
      frequencyOffpeak: null,
      operatingWindows: {
        weekday: [{ start: "05:30", end: "08:30" }, { start: "16:00", end: "19:00" }]
      },
      scheduleNotes: "Weekday peak-only Commuter Express window; static estimate, not realtime.",
      sourceConfidence: "medium"
    },
    stations: [
      { name: "Rancho Palos Verdes (Hawthorne/Crest)", lat: 33.7612, lon: -118.4061 },
      { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
      { name: "Union Station", lat: 34.0561, lon: -118.2375 }
    ]
  }

};
