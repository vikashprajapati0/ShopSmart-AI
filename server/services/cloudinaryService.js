import { v2 as cloudinary } from 'cloudinary';

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export const uploadImageBuffer = async (buffer, folder = 'shopsmart') => {
  if (!isCloudinaryConfigured()) {
    // Development fallback: return base64 data URI
    const base64Data = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64Data}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export default {
  uploadImageBuffer,
  isCloudinaryConfigured
};
