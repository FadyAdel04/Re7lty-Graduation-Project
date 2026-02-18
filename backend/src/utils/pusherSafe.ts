import { getPusher } from "../services/pusher";

/**
 * Safely triggers a Pusher event, handling large payloads and potential errors.
 * Pusher has a 256KB limit for most plans.
 */
export async function safePusherTrigger(channel: string, event: string, data: any) {
    const pusher = getPusher();
    if (!pusher) return;

    try {
        // Create a deep copy to avoid modifying original data
        const strippedData = JSON.parse(JSON.stringify(data));

        // Helper to strip large base64 strings
        const stripLargeData = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string' && obj[key].startsWith('data:') && obj[key].length > 100000) {
                    console.log(`[Pusher] Stripping large base64 data from key: ${key} (${(obj[key].length / 1024).toFixed(1)}KB)`);
                    obj[key] = "__LARGE_DATA_OMITTED__";
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    stripLargeData(obj[key]);
                }
            }
        };

        stripLargeData(strippedData);

        // Check total size
        const size = JSON.stringify(strippedData).length;
        if (size > 250000) { // Safety margin under 256KB
            console.warn(`[Pusher] Payload still too large after stripping (${(size / 1024).toFixed(1)}KB). Aborting trigger.`);
            return;
        }

        await pusher.trigger(channel, event, strippedData);
    } catch (error) {
        console.error(`[Pusher] Error triggering event ${event} on ${channel}:`, error);
    }
}
