"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadFile = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: "dorgm2sje",
    api_key: "968116822669483",
    api_secret: "Z6P0u2ovIGMEzrzOPkZapfj252g",
});
const uploadFile = async (filePath) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath);
        console.log(result);
        return result;
    }
    catch (error) {
        console.log(error.message);
    }
};
exports.uploadFile = uploadFile;
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({}),
    limits: { fileSize: 500000 }
});
