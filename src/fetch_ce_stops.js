
import { geocode } from './geocoding.js';

const stops = {
    // Port of LA - Long Beach - DTLA
    "LADOT CE 142": [
        "San Pedro Ports O'Call, San Pedro, CA",
        "Long Beach Transit Gallery, Long Beach, CA"
    ],
    "LADOT CE 409": [
        "Glendale College, Glendale, CA",
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 419": [
        "Chatsworth Station, Chatsworth, CA",
        "Union Station, Los Angeles, CA"
    ],
    // 422 already partially added, refining
    "LADOT CE 422": [
        "Thousand Oaks Transportation Center, Thousand Oaks, CA",
        "Hollywood/Highland, Los Angeles, CA",
        "7th St/Metro Center, Los Angeles, CA"
    ],
    "LADOT CE 423": [
        "Thousand Oaks Transportation Center, Thousand Oaks, CA",
        "Encino Park and Ride, Encino, CA",
        "USC, Los Angeles, CA",
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 431": [
        "Westwood Blvd & Weyburn Ave, Los Angeles, CA", // Westwood
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 437": [
        "Pacific Ave & Washington Blvd, Venice, CA",
        "Culver City Transit Center, Culver City, CA",
        "7th St/Metro Center, Los Angeles, CA"
    ],
    // 438 already added, verifying
    "LADOT CE 438": [
        "Redondo Beach Pier, Redondo Beach, CA",
        "Harbor Gateway Transit Center, Gardena, CA",
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 439": [
        "Douglas Station, El Segundo, CA",
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 448": [
        "Rancho Palos Verdes (Hawthorne & Crest), Rancho Palos Verdes, CA", // Approx start
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 534": [
        //"West LA" vague, assuming Getty or Westwood
        "Sepulveda Blvd & National Blvd, Los Angeles, CA",
        "Union Station, Los Angeles, CA"
    ],
    "LADOT CE 549": [
        "Pasadena (Del Mar Station), Pasadena, CA",
        "Glendale (Brand & Broadway), Glendale, CA",
        "Encino Park and Ride, Encino, CA"
    ],
    "LADOT CE 573": [
        "Encino Park and Ride, Encino, CA",
        "Century City (Constellation & Ave of Stars), Los Angeles, CA"
    ],
    "LADOT CE 574": [
        "Granada Hills (Chatsworth & Zelzah), Granada Hills, CA",
        "Encino Park and Ride, Encino, CA",
        "LAX City Bus Center, Los Angeles, CA"
    ],
    "LADOT Union/Bunker": [
        "Union Station, Los Angeles, CA",
        "Bunker Hill (Grand & 3rd), Los Angeles, CA"
    ]
};

async function fetchAll() {
    const results = {};
    for (const [line, locations] of Object.entries(stops)) {
        console.log(`Fetching ${line}...`);
        results[line] = [];
        for (const loc of locations) {
            try {
                const coords = await geocode(loc);
                if (coords) {
                    results[line].push({ name: loc.split(',')[0], lat: coords.lat, lon: coords.lon });
                    console.log(`  Found: ${loc}`);
                } else {
                    console.log(`  NOT FOUND: ${loc}`);
                }
                await new Promise(r => setTimeout(r, 1200));
            } catch (e) {
                console.error(`  Error ${loc}:`, e.message);
            }
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

fetchAll();
