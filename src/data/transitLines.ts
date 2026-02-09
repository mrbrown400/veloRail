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
      { name: "Wilshire/Western", lat: 34.0618, lon: -118.3088 }
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
      { name: "Pico", lat: 34.0407, lon: -118.2658 },
      { name: "LATTC/Ortho Institute", lat: 34.0318, lon: -118.2657 },
      { name: "Grand/LATTC", lat: 34.0253, lon: -118.2686 },
      { name: "San Pedro Street", lat: 34.0173, lon: -118.2553 },
      { name: "Washington", lat: 34.0017, lon: -118.2386 },
      { name: "Vernon", lat: 33.9853, lon: -118.2325 },
      { name: "Slauson", lat: 33.9665, lon: -118.2346 },
      { name: "Florence", lat: 33.9509, lon: -118.2360 },
      { name: "Firestone", lat: 33.9377, lon: -118.2355 },
      { name: "103rd Street/Watts Towers", lat: 33.9434, lon: -118.2475 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9285, lon: -118.2377 },
      { name: "Compton", lat: 33.8963, lon: -118.2207 },
      { name: "Artesia", lat: 33.8753, lon: -118.2236 },
      { name: "Del Amo", lat: 33.8489, lon: -118.2101 },
      { name: "Wardlow", lat: 33.8317, lon: -118.1950 },
      { name: "Willow Street", lat: 33.8073, lon: -118.1893 },
      { name: "Pacific Coast Highway", lat: 33.7926, lon: -118.1875 },
      { name: "Anaheim Street", lat: 33.7821, lon: -118.1875 },
      { name: "5th Street", lat: 33.7770, lon: -118.1887 },
      { name: "1st Street", lat: 33.7725, lon: -118.1880 },
      { name: "Downtown Long Beach", lat: 33.7679, lon: -118.1893 }
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
      { name: "Redondo Beach", lat: 33.8984, lon: -118.3766 },
      { name: "Douglas", lat: 33.9024, lon: -118.3681 },
      { name: "El Segundo", lat: 33.9161, lon: -118.3523 },
      { name: "Mariposa", lat: 33.9276, lon: -118.3394 },
      { name: "Aviation/LAX", lat: 33.9387, lon: -118.3302 },
      { name: "Hawthorne/Lennox", lat: 33.9357, lon: -118.3068 },
      { name: "Crenshaw", lat: 33.9323, lon: -118.2845 },
      { name: "Vermont/Athens", lat: 33.9289, lon: -118.2755 },
      { name: "Harbor Freeway", lat: 33.9289, lon: -118.2604 },
      { name: "Willowbrook/Rosa Parks", lat: 33.9285, lon: -118.2377 },
      { name: "Long Beach Blvd", lat: 33.9285, lon: -118.2115 },
      { name: "Lakewood Blvd", lat: 33.9285, lon: -118.1425 },
      { name: "Norwalk", lat: 33.9288, lon: -118.1052 }
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
      { name: "Expo/Vermont", lat: 34.0117, lon: -118.2916 },
      { name: "Expo/Western", lat: 34.0184, lon: -118.3090 },
      { name: "Expo/Crenshaw", lat: 34.0201, lon: -118.3335 },
      { name: "Farmdale", lat: 34.0227, lon: -118.3509 },
      { name: "Expo/La Brea", lat: 34.0236, lon: -118.3660 },
      { name: "La Cienega/Jefferson", lat: 34.0237, lon: -118.3831 },
      { name: "Culver City", lat: 34.0283, lon: -118.3890 },
      { name: "Palms", lat: 34.0291, lon: -118.4045 },
      { name: "Westwood/Rancho Park", lat: 34.0362, lon: -118.4230 },
      { name: "Expo/Sepulveda", lat: 34.0368, lon: -118.4340 },
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
  }
};
