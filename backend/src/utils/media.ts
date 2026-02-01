import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/**
 * Uploads a base64 data URL to Cloudinary, or returns it as-is if Cloudinary is not configured
 * or if the input is not a base64 data URL.
 * 
 * @param dataUrl The base64 data URL or regular URL
 * @param subdir The subdirectory in Cloudinary (e.g., 'trips', 'companies')
 * @returns The resulting URL
 */
export const persistBase64 = async (dataUrl: string, subdir: string): Promise<string> => {
    const match = /^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
        // Not a base64 data URL, return as-is (already a URL)
        return dataUrl;
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn(`[Media Upload] Cloudinary not configured. Storing media as base64 in MongoDB.`);
        return dataUrl; // Fallback to base64
    }

    const [, mediaType, ext, b64] = match;

    try {
        // Upload to Cloudinary (accepts data URL string directly)
        const uploadResult = await cloudinary.uploader.upload(
            `data:${mediaType}/${ext};base64,${b64}`,
            {
                folder: `re7lty/${subdir}`,
                resource_type: 'auto', // Let Cloudinary auto-detect the resource type
            }
        );

        console.log(`[Media Upload] Successfully uploaded to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url; // Return Cloudinary URL
    } catch (error: any) {
        console.error(`[Media Upload] Cloudinary upload failed: ${error.message}. Falling back to base64.`);
        return dataUrl; // Fallback to base64 on error
    }
};
