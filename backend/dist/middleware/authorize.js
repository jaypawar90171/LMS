"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const authorize = (requiredPermissions) => async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await user_model_1.default.findById(userId).populate({
            path: "roles",
            populate: { path: "permissions" },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const userPermissions = [];
        for (const role of user.roles) {
            if (role.permissions) {
                for (const perm of role.permissions) {
                    userPermissions.push(perm.permissionKey || perm);
                }
            }
        }
        const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));
        if (!hasPermission) {
            return res
                .status(403)
                .json({ error: "Forbidden: insufficient rights" });
        }
        next();
    }
    catch (error) {
        console.error("RBAC Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.authorize = authorize;
