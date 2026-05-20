
// Detailed station lists for major lines
// Reflected to current 2024/2025 system state (A/E line extensions, K Line, C Line)

export const TRANSIT_LINES = {
    "Red": { // B Line
        color: "#E31837",
        gtfsRouteId: "802", // LA Metro GTFS route_id for B Line
        schedule: {
            type: "rail",
            frequency_peak: 6,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:30", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
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
    "Purple": { // D Line
        color: "#A05DA5",
        gtfsRouteId: "805", // LA Metro GTFS route_id for D Line
        schedule: {
            type: "rail",
            frequency_peak: 6,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "04:30", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            // Current operating stations only
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
    // D Line Extension Sections 2 and 3 - Under Construction (separate entry until operational)
    "D Line Extension": {
        color: "#A05DA5", // Same purple as D Line
        gtfsRouteId: null,
        status: "under_construction",
        expectedOpening: "2027",
        schedule: {
            type: "rail",
            frequency_peak: 6,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "04:30", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            // Connection point to operating D Line
            { name: "Wilshire/La Cienega", lat: 34.0652, lon: -118.3762, note: "Transfer to D Line" },
            { name: "Wilshire/Rodeo", lat: 34.0668, lon: -118.3983, expectedOpening: "2027" },
            { name: "Century City/Constellation", lat: 34.0587, lon: -118.4158, expectedOpening: "2027" },
            { name: "Westwood/UCLA", lat: 34.0586, lon: -118.4444, expectedOpening: "2027" },
            { name: "Westwood/VA Hospital", lat: 34.0541, lon: -118.4547, expectedOpening: "2027" }
        ]
    },
    "Blue": { // A Line (Long Beach to Azusa)
        color: "#0072CE",
        gtfsRouteId: "801", // LA Metro GTFS route_id for A Line
        schedule: {
            type: "rail",
            frequency_peak: 6,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:00", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            // Foothill Extension (formerly Gold)
            { name: "APU/Citrus College", lat: 34.1369, lon: -117.8901 },
            { name: "Azusa Downtown", lat: 34.1358, lon: -117.9061 },
            { name: "Irwindale", lat: 34.1290, lon: -117.9336 },
            { name: "Duarte/City of Hope", lat: 34.1326, lon: -117.9680 },
            { name: "Monrovia", lat: 34.1331, lon: -118.0033 },
            { name: "Arcadia", lat: 34.1425, lon: -118.0288 },
            { name: "Sierra Madre Villa", lat: 34.1478, lon: -118.0813 },
            { name: "Allen", lat: 34.1518, lon: -118.1132 },
            { name: "Lake", lat: 34.1519, lon: -118.1324 },
            { name: "Memorial Park", lat: 34.1476, lon: -118.1479 },
            { name: "Del Mar", lat: 34.1426, lon: -118.1488 },
            { name: "Fillmore", lat: 34.1331, lon: -118.1482 },
            { name: "South Pasadena", lat: 34.1157, lon: -118.1573 },
            { name: "Highland Park", lat: 34.1112, lon: -118.1926 },
            { name: "Southwest Museum", lat: 34.0983, lon: -118.2067 },
            { name: "Heritage Square", lat: 34.0871, lon: -118.2126 },
            { name: "Lincoln/Cypress", lat: 34.0813, lon: -118.2199 },
            { name: "Chinatown", lat: 34.0635, lon: -118.2357 },
            { name: "Union Station", lat: 34.0561, lon: -118.2375 },
            { name: "Little Tokyo/Arts District", lat: 34.0487, lon: -118.2387 },
            { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
            // Original Blue Line
            { name: "Pico", lat: 34.0407, lon: -118.2661 },
            { name: "Grand/LATTC", lat: 34.0332, lon: -118.2693 },
            { name: "San Pedro St", lat: 34.0267, lon: -118.2555 },
            { name: "Washington", lat: 34.0196, lon: -118.2430 },
            { name: "Vernon", lat: 34.0040, lon: -118.2429 },
            { name: "Slauson", lat: 33.9888, lon: -118.2434 },
            { name: "Florence", lat: 33.9745, lon: -118.2427 },
            { name: "Firestone", lat: 33.9596, lon: -118.2426 },
            { name: "103rd St/Watts Towers", lat: 33.9427, lon: -118.2425 },
            { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
            { name: "Compton", lat: 33.8959, lon: -118.2242 },
            { name: "Artesia", lat: 33.8760, lon: -118.2215 },
            { name: "Del Amo", lat: 33.8471, lon: -118.2111 },
            { name: "Wardlow", lat: 33.8188, lon: -118.1963 },
            { name: "Willow St", lat: 33.8055, lon: -118.1889 },
            { name: "PCH", lat: 33.7892, lon: -118.1895 },
            { name: "Anaheim St", lat: 33.7820, lon: -118.1893 },
            { name: "5th St", lat: 33.7725, lon: -118.1903 },
            { name: "1st St", lat: 33.7686, lon: -118.1901 },
            { name: "Downtown Long Beach", lat: 33.7681, lon: -118.1929 },
            { name: "Pacific Av", lat: 33.7724, lon: -118.1932 }
        ]
    },
    "Expo": { // E Line (Santa Monica to East LA)
        color: "#EAC71B",
        gtfsRouteId: "804", // LA Metro GTFS route_id for E Line
        schedule: {
            type: "rail",
            frequency_peak: 6,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:00", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            // Eastside Extension (formerly Gold)
            { name: "Atlantic", lat: 34.0334, lon: -118.1540 },
            { name: "East LA Civic Center", lat: 34.0332, lon: -118.1614 },
            { name: "Maravilla", lat: 34.0331, lon: -118.1684 },
            { name: "Indiana", lat: 34.0343, lon: -118.1922 },
            { name: "Soto", lat: 34.0440, lon: -118.2106 },
            { name: "Mariachi Plaza", lat: 34.0473, lon: -118.2198 },
            { name: "Pico/Aliso", lat: 34.0478, lon: -118.2262 },
            { name: "Little Tokyo/Arts District", lat: 34.0487, lon: -118.2387 },
            { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
            // Original Expo Line
            { name: "Pico", lat: 34.0407, lon: -118.2661 },
            { name: "LATTC/Ortho Inst", lat: 34.0298, lon: -118.2737 },
            { name: "Jefferson/USC", lat: 34.0219, lon: -118.2783 },
            { name: "Expo Park/USC", lat: 34.0182, lon: -118.2861 },
            { name: "Expo/Vermont", lat: 34.0183, lon: -118.2923 },
            { name: "Expo/Western", lat: 34.0183, lon: -118.3090 },
            { name: "Expo/Crenshaw", lat: 34.0223, lon: -118.3353 },
            { name: "Farmdale", lat: 34.0239, lon: -118.3562 },
            { name: "Expo/La Brea", lat: 34.0253, lon: -118.3634 },
            { name: "La Cienega/Jefferson", lat: 34.0267, lon: -118.3734 },
            { name: "Culver City", lat: 34.0284, lon: -118.3887 },
            { name: "Palms", lat: 34.0291, lon: -118.4116 },
            { name: "Westwood/Rancho Park", lat: 34.0371, lon: -118.4239 },
            { name: "Expo/Sepulveda", lat: 34.0368, lon: -118.4395 },
            { name: "Expo/Bundy", lat: 34.0315, lon: -118.4533 },
            { name: "26th St/Bergamot", lat: 34.0280, lon: -118.4699 },
            { name: "17th St/SMC", lat: 34.0232, lon: -118.4812 },
            { name: "Downtown Santa Monica", lat: 34.0138, lon: -118.4954 }
        ]
    },
    "Green": { // C Line (Norwalk to Redondo Beach/K Line)
        color: "#58A738",
        gtfsRouteId: "803", // LA Metro GTFS route_id for C Line
        schedule: {
            type: "rail",
            frequency_peak: 8,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:00", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            { name: "Norwalk", lat: 33.9008, lon: -118.0827 },
            { name: "Lakewood Blvd", lat: 33.9160, lon: -118.1180 },
            { name: "Long Beach Blvd", lat: 33.9238, lon: -118.1884 },
            { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
            { name: "Avalon", lat: 33.9272, lon: -118.2294 },
            { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
            { name: "Vermont/Athens", lat: 33.9283, lon: -118.2916 },
            { name: "Crenshaw", lat: 33.9294, lon: -118.3308 },
            { name: "Hawthorne/Lennox", lat: 33.9268, lon: -118.3582 },
            { name: "Aviation/LAX", lat: 33.9312, lon: -118.3887 },
            { name: "Mariposa", lat: 33.9218, lon: -118.3879 }, // Shared/Interface
            { name: "El Segundo", lat: 33.9160, lon: -118.3870 },
            { name: "Douglas", lat: 33.9056, lon: -118.3862 },
            { name: "Redondo Beach", lat: 33.8936, lon: -118.3698 }
        ]
    },
    "K Line": { // Crenshaw/LAX
        color: "#E56DB1", // Pinkish
        gtfsRouteId: "807", // LA Metro GTFS route_id for K Line
        schedule: {
            type: "rail",
            frequency_peak: 8,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:30", end: "00:00" },
                saturday: { start: "05:00", end: "00:00" },
                sunday: { start: "05:00", end: "00:00" }
            }
        },
        stations: [
            { name: "Expo/Crenshaw", lat: 34.0223, lon: -118.3353 },
            { name: "Martin Luther King Jr.", lat: 34.0101, lon: -118.3353 },
            { name: "Leimert Park", lat: 34.0046, lon: -118.3328 },
            { name: "Hyde Park", lat: 33.9882, lon: -118.3323 },
            { name: "Fairview Heights", lat: 33.9740, lon: -118.3356 },
            { name: "Downtown Inglewood", lat: 33.9618, lon: -118.3508 },
            { name: "Westchester/Veterans", lat: 33.9452, lon: -118.3689 },
            // Connection to C Line
            { name: "Aviation/Century", lat: 33.9312, lon: -118.3887 },
            // LAX Transit Center (opened 2024)
            { name: "LAX Transit Center", lat: 33.9425, lon: -118.3890 }
        ]
    },
    "Orange": { // G Line (BRT)
        color: "#F58220",
        schedule: {
            type: "brt",
            frequency_peak: 4,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "04:00", end: "01:00" },
                saturday: { start: "04:30", end: "01:00" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            { name: "North Hollywood", lat: 34.1685, lon: -118.3765 },
            { name: "Laurel Canyon", lat: 34.1706, lon: -118.3965 },
            { name: "Valley College", lat: 34.1738, lon: -118.4180 },
            { name: "Woodman", lat: 34.1770, lon: -118.4385 },
            { name: "Van Nuys", lat: 34.1849, lon: -118.4485 },
            { name: "Sepulveda", lat: 34.1873, lon: -118.4674 },
            { name: "Woodley", lat: 34.1876, lon: -118.4811 },
            { name: "Balboa", lat: 34.1895, lon: -118.5028 },
            { name: "Reseda", lat: 34.1915, lon: -118.5367 },
            { name: "Tampa", lat: 34.1917, lon: -118.5539 },
            { name: "Pierce College", lat: 34.1892, lon: -118.5714 },
            { name: "De Soto", lat: 34.1856, lon: -118.5888 },
            { name: "Canoga", lat: 34.1904, lon: -118.5975 },
            { name: "Warner Center", lat: 34.1918, lon: -118.6053 },
            { name: "Chatsworth", lat: 34.2569, lon: -118.5986 }
        ]
    },
    "Silver": { // J Line (BRT)
        color: "#A0A9AC",
        schedule: {
            type: "brt",
            frequency_peak: 5,
            frequency_offpeak: 12,
            operating_hours: {
                weekday: { start: "04:00", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:00" }
            }
        },
        stations: [
            { name: "El Monte", lat: 34.0734, lon: -118.0465 },
            { name: "Cal State LA", lat: 34.0620, lon: -118.1705 },
            { name: "LAC+USC Medical Center", lat: 34.0583, lon: -118.2095 },
            { name: "Union Station", lat: 34.0561, lon: -118.2375 },
            { name: "Civic Center/Grand Park", lat: 34.0549, lon: -118.2460 },
            { name: "Pershing Square", lat: 34.0493, lon: -118.2513 },
            { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
            { name: "37th St/USC", lat: 34.0207, lon: -118.2773 },
            { name: "Slauson", lat: 33.9892, lon: -118.2755 },
            { name: "Manchester", lat: 33.9603, lon: -118.2783 },
            { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
            { name: "Rosecrans", lat: 33.9038, lon: -118.2842 },
            { name: "Harbor Gateway", lat: 33.8967, lon: -118.2831 },
            { name: "Carson", lat: 33.8340, lon: -118.2618 },
            { name: "PCH", lat: 33.7915, lon: -118.2788 },
            { name: "Pacific Ave/21st St", lat: 33.7335, lon: -118.2917 }
        ]
    },
    "Foothill Silver Streak": {
        color: "#C0C0C0", // Metallic Silver
        schedule: {
            type: "brt",
            frequency_peak: 15,
            frequency_offpeak: 30,
            operating_hours: {
                weekday: { start: "04:30", end: "23:30" },
                saturday: { start: "05:30", end: "22:30" },
                sunday: { start: "05:30", end: "22:30" }
            }
        },
        stations: [
            { name: "Montclair Transit Center", lat: 34.0940, lon: -117.6962 },
            { name: "Pomona Transit Center", lat: 34.0593, lon: -117.7514 },
            { name: "West Covina (Vincent Ave)", lat: 34.0700, lon: -117.9264 },
            { name: "El Monte Station", lat: 34.0767, lon: -118.0356 },
            { name: "Union Station", lat: 34.0561, lon: -118.2375 },
            { name: "Civic Center", lat: 34.0549, lon: -118.2460 },
            { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
            { name: "Pico/Flower", lat: 34.0399, lon: -118.2671 } // Terminus near Convention Center
        ]
    },
    // Commuter Express Lines
    "LADOT CE 142": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: 30,
            operating_hours: {
                weekday: { start: "05:30", end: "23:30" },
                saturday: { start: "06:00", end: "23:30" },
                sunday: { start: "06:00", end: "23:30" }
            }
        },
        stations: [{ name: "San Pedro Ports O'Call", lat: 33.7335, lon: -118.2764 }, { name: "Long Beach Transit Gallery", lat: 33.7709, lon: -118.1924 }]
    },
    "LADOT CE 409": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "09:00" }, pm_peak: { start: "15:30", end: "19:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Glendale College", lat: 34.1668, lon: -118.2323 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 419": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:00", end: "09:00" }, pm_peak: { start: "15:00", end: "19:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Chatsworth Station", lat: 34.2569, lon: -118.5986 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 422": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "09:00" }, pm_peak: { start: "15:30", end: "19:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Thousand Oaks Transp. Ctr", lat: 34.1750, lon: -118.8612 }, { name: "Warner Center", lat: 34.1797, lon: -118.5979 }, { name: "Universal City/Studio City", lat: 34.1394, lon: -118.3624 }, { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 }]
    },
    "LADOT CE 423": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "09:00" }, pm_peak: { start: "15:30", end: "19:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Thousand Oaks Transp. Ctr", lat: 34.1750, lon: -118.8612 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "USC", lat: 34.0224, lon: -118.2851 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 431": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:00", end: "09:00" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Westwood (Weyburn/Westwood)", lat: 34.0620, lon: -118.4455 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 437": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:00", end: "09:00" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Venice (Pacific/Washington)", lat: 33.9859, lon: -118.4731 }, { name: "Culver City", lat: 34.0284, lon: -118.3887 }, { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 }]
    },
    "LADOT CE 438": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "09:00" }, pm_peak: { start: "15:30", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Redondo Beach Pier", lat: 33.8397, lon: -118.3927 }, { name: "Harbor Gateway", lat: 33.8693, lon: -118.2874 }, { name: "Union Station", lat: 34.0561, lon: -118.2359 }]
    },
    "LADOT CE 439": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:00", end: "09:00" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "El Segundo (Douglas Stn)", lat: 33.9056, lon: -118.3862 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 448": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "08:30" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Rancho Palos Verdes (Hawthorne/Crest)", lat: 33.7612, lon: -118.4061 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 534": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:00", end: "09:00" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "West LA (Sepulveda/National)", lat: 34.0267, lon: -118.4116 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }]
    },
    "LADOT CE 549": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:00", end: "09:00" }, pm_peak: { start: "16:00", end: "19:00" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Pasadena (Del Mar)", lat: 34.1426, lon: -118.1488 }, { name: "Glendale (Brand/Broadway)", lat: 34.1470, lon: -118.2550 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }]
    },
    "LADOT CE 573": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 20,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "06:30", end: "09:00" }, pm_peak: { start: "16:00", end: "18:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "Century City", lat: 34.0577, lon: -118.4168 }]
    },
    "LADOT CE 574": {
        color: "#0047BB",
        schedule: {
            type: "commuter_express",
            frequency_peak: 30,
            frequency_offpeak: null,
            operating_hours: {
                weekday: { am_peak: { start: "05:30", end: "08:30" }, pm_peak: { start: "16:30", end: "19:30" } },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Granada Hills (Zelzah/Chatsworth)", lat: 34.2650, lon: -118.5240 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "LAX City Bus Center", lat: 33.9600, lon: -118.4040 }]
    },
    "Union/Bunker Shuttle": {
        color: "#0047BB",
        schedule: {
            type: "shuttle",
            frequency_peak: 5,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "06:30", end: "19:00" },
                saturday: null,
                sunday: null
            }
        },
        stations: [{ name: "Union Station", lat: 34.0561, lon: -118.2375 }, { name: "Bunker Hill (Grand/3rd)", lat: 34.0530, lon: -118.2510 }]
    },

    // LAX FlyAway Bus Service
    // Routes include freeway waypoints for accurate path display
    "LAX FlyAway - Union Station": {
        color: "#00629B", // FlyAway blue
        gtfsRouteId: null, // Operated by LAWA, separate from Metro GTFS
        schedule: {
            type: "airport_shuttle",
            frequency_peak: 30,
            frequency_offpeak: 30,
            operating_hours: {
                weekday: { start: "00:00", end: "23:59" }, // 24/7 operation
                saturday: { start: "00:00", end: "23:59" },
                sunday: { start: "00:00", end: "23:59" }
            }
        },
        stations: [
            { name: "Union Station", lat: 34.0561, lon: -118.2375 },
            // Route follows US-101 S → I-110 S → I-105 W → Sepulveda
            { name: "I-110 at US-101", lat: 34.0515, lon: -118.2560, waypoint: true },
            { name: "I-110 at I-10", lat: 34.0420, lon: -118.2680, waypoint: true },
            { name: "I-110 at Adams", lat: 34.0180, lon: -118.2740, waypoint: true },
            { name: "I-110 at Florence", lat: 33.9720, lon: -118.2770, waypoint: true },
            { name: "I-110/I-105 Interchange", lat: 33.9300, lon: -118.2770, waypoint: true },
            { name: "I-105 at Crenshaw", lat: 33.9300, lon: -118.3300, waypoint: true },
            { name: "I-105 at La Cienega", lat: 33.9300, lon: -118.3700, waypoint: true },
            { name: "I-105 at Sepulveda", lat: 33.9300, lon: -118.3950, waypoint: true },
            { name: "LAX Transit Center", lat: 33.9425, lon: -118.3890 },
            { name: "LAX Terminals", lat: 33.9425, lon: -118.4020 }
        ]
    },
    "LAX FlyAway - Van Nuys": {
        color: "#00629B", // FlyAway blue
        gtfsRouteId: null,
        schedule: {
            type: "airport_shuttle",
            frequency_peak: 30,
            frequency_offpeak: 45,
            operating_hours: {
                weekday: { start: "05:00", end: "00:00" },
                saturday: { start: "05:00", end: "00:00" },
                sunday: { start: "05:00", end: "00:00" }
            }
        },
        stations: [
            { name: "Van Nuys FlyAway Terminal", lat: 34.1935, lon: -118.4702 },
            // Route follows I-405 S to LAX
            { name: "I-405 at Burbank Blvd", lat: 34.1720, lon: -118.4670, waypoint: true },
            { name: "I-405 at Ventura Blvd", lat: 34.1500, lon: -118.4700, waypoint: true },
            { name: "I-405 at Mulholland Dr", lat: 34.1280, lon: -118.4720, waypoint: true },
            { name: "I-405 at Getty Center", lat: 34.0850, lon: -118.4750, waypoint: true },
            { name: "I-405 at Wilshire", lat: 34.0500, lon: -118.4650, waypoint: true },
            { name: "I-405 at Santa Monica Blvd", lat: 34.0350, lon: -118.4550, waypoint: true },
            { name: "I-405 at I-10", lat: 34.0250, lon: -118.4480, waypoint: true },
            { name: "I-405 at Culver Blvd", lat: 33.9950, lon: -118.4300, waypoint: true },
            { name: "I-405 at Howard Hughes", lat: 33.9700, lon: -118.4150, waypoint: true },
            { name: "I-405 at El Segundo", lat: 33.9350, lon: -118.3980, waypoint: true },
            { name: "LAX Transit Center", lat: 33.9425, lon: -118.3890 },
            { name: "LAX Terminals", lat: 33.9425, lon: -118.4020 }
        ]
    },

    // LAX Automated People Mover (APM) - Currently in testing
    "LAX People Mover": {
        color: "#006341", // LAX green
        gtfsRouteId: null,
        status: "testing", // testing | operating
        expectedOpening: "2026-06", // June 2026 (delayed from Jan 2026)
        schedule: {
            type: "people_mover",
            frequency_peak: 2, // Every 2 minutes when operating
            frequency_offpeak: 4,
            operating_hours: {
                weekday: { start: "00:00", end: "23:59" }, // 24/7 when operational
                saturday: { start: "00:00", end: "23:59" },
                sunday: { start: "00:00", end: "23:59" }
            }
        },
        stations: [
            { name: "LAX Transit Center", lat: 33.9425, lon: -118.3890 },
            { name: "LAX Economy Parking", lat: 33.9468, lon: -118.3855 },
            { name: "LAX Terminal 1", lat: 33.9545, lon: -118.3986 },
            { name: "LAX Terminal 2/3", lat: 33.9530, lon: -118.3977 },
            { name: "LAX Terminal 4/5", lat: 33.9521, lon: -118.3946 },
            { name: "LAX Terminal 6/7/8", lat: 33.9513, lon: -118.3903 },
            { name: "LAX Terminal B (TBIT)", lat: 33.9485, lon: -118.3895 }
        ]
    },

    // ========== FUTURE TRANSIT LINES ==========

    // Sepulveda Transit Corridor - LPA Approved Jan 2026
    // Automated heavy rail, fully tunneled (single-bore), ~13 miles, 8 stations
    // Source: https://www.metro.net/projects/sepulvedacorridor/
    "Sepulveda Transit Corridor": {
        color: "#FF6B00", // Placeholder orange - TBD by Metro
        gtfsRouteId: null,
        status: "planned",
        expectedOpening: "2040", // Phased, IOS (G Line to D Line) earlier
        schedule: {
            type: "heavy_rail",
            frequency_peak: 2.5, // 2.5-minute headways
            frequency_offpeak: 5,
            operating_hours: {
                weekday: { start: "05:00", end: "00:00" },
                saturday: { start: "05:00", end: "00:00" },
                sunday: { start: "06:00", end: "00:00" }
            }
        },
        stations: [
            { name: "Van Nuys Metrolink", lat: 34.1897, lon: -118.4495, note: "Northern terminus - Transfer to Metrolink" },
            { name: "Sherman Way", lat: 34.2010, lon: -118.4489, note: "Underground station" },
            { name: "Van Nuys", lat: 34.1849, lon: -118.4485, note: "Transfer to G Line & East SFV LRT" },
            { name: "Ventura Blvd", lat: 34.1430, lon: -118.4500 },
            { name: "UCLA Gateway Plaza", lat: 34.0705, lon: -118.4440 },
            { name: "Westwood/UCLA", lat: 34.0630, lon: -118.4450, note: "Transfer to D Line Extension" },
            { name: "Santa Monica Blvd", lat: 34.0450, lon: -118.4420 },
            { name: "Expo/Sepulveda", lat: 34.0368, lon: -118.4395, note: "Southern terminus - Transfer to E Line" }
        ]
    },

    // C Line Extension to Torrance - LPA Approved Jan 2026
    // Elevated light rail on Hawthorne Boulevard (Alternative 3)
    "C Line Extension": {
        color: "#58A738", // Same as C Line green
        gtfsRouteId: null,
        status: "planned",
        expectedOpening: "2036",
        schedule: {
            type: "light_rail",
            frequency_peak: 6,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "04:30", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            { name: "Redondo Beach", lat: 33.8936, lon: -118.3698, note: "Transfer to existing C Line" },
            { name: "182nd Street", lat: 33.8700, lon: -118.3520 },
            { name: "Torrance Transit Center", lat: 33.8317, lon: -118.3405 }
        ]
    },

    // East San Fernando Valley Light Rail - Under Construction
    // At-grade light rail in Van Nuys Blvd median, 6.7 miles, 11 stations
    // Interlined with Sepulveda Transit Corridor from Van Nuys to Van Nuys Metrolink
    // Source: https://www.metro.net/projects/east-sfv/
    "East San Fernando Valley": {
        color: "#FDB913", // Gold/yellow placeholder
        gtfsRouteId: null,
        status: "under_construction",
        expectedOpening: "2031",
        schedule: {
            type: "light_rail",
            frequency_peak: 6,
            frequency_offpeak: 10,
            operating_hours: {
                weekday: { start: "04:30", end: "00:30" },
                saturday: { start: "04:30", end: "00:30" },
                sunday: { start: "05:00", end: "00:30" }
            }
        },
        stations: [
            // Southern terminus at G Line, ordered south to north
            { name: "Van Nuys", lat: 34.1849, lon: -118.4485, note: "Transfer to G Line & Sepulveda Transit Corridor" },
            { name: "Van Nuys Metrolink", lat: 34.1897, lon: -118.4495, note: "Interlined with Sepulveda - Transfer to Metrolink" },
            { name: "Sherman Way", lat: 34.2010, lon: -118.4489, note: "Interlined with Sepulveda" },
            { name: "Roscoe Blvd", lat: 34.2210, lon: -118.4489 },
            { name: "Panorama City", lat: 34.2260, lon: -118.4489 },
            { name: "Nordhoff St", lat: 34.2350, lon: -118.4489 },
            { name: "San Fernando Rd", lat: 34.2550, lon: -118.4489 },
            { name: "Sylmar/San Fernando", lat: 34.2700, lon: -118.4489 },
            { name: "Pacoima", lat: 34.2760, lon: -118.4300 },
            { name: "Sylmar Metrolink", lat: 34.2830, lon: -118.4120, note: "Northern terminus - Transfer to Metrolink" }
        ]
    },

    // Metrolink Commuter Rail Lines
    "Metrolink Ventura": {
        color: "#55b135", // Metrolink green
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 30,
            frequency_offpeak: 60,
            operating_hours: {
                weekday: { start: "04:30", end: "22:00" },
                saturday: { start: "06:00", end: "22:00" },
                sunday: { start: "07:00", end: "21:00" }
            }
        },
        stations: [
            { name: "East Ventura", lat: 34.2756, lon: -119.2295 },
            { name: "Oxnard", lat: 34.1975, lon: -119.1803 },
            { name: "Camarillo", lat: 34.2164, lon: -119.0375 },
            { name: "Moorpark", lat: 34.2856, lon: -118.8764 },
            { name: "Simi Valley", lat: 34.2697, lon: -118.7381 },
            { name: "Chatsworth", lat: 34.2569, lon: -118.5986 },
            { name: "Northridge", lat: 34.2314, lon: -118.5667 },
            { name: "Van Nuys", lat: 34.1891, lon: -118.4492 },
            { name: "Burbank Downtown", lat: 34.1808, lon: -118.3089 },
            { name: "Burbank Airport North", lat: 34.1967, lon: -118.3556 },
            { name: "Glendale", lat: 34.1478, lon: -118.2553 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },
    "Metrolink Antelope Valley": {
        color: "#55b135",
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 45,
            frequency_offpeak: 90,
            operating_hours: {
                weekday: { start: "04:00", end: "22:30" },
                saturday: { start: "06:00", end: "22:00" },
                sunday: null
            }
        },
        stations: [
            { name: "Lancaster", lat: 34.6981, lon: -118.1367 },
            { name: "Palmdale", lat: 34.5794, lon: -118.1164 },
            { name: "Vincent Grade/Acton", lat: 34.4897, lon: -118.1972 },
            { name: "Via Princessa", lat: 34.4178, lon: -118.4908 },
            { name: "Santa Clarita", lat: 34.3867, lon: -118.5425 },
            { name: "Newhall", lat: 34.3847, lon: -118.5306 },
            { name: "Sylmar/San Fernando", lat: 34.3078, lon: -118.4697 },
            { name: "Sun Valley", lat: 34.2261, lon: -118.3933 },
            { name: "Burbank Airport North", lat: 34.1967, lon: -118.3556 },
            { name: "Burbank Downtown", lat: 34.1808, lon: -118.3089 },
            { name: "Glendale", lat: 34.1478, lon: -118.2553 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },
    "Metrolink San Bernardino": {
        color: "#55b135",
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 20,
            frequency_offpeak: 60,
            operating_hours: {
                weekday: { start: "04:00", end: "23:30" },
                saturday: { start: "05:30", end: "23:00" },
                sunday: { start: "06:00", end: "22:30" }
            }
        },
        stations: [
            { name: "San Bernardino Downtown", lat: 34.1083, lon: -117.2942 },
            { name: "San Bernardino Depot", lat: 34.1097, lon: -117.3014 },
            { name: "Rialto", lat: 34.1061, lon: -117.3703 },
            { name: "Fontana", lat: 34.0856, lon: -117.4350 },
            { name: "Rancho Cucamonga", lat: 34.0978, lon: -117.5647 },
            { name: "Upland", lat: 34.0975, lon: -117.6478 },
            { name: "Claremont", lat: 34.0964, lon: -117.7192 },
            { name: "Pomona North", lat: 34.0997, lon: -117.7650 },
            { name: "Covina", lat: 34.0900, lon: -117.8886 },
            { name: "Baldwin Park", lat: 34.0853, lon: -117.9653 },
            { name: "El Monte", lat: 34.0733, lon: -118.0275 },
            { name: "Cal State LA", lat: 34.0667, lon: -118.1672 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },
    "Metrolink Riverside": {
        color: "#55b135",
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 30,
            frequency_offpeak: 60,
            operating_hours: {
                weekday: { start: "05:00", end: "22:00" },
                saturday: { start: "07:00", end: "21:00" },
                sunday: null
            }
        },
        stations: [
            { name: "Riverside Downtown", lat: 33.9781, lon: -117.3764 },
            { name: "Riverside La Sierra", lat: 33.9375, lon: -117.4558 },
            { name: "Corona North Main", lat: 33.8911, lon: -117.5628 },
            { name: "Corona West", lat: 33.8669, lon: -117.5989 },
            { name: "Anaheim Canyon", lat: 33.8572, lon: -117.7519 },
            { name: "Orange", lat: 33.8044, lon: -117.8533 },
            { name: "Santa Ana", lat: 33.7456, lon: -117.8689 },
            { name: "Tustin", lat: 33.7339, lon: -117.8253 },
            { name: "Irvine", lat: 33.6569, lon: -117.7378 },
            { name: "Fullerton", lat: 33.8703, lon: -117.9253 },
            { name: "Buena Park", lat: 33.8486, lon: -117.9944 },
            { name: "Norwalk/Santa Fe Springs", lat: 33.9056, lon: -118.0681 },
            { name: "Commerce", lat: 34.0003, lon: -118.1597 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },
    "Metrolink Orange County": {
        color: "#55b135",
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 30,
            frequency_offpeak: 60,
            operating_hours: {
                weekday: { start: "04:30", end: "23:00" },
                saturday: { start: "06:00", end: "22:00" },
                sunday: { start: "07:00", end: "21:00" }
            }
        },
        stations: [
            { name: "Oceanside", lat: 33.1967, lon: -117.3792 },
            { name: "San Clemente", lat: 33.4147, lon: -117.6178 },
            { name: "San Juan Capistrano", lat: 33.5019, lon: -117.6625 },
            { name: "Laguna Niguel/Mission Viejo", lat: 33.5461, lon: -117.7003 },
            { name: "Irvine", lat: 33.6569, lon: -117.7378 },
            { name: "Tustin", lat: 33.7339, lon: -117.8253 },
            { name: "Santa Ana", lat: 33.7456, lon: -117.8689 },
            { name: "Orange", lat: 33.8044, lon: -117.8533 },
            { name: "Anaheim", lat: 33.8328, lon: -117.9139 },
            { name: "Fullerton", lat: 33.8703, lon: -117.9253 },
            { name: "Buena Park", lat: 33.8486, lon: -117.9944 },
            { name: "Norwalk/Santa Fe Springs", lat: 33.9056, lon: -118.0681 },
            { name: "Commerce", lat: 34.0003, lon: -118.1597 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },
    "Metrolink 91/Perris Valley": {
        color: "#55b135",
        type: "commuter_rail",
        schedule: {
            type: "commuter_rail",
            frequency_peak: 45,
            frequency_offpeak: 90,
            operating_hours: {
                weekday: { start: "05:00", end: "21:00" },
                saturday: null,
                sunday: null
            }
        },
        stations: [
            { name: "Perris Downtown", lat: 33.7819, lon: -117.2267 },
            { name: "Perris South", lat: 33.7556, lon: -117.2264 },
            { name: "Moreno Valley/March Field", lat: 33.8833, lon: -117.2569 },
            { name: "Riverside Downtown", lat: 33.9781, lon: -117.3764 },
            { name: "Riverside La Sierra", lat: 33.9375, lon: -117.4558 },
            { name: "Corona North Main", lat: 33.8911, lon: -117.5628 },
            { name: "Corona West", lat: 33.8669, lon: -117.5989 },
            { name: "Fullerton", lat: 33.8703, lon: -117.9253 },
            { name: "Buena Park", lat: 33.8486, lon: -117.9944 },
            { name: "Norwalk/Santa Fe Springs", lat: 33.9056, lon: -118.0681 },
            { name: "Commerce", lat: 34.0003, lon: -118.1597 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 }
        ]
    },

    // Amtrak Pacific Surfliner (Santa Barbara to Orange County section)
    "Amtrak Pacific Surfliner": {
        color: "#1C4E9D", // Amtrak blue
        type: "commuter_rail",
        schedule: {
            type: "intercity_rail",
            frequency_peak: 60,
            frequency_offpeak: 120,
            operating_hours: {
                weekday: { start: "05:00", end: "23:00" },
                saturday: { start: "06:00", end: "23:00" },
                sunday: { start: "06:00", end: "23:00" }
            }
        },
        stations: [
            { name: "Santa Barbara", lat: 34.4147, lon: -119.6858 },
            { name: "Goleta", lat: 34.4328, lon: -119.8269 },
            { name: "Carpinteria", lat: 34.3917, lon: -119.5186 },
            { name: "Ventura", lat: 34.2786, lon: -119.2931 },
            { name: "Oxnard", lat: 34.1975, lon: -119.1803 },
            { name: "Camarillo", lat: 34.2164, lon: -119.0375 },
            { name: "Moorpark", lat: 34.2856, lon: -118.8764 },
            { name: "Simi Valley", lat: 34.2697, lon: -118.7381 },
            { name: "Chatsworth", lat: 34.2569, lon: -118.5986 },
            { name: "Van Nuys", lat: 34.1891, lon: -118.4492 },
            { name: "Burbank Airport", lat: 34.1967, lon: -118.3556 },
            { name: "Glendale", lat: 34.1478, lon: -118.2553 },
            { name: "LA Union Station", lat: 34.0561, lon: -118.2375 },
            { name: "Commerce", lat: 34.0003, lon: -118.1597 },
            { name: "Norwalk/Santa Fe Springs", lat: 33.9056, lon: -118.0681 },
            { name: "Buena Park", lat: 33.8486, lon: -117.9944 },
            { name: "Fullerton", lat: 33.8703, lon: -117.9253 },
            { name: "Anaheim", lat: 33.8328, lon: -117.9139 },
            { name: "Orange", lat: 33.8044, lon: -117.8533 },
            { name: "Santa Ana", lat: 33.7456, lon: -117.8689 },
            { name: "Irvine", lat: 33.6569, lon: -117.7378 },
            { name: "San Juan Capistrano", lat: 33.5019, lon: -117.6625 },
            { name: "San Clemente", lat: 33.4147, lon: -117.6178 },
            { name: "Oceanside", lat: 33.1967, lon: -117.3792 }
        ]
    }
};
