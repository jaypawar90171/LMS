"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const activity_model_1 = __importDefault(require("../models/activity.model"));
/**
 * A reusable function to log user and system activities.
 *
 * @param actor - The user who performed the action.
 * @param actionType - The type of action performed (e.g., 'USER_CREATED').
 * @param target - The entity that was affected by the action.
 * @param description - A human-readable description of the activity.
 * @param metadata - Optional additional data about the event.
 */
const logActivity = async (actor, actionType, target, description, metadata) => {
    try {
        await activity_model_1.default.create({
            actor,
            actionType,
            target,
            description,
            metadata: metadata || {},
        });
        console.log(`Activity logged: ${description}`);
    }
    catch (error) {
        console.error("Failed to log activity:", error);
    }
};
exports.logActivity = logActivity;
