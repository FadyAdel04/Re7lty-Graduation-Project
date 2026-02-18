import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/**
 * Determines the correct Cloudinary resource type based on MIME type.
 */
function getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'video'; // Cloudinary handles audio under video
    return 'raw'; // PDFs, documents, etc.
}

/**
 * Uploads a Buffer (from multer) to Cloudinary via stream.
 * This avoids the Node.js Buffer size limit issue with base64 strings.
 *
 * @param buffer    The file buffer from multer
 * @param mimeType  The MIME type of the file (e.g. 'image/jpeg', 'audio/webm')
 * @param subdir    Cloudinary subfolder (e.g. 'chat', 'trips')
 * @returns The Cloudinary secure URL
 */
export const uploadBufferToCloudinary = (buffer: Buffer, mimeType: string, subdir: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn(`[Media Upload] Cloudinary not configured. Cannot upload file.`);
            return reject(new Error('Cloudinary not configured'));
        }

        const resourceType = getResourceType(mimeType);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `re7lty/${subdir}`,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    console.error(`[Media Upload] Cloudinary stream upload failed:`, error);
                    return reject(error);
                }
                if (!result) return reject(new Error('No result from Cloudinary'));
                console.log(`[Media Upload] Successfully uploaded to Cloudinary: ${result.secure_url}`);
                resolve(result.secure_url);
            }
        );

        // Pipe the buffer as a readable stream
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};

/**
 * Uploads a base64 data URL to Cloudinary using stream (avoids buffer overflow),
 * or returns it as-is if Cloudinary is not configured or it's not a base64 URL.
 *
 * @param dataUrl The base64 data URL or regular URL
 * @param subdir The subdirectory in Cloudinary (e.g., 'trips', 'companies')
 * @returns The resulting URL
 */
export const persistBase64 = async (dataUrl: string, subdir: string): Promise<string> => {
    const match = /^data:(image|video|audio|application)\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
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
    const mimeType = `${mediaType}/${ext}`;

    try {
        // Convert base64 to buffer and upload via stream (avoids Node.js buffer size limits)
        const buffer = Buffer.from(b64, 'base64');
        return await uploadBufferToCloudinary(buffer, mimeType, subdir);
    } catch (error: any) {
        console.error(`[Media Upload] Cloudinary upload failed: ${error.message}. Falling back to base64.`);
        return dataUrl; // Fallback to base64 on error
    }
};
