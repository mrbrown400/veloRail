
import { compareRoutes } from './routing.js';

async function runDebug() {
    console.log("Starting Debug...");
    try {
        const start = "Altadena, CA";
        const end = "South Los Angeles, CA";

        console.log(`Calling compareRoutes('${start}', '${end}')...`);
        const results = await compareRoutes(start, end);
        console.log("Results received:", results.length);
        results.forEach(r => console.log(`- ${r.label}: ${r.formattedDuration}`));

    } catch (e) {
        console.error("Debug Error:", e);
    }
}

runDebug();
