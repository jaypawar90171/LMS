"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const itemSchema = new mongoose_2.default.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    authorOrCreator: {
        type: String,
    },
    isbnOrIdentifier: {
        type: String,
        unique: true,
        sparse: true, //allows multiple null values
    },
    description: {
        type: String,
    },
    publisherOrManufacturer: {
        type: String,
    },
    publicationYear: {
        type: Number,
    },
    price: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    availableCopies: {
        type: Number,
        required: true,
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    subcategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
    },
    barcode: {
        type: String,
        unique: true,
        required: true,
    },
    defaultReturnPeriod: {
        type: Number,
    },
    mediaUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Available", "Issued", "Lost", "Damaged"],
        default: "Available",
    },
    size: {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    color: { type: String },
    genderType: {
        type: String,
        enum: ["Men", "Women", "Unisex", "Kids"],
    },
    warrantyPeriod: { type: String },
    features: [{ type: String }],
    dimensions: { type: String },
    usageType: { type: String },
    usage: { type: String },
    ageGroup: {
        type: String,
        enum: ["0-3", "4-7", "8-12", "13+"],
    },
    powerSource: { type: String },
}, { timestamps: true });
const InventoryItem = mongoose_2.default.model("InventoryItem", itemSchema);
exports.default = InventoryItem;
