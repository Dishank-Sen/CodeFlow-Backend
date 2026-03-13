import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse, type UploadApiErrorResponse } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_API_SECRET!,
});

const uploadFile = (
  filePath: string,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> => {
  const uploadOptions: UploadApiOptions = {
    ...options,
    timeout: 120000, // custom timeout for slow uploads
  };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("No upload result returned from Cloudinary"));
        }
        resolve(result);
      }
    );
  });
};

export default uploadFile;
