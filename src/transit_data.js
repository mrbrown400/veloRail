
// Detailed station lists for major lines
// Reflected to current 2024/2025 system state (A/E line extensions, K Line, C Line)

export const TRANSIT_LINES = {
    "Red": { // B Line
        color: "#E31837",
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
        stations: [
            { name: "Union Station", lat: 34.0561, lon: -118.2375 },
            { name: "7th St/Metro Center", lat: 34.0486, lon: -118.2588 },
            { name: "Wilshire/Vermont", lat: 34.0617, lon: -118.2917 },
            { name: "Wilshire/Normandie", lat: 34.0618, lon: -118.3014 },
            { name: "Wilshire/Western", lat: 34.0618, lon: -118.3088 }
        ]
    },
    "Blue": { // A Line (Long Beach to Azusa)
        color: "#0072CE",
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
            { name: "Slauson", lat: 33.9892, lon: -118.2428 },
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
            { name: "Expo/Vermont", lat: 34.0182, lon: -118.2915 },
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
        stations: [
            { name: "Norwalk", lat: 33.9008, lon: -118.0827 },
            { name: "Lakewood Blvd", lat: 33.9160, lon: -118.1180 },
            { name: "Long Beach Blvd", lat: 33.9238, lon: -118.1884 },
            { name: "Willowbrook/Rosa Parks", lat: 33.9281, lon: -118.2384 },
            { name: "Avalon", lat: 33.9272, lon: -118.2294 },
            { name: "Harbor Freeway", lat: 33.9287, lon: -118.2891 },
            { name: "Vermont/Athens", lat: 33.9290, lon: -118.2917 },
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
        stations: [
            { name: "Expo/Crenshaw", lat: 34.0223, lon: -118.3353 },
            { name: "Martin Luther King Jr.", lat: 34.0101, lon: -118.3353 },
            { name: "Leimert Park", lat: 34.0046, lon: -118.3328 },
            { name: "Hyde Park", lat: 33.9882, lon: -118.3323 },
            { name: "Fairview Heights", lat: 33.9740, lon: -118.3356 },
            { name: "Downtown Inglewood", lat: 33.9618, lon: -118.3508 },
            { name: "Westchester/Veterans", lat: 33.9452, lon: -118.3689 },
            // Connection to C Line
            { name: "Aviation/Century", lat: 33.9312, lon: -118.3887 }
        ]
    },
    "Orange": { // G Line (BRT)
        color: "#F58220",
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
},
// Commuter Express Lines
"LADOT CE 142": { color: "#0047BB", stations: [{ name: "San Pedro Ports O'Call", lat: 33.7335, lon: -118.2764 }, { name: "Long Beach Transit Gallery", lat: 33.7709, lon: -118.1924 }] },
"LADOT CE 409": { color: "#0047BB", stations: [{ name: "Glendale College", lat: 34.1668, lon: -118.2323 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 419": { color: "#0047BB", stations: [{ name: "Chatsworth Station", lat: 34.2569, lon: -118.5986 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 422": { color: "#0047BB", stations: [{ name: "Thousand Oaks Transp. Ctr", lat: 34.1750, lon: -118.8612 }, { name: "Warner Center", lat: 34.1797, lon: -118.5979 }, { name: "Universal City/Studio City", lat: 34.1394, lon: -118.3624 }, { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 }] },
"LADOT CE 423": { color: "#0047BB", stations: [{ name: "Thousand Oaks Transp. Ctr", lat: 34.1750, lon: -118.8612 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "USC", lat: 34.0224, lon: -118.2851 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 431": { color: "#0047BB", stations: [{ name: "Westwood (Weyburn/Westwood)", lat: 34.0620, lon: -118.4455 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 437": { color: "#0047BB", stations: [{ name: "Venice (Pacific/Washington)", lat: 33.9859, lon: -118.4731 }, { name: "Culver City", lat: 34.0284, lon: -118.3887 }, { name: "7th St/Metro Center", lat: 34.0487, lon: -118.2587 }] },
"LADOT CE 438": { color: "#0047BB", stations: [{ name: "Redondo Beach Pier", lat: 33.8397, lon: -118.3927 }, { name: "Harbor Gateway", lat: 33.8693, lon: -118.2874 }, { name: "Union Station", lat: 34.0561, lon: -118.2359 }] },
"LADOT CE 439": { color: "#0047BB", stations: [{ name: "El Segundo (Douglas Stn)", lat: 33.9056, lon: -118.3862 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 448": { color: "#0047BB", stations: [{ name: "Rancho Palos Verdes (Hawthorne/Crest)", lat: 33.7612, lon: -118.4061 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 534": { color: "#0047BB", stations: [{ name: "West LA (Sepulveda/National)", lat: 34.0267, lon: -118.4116 }, { name: "Union Station", lat: 34.0561, lon: -118.2375 }] },
"LADOT CE 549": { color: "#0047BB", stations: [{ name: "Pasadena (Del Mar)", lat: 34.1426, lon: -118.1488 }, { name: "Glendale (Brand/Broadway)", lat: 34.1470, lon: -118.2550 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }] },
"LADOT CE 573": { color: "#0047BB", stations: [{ name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "Century City", lat: 34.0577, lon: -118.4168 }] },
"LADOT CE 574": { color: "#0047BB", stations: [{ name: "Granada Hills (Zelzah/Chatsworth)", lat: 34.2650, lon: -118.5240 }, { name: "Encino Park & Ride", lat: 34.1614, lon: -118.4988 }, { name: "LAX City Bus Center", lat: 33.9600, lon: -118.4040 }] },
"Union/Bunker Shuttle": { color: "#0047BB", stations: [{ name: "Union Station", lat: 34.0561, lon: -118.2375 }, { name: "Bunker Hill (Grand/3rd)", lat: 34.0530, lon: -118.2510 }] }
};
