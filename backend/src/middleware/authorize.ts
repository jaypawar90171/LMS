import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import Role from "../models/role.model";

export const authorize =
  (requiredPermissions: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).populate({
        path: "roles",
        populate: { path: "permissions" },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userPermissions: string[] = [];
      for (const role of user.roles as any) {
        if (role.permissions) {
          for (const perm of role.permissions as any) {
            userPermissions.push(perm.permissionKey || perm); 
          }
        }
      }

      const hasPermission = requiredPermissions.every((p) =>
        userPermissions.includes(p)
      );

      if (!hasPermission) {
        return res
          .status(403)
          .json({ error: "Forbidden: insufficient rights" });
      }

      next();
    } catch (error) {
      console.error("RBAC Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
