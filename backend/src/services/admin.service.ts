import User from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { Types } from "mongoose";
import { promise } from "zod";
import InventoryItem from "../models/item.model";
import IssuedIetm from "../models/issuedItem.model";
import Category from "../models/category.model";
import Activity from "../models/activity.model";
import { IUser } from "../interfaces/user.interface";
import Role from "../models/role.model";
import { Permission } from "../models/permission.model";

interface loginDTO {
  email: string;
  password: string;
}

export const loginService = async (data: loginDTO) => {
  const { email, password } = data;
  if (!email || !password) {
    const err: any = new Error("Email and Password required");
    throw err;
  }

  const user = await User.findOne({
    email: email,
  })
    .select("+password")
    .exec();

  if (!user) {
    const err: any = new Error(`email '${email}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password!);
  if (!isMatch) {
    const err: any = new Error(`password not match.`);
    err.statusCode = 404;
    throw err;
  }

  const payload = {
    _id: user._id,
    email: user.email,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY!, {
    expiresIn: "10d",
  });
  return {
    user: {
      id: user._id,
      email: user.email,
    },
    token: token,
  };
};

export const forgotPasswordService = async (email: any) => {
  console.log(email);
  if (!email) {
    const err: any = new Error("Email is required");
    err.statusCode = 403;
    throw err;
  }

  const oldUser = await User.findOne({ email: email })
    .select("+password")
    .exec();

  if (!oldUser) {
    const err: any = new Error("Email does not exists");
    err.statusCode = 403;
    throw err;
  }

  const secret = process.env.SECRET_KEY + oldUser.password!;
  const payload = {
    id: oldUser._id,
    email: oldUser.email,
    username: oldUser.username,
  };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });

  const link = `http://localhost:3000/api/admin/auth/reset-password/${oldUser._id}/${token}`;
  return link;
};

export const verifyResetPasswordService = async (data: any) => {
  const { id, token } = data;

  const oldUser = await User.findOne({ _id: id }).select("+password").exec();
  if (!oldUser) {
    const err: any = new Error("User does not exists");
    err.statusCode = 403;
    throw err;
  }
  const secret = process.env.SECRET_KEY + oldUser.password!;
  try {
    const verify = jwt.verify(token, secret);
    if (typeof verify === "object" && "email" in verify) {
      console.log("email:", verify.email);
    } else {
      throw new Error("Invalid token payload or missing email.");
    }
    return verify;
  } catch (error: any) {
    return "not verified";
  }
};

export const resetPasswordService = async (data: any) => {
  const { id, token, newPassword, confirmPassword } = data;
  try {
    const oldUser = await User.findOne({ _id: id }).select("+password").exec();
    if (!oldUser) {
      const err: any = new Error("User does not exists");
      err.statusCode = 403;
      throw err;
    }
    const secret = process.env.SECRET_KEY + oldUser.password!;
    const verify = jwt.verify(token, secret);

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: { password: encryptedPassword },
      }
    );
    return verify;
  } catch (error) {}
};

export const updateUserStatusService = async (userId: any, status: string) => {
  if (status !== "Active" && status != "Inactive") {
    const err: any = new Error("Invalid status value provided.");
    err.statusCode = 400;
    throw err;
  }
  if (!Types.ObjectId.isValid(userId)) {
    const err: any = new Error("Invalid user ID format.");
    err.statusCode = 400;
    throw err;
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      $set: { status: status },
    },
    { new: true }
  );

  if (!updatedUser) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return updatedUser;
};

export const getDashboardSummaryService = async () => {
  const [
    totalItems,
    activeUsers,
    overdueItems,
    categories,
    recentActivityData,
  ] = await Promise.all([
    InventoryItem.countDocuments(),
    User.countDocuments({ status: "Active" }),
    IssuedIetm.countDocuments({
      status: "Issued",
      dueDate: { $lt: new Date() },
    }),
    Category.countDocuments(),
    Activity.find({}).sort({ createdAt: -1 }).limit(10).exec(),
  ]);

  const recentActivity = recentActivityData.map((activity) => ({
    user: activity.actor.name,
    action: activity.actionType,
    item: activity.target.name,
    date: activity.createdAt!.toISOString().split("T")[0],
  }));

  return { totalItems, activeUsers, overdueItems, categories, recentActivity };
};

export const getAllUsersService = async () => {
  const users = await User.find().select("-password");
  return users;
};

export const createUserService = async ({
  fullName,
  email,
  userName,
  password,
  role,
  emp_id,
  ass_emp_id,
}: any) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username: userName }],
  });
  if (existingUser) {
    const err: any = new Error(
      "User with this email or username already exists."
    );
    err.statusCode = 409;
    throw err;
  }

  const userRole = await Role.findOne({ roleName: role });
  if (!userRole) {
    const err: any = new Error(`Role '${role}' not found.`);
    err.statusCode = 400;
    throw err;
  }
  const newUser = new User({
    fullName: fullName,
    email: email,
    username: userName,
    password: password,
    roles: [userRole._id],
    employeeId: emp_id,
    associatedEmployeeId: ass_emp_id,
    status: "Inactive",
  });

  await newUser.save();
  return newUser;
};

export const getUserDetailsService = async (userId: any) => {
  const user = await User.findOne({ _id: userId });
  return user;
};

export const forcePasswordResetService = async (userId: any) => {
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { passwordResetRequired: true } },
    { new: true }
  );

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

export const fetchRolesService = async () => {
  const rolesWithPermissions = await Role.aggregate([
    {
      $lookup: {
        from: "permissions",
        localField: "permissions",
        foreignField: "_id",
        as: "permissions",
      },
    },
    {
      $project: {
        roleName: 1,
        description: 1,
        "permissions.permissionKey": 1,
        "permissions.description": 1,
      },
    },
  ]);

  if (!rolesWithPermissions?.length) {
    throw Object.assign(new Error("No roles found."), { statusCode: 404 });
  }

  return rolesWithPermissions;
};

export const createRoleService = async ({
  roleName,
  description,
  permissions,
}: {
  roleName: string;
  description?: string;
  permissions: string[];
}) => {
  const foundPermissions = await Permission.find({
    permissionKey: { $in: permissions },
  }).select("_id");

  if (!foundPermissions.length) {
    const err: any = new Error("One or more permissions not found.");
    err.statusCode = 400;
    throw err;
  }

  const permissionIds = foundPermissions.map((p) => p._id);

  const newRole = new Role({
    roleName,
    description,
    permissions: permissionIds,
  });

  newRole.save();
  return newRole;
};

export const updateRoleService = async ({
  roleId,
  roleName,
  description,
  permissions,
}: {
  roleId: string;
  roleName?: string;
  description?: string;
  permissions?: string[];
}) => {
  const updateData: any = {};

  if (roleName) {
    updateData.roleName = roleName;
  }

  if (description) {
    updateData.description = description;
  }

  if (permissions && permissions.length > 0) {
    const foundPermissions = await Permission.find({
      permissionKey: { $in: permissions },
    }).select("_id");

    if (foundPermissions.length !== permissions.length) {
      const err: any = new Error("One or more permissions not found.");
      err.statusCode = 400;
      throw err;
    }

    updateData.permissions = foundPermissions.map((p) => p._id);
  }

  if (Object.keys(updateData).length === 0) {
    const err: any = new Error("No valid fields provided for update.");
    err.statusCode = 400;
    throw err;
  }

  const updatedRole = await Role.findByIdAndUpdate(roleId, updateData, {
    new: true,
    runValidators: true,
  }).populate("permissions", "permissionKey description _id");

  return updatedRole;
};

export const deleteRoleService = async(roleId: string) => {
  const deletedRole  = await Role.findByIdAndDelete(roleId)

  if (!deletedRole) {
    const err: any = new Error("Role not found.");
    err.statusCode = 404;
    throw err;
  }

  return {
    message: "Role deleted successfully",
    data: deletedRole,
  };
}