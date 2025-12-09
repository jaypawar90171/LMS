import { v2 as cloudinary } from "cloudinary";
import multer from 'multer'
import dotenv from 'dotenv'
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFile = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    console.log(result);
    return result;
  } catch (error) {
    console.log(error.message);
  }
};

export const upload = multer({ 
  storage: multer.diskStorage({}),
  limits: {fileSize: 500000}
});


