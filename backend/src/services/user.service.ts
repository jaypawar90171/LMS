import User from "../models/user.model";
import Role from "../models/role.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import InventoryItem from "../models/item.model";
import IssuedItem from "../models/issuedItem.model";
import Queue from "../models/queue.model";
import Category from "../models/category.model";
import ItemRequest from "../models/itemRequest.model";
import Setting from "../models/setting.model";

interface RegisterDTO {
  fullName: string;
  email: string;
  userName: string;
  password: string;
  role: "employee" | "familyMember";
  emp_id?: string;
  ass_emp_id?: string;
}

interface loginDTO {
  email: string;
  password: string;
}

export const registerUserService = async (data: RegisterDTO) => {
  const { fullName, email, userName, password, role, emp_id, ass_emp_id } =
    data;

  // Check if email/username already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username: userName }],
  });
  if (existingUser) {
    const err: any = new Error(
      "A user with this email or username already exists."
    );
    err.statusCode = 409;
    throw err;
  }

  // Get role from Roles collection
  const userRole = await Role.findOne({ roleName: role });
  if (!userRole) {
    const err: any = new Error(`Role '${role}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const newUser = new User({
    fullName,
    email,
    username: userName,
    password,
    roles: [userRole._id],
    employeeId: role === "employee" ? emp_id : undefined,
    associatedEmployeeId: role === "familyMember" ? ass_emp_id : undefined,
  });

  await newUser.save();
  return newUser;
};

export const loginUserService = async (data: loginDTO) => {
  const { email, password } = data;

  if (!email || !password) {
    const err: any = new Error(`email and password required`);
    err.statusCode = 404;
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err: any = new Error(`password not match.`);
    err.statusCode = 404;
    throw err;
  }

  if (user.status !== "Active") {
    const err: any = new Error(
      "Your account is not active. Please contact the administrator."
    );
    err.statusCode = 403;
    throw err;
  }

  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY!, {
    expiresIn: "10d",
  });
  return {
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      fullName: user.fullName,
      status: user.status,
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

  const secret = process.env.SECRET_KEY + oldUser.password;
  const payload = {
    id: oldUser._id,
    email: oldUser.email,
    username: oldUser.username,
  };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });

  const link = `http://localhost:3000/api/user/auth/reset-password/${oldUser._id}/${token}`;
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
  const secret = process.env.SECRET_KEY + oldUser.password;
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
    const secret = process.env.SECRET_KEY + oldUser.password;
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

export const dashboardSummaryService = async (userId: string) => {
  const issuedItems = await IssuedItem.find({ userId })
    .populate({ path: "itemId", select: "name category" })
    .populate({ path: "issuedBy", select: "fullName" });

  const queuedItems = await Queue.find({ userId }).populate({
    path: "itemId",
    select: "name category",
  });

  const newArrivals = await InventoryItem.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return {
    issuedItems: issuedItems || [],
    queuedItems: queuedItems || [],
    newArrivals: newArrivals || [],
  };
};

export const getIssueddItemsSerive = async (userId: string) => {
  const isExistingUser = await User.findById(userId);
  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const issuedItems = await IssuedItem.find({ userId })
    .populate({ path: "userId", select: "fullName email" })
    .populate({ path: "itemId", select: "title description" });

  return issuedItems || [];
};

export const getCategoriesService = async () => {
  const categories = await Category.find({}, "name description").lean();

  if (!categories || categories.length === 0) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  return categories;
};

export const getCategoryItemsService = async (categoryId: string) => {
  const isCategoryExits = await Category.findById(categoryId);
  if (!isCategoryExits) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  const items = await InventoryItem.find({ categoryId: categoryId });
  if (!items || items.length === 0) {
    const err: any = new Error("No items found for this category");
    err.statusCode = 404;
    throw err;
  }

  return items;
};

export const getItemService = async (itemId: string) => {
  const items = await InventoryItem.findById(itemId).populate({
    path: "categoryId",
    select: "name description",
  });
  if (!items) {
    const err: any = new Error("No items found for this category");
    err.statusCode = 404;
    throw err;
  }

  return items;
};

export const getRequestedItemsSerice = async (userId: string) => {
  const isExistingUser = await User.findById(userId);
  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const requestedItems = ItemRequest.find({ userId: userId }).populate(
    "userId",
    "fullName email"
  );
  return requestedItems || [];
};

export const requestItemService = async (
  userId: string,
  validatedData: any
) => {
  const { title, authorOrCreator, itemType, reasonForRequest } = validatedData;

  const existingRequest = await ItemRequest.findOne({
    userId,
    title: title,
    status: "Pending",
  });

  if (existingRequest) {
    const err: any = new Error(
      "You have already requested this item and it’s still pending"
    );
    err.statusCode = 400;
    throw err;
  }

  const newRequest = new ItemRequest({
    userId,
    title: title,
    authorOrCreator: authorOrCreator,
    itemType: itemType,
    reasonForRequest: reasonForRequest,
    status: "Pending",
  });

  await newRequest.save();

  return newRequest;
};

export const getQueuedItemsService = async (userId: any) => {
  const isExistingUser = await User.findById(userId);

  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const queueItems = await Queue.find({ "queueMembers.userId": userId })
    .populate("itemId", "title description")
    .populate("queueMembers.userId", "fullName email");
  return queueItems || [];
};

export const extendIssuedItemService = async (itemId: string, userId: string) => {
   const issuedItem = await IssuedItem.findOne({ itemId, userId, status: "Issued" });
  if (!issuedItem) {
    const err: any = new Error("No active issued item found for this user");
    err.statusCode = 404;
    throw err;
  }

  const settings = await Setting.findOne();
  if (!settings || !settings.borrowingLimits) {
    const err: any = new Error("System borrowing limits not configured");
    err.statusCode = 500;
    throw err;
  }

  const { maxPeriodExtensions, extensionPeriodDays } = settings.borrowingLimits;

  if (issuedItem.extensionCount >= maxPeriodExtensions || issuedItem.extensionCount + 1 > issuedItem.maxExtensionAllowed) {
    const err: any = new Error("Maximum extension limit reached");
    err.statusCode = 400;
    throw err;
  }

  const newDueDate = new Date(issuedItem.dueDate);
  newDueDate.setDate(newDueDate.getDate() + extensionPeriodDays);

  issuedItem.dueDate = newDueDate;
  issuedItem.extensionCount += 1;

  await issuedItem.save();

  return issuedItem;
};
