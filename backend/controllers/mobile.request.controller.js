const Request = require("../models/request.model");
const Item = require("../models/item.model");
const Transaction = require("../models/transaction.model");
const Setting = require("../models/setting.model");
const AuditLog = require("../models/auditLog.model");
const sendEmail = require("../utils/email");
const NotificationService = require("../services/notification.service");
const NotificationHelper = require("../services/notification-helper.service");
const Role = require("../models/role.model");
const User = require("../models/user.model");
const config = require("../config/config");

// Configuration constants
const DEFAULT_MAX_QUEUES = 3;

// Helper function to send admin notifications
const sendAdminNotifications = async (title, message, entityType, entityId) => {
  try {
    const admins = await User.find({
      roles: { $exists: true, $ne: [] },
      status: "Active",
    })
      .limit(5)
      .lean();

    for (const admin of admins) {
      await NotificationService.sendNotification({
        userId: admin._id,
        title,
        message,
        type: entityType === "Request" ? "ItemRequest" : "System",
        entityType,
        entityId,
      });
    }
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
};

// Create a new request
exports.createRequest = async (req, res) => {
  try {
    const { itemId, requestType, notes } = req.body;

    // Validate item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if user already has an active request for this item
    const existingRequest = await Request.findOne({
      userId: req.user._id,
      itemId,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have an active request for this item",
      });
    }

    // Check if user already has this item
    const existingTransaction = await Transaction.findOne({
      userId: req.user._id,
      itemId,
      returnDate: null,
    });

    if (existingTransaction && requestType === "Borrow") {
      return res.status(400).json({
        success: false,
        message: "You already have this item",
      });
    }

    // ADD TO QUEUE ONLY WHEN ITEM IS NOT AVAILABLE
    if (requestType === "Borrow" && item.availableCopies === 0) {
      // Get borrowing limits setting
      const maxQueuesSetting = await Setting.findOne({
        key: "maxConcurrentQueues",
        group: "borrowingLimits",
      });

      const maxQueues = maxQueuesSetting
        ? maxQueuesSetting.value
        : parseInt(process.env.MAX_CONCURRENT_QUEUES) || DEFAULT_MAX_QUEUES;

      // Count user's active queue requests
      const activeQueueCount = await Request.countDocuments({
        userId: req.user._id,
        status: "Pending",
        requestType: "Borrow",
      });

      if (activeQueueCount >= maxQueues) {
        return res.status(400).json({
          success: false,
          message: `You have reached the maximum limit of ${maxQueues} queue requests`,
        });
      }

      // Add User to the queue
      let queue = await Queue.findOne({ itemId });
      if (!queue) {
        queue = await Queue.create({
          itemId,
          queueMembers: [],
        });
      }

      // Check if user already in queue
      const alreadyInQueue = queue.queueMembers.some((m) =>
        m.userId.equals(userId)
      );

      if (!alreadyInQueue) {
        queue.queueMembers.push({
          userId,
          position: queue.queueMembers.length + 1,
          dateJoined: new Date(),
          status: "waiting",
        });
        await queue.save();

        //send email
        setImmediate(async () => {
          try {
            await sendEmail({
              email: req.user.email,
              subject: "Added to Queue",
              html: `<p>Your request for "${item.title}" has been added to the queue successfully.</p>`,
            });
          } catch (error) {
            console.error("Failed to send email:", error);
          }
        });

        // Send notification to admins
        setImmediate(() => {
          sendAdminNotifications(
            "New Queue Addition",
            `${req.user.fullName} has been added to the queue for "${item.title}".`,
            "QueueNotification",
            request._id
          );
        });
      }
    }

    // ALWAYS CREATE REQUEST
    const request = await Request.create({
      userId: req.user._id,
      itemId,
      requestType,
      requestDate: new Date(),
      status: "Pending",
      notes,
      createdBy: req.user._id,
    });

    // Log the action (async)
    setImmediate(() => {
      AuditLog.create({
        userId: req.user._id,
        actionType: "create",
        entityType: "request",
        entityId: request._id,
        details: { itemId, requestType },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(console.error);
    });

    // Send notification to admins (async, don't wait)
    setImmediate(() => {
      sendAdminNotifications(
        "New Item Request",
        `${req.user.fullName} has requested "${item.title}".`,
        "Request",
        request._id
      );
    });

    // Send email notification (async, don't wait)
    setImmediate(async () => {
      try {
        await sendEmail({
          email: req.user.email,
          subject: "Request Submitted Successfully",
          html: `<p>Your request for "${item.title}" has been submitted successfully.</p>`,
        });
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    });

    res.status(201).json({
      success: true,
      message: "Request created successfully",
      data: request,
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating request",
    });
  }
};

// Get user's requests
exports.getUserRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination (optimized)
    const requests = await Request.find(query)
      .populate("itemId", "title typeSpecificFields")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format requests for mobile app compatibility
    const requestsWithImages = requests.map((request) => {
      const formattedRequest = {
        _id: request._id,
        name: request.itemId?.title || "Unknown Item",
        description: request.notes || "",
        category: request.itemId?.categoryId?.name || "Unknown Category",
        status: request.status.toLowerCase(),
        requestedAt: request.requestDate,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        itemId: request.itemId,
        requestType: request.requestType,
        urgency: request.urgency,
      };

      if (request.itemId && request.itemId.typeSpecificFields) {
        formattedRequest.itemId.image = request.itemId.typeSpecificFields.image;
      }

      return formattedRequest;
    });

    // Get total count for pagination
    const totalRequests = await Request.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      total: totalRequests,
      totalPages: Math.ceil(totalRequests / parseInt(limit)),
      currentPage: parseInt(page),
      data: requestsWithImages,
    });
  } catch (error) {
    console.error("Get user requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving requests",
    });
  }
};

// Item Request Functions (User Sharing System)
const ItemRequest = require("../models/itemRequest.model");
const Category = require("../models/category.model");

// User submits request to add their item
exports.submitAddItemRequest = async (req, res) => {
  try {
    const {
      itemName,
      itemDescription,
      itemImage,
      categoryId,
      condition,
      availableFrom,
      availableUntil,
    } = req.body;

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const itemRequest = await ItemRequest.create({
      requestType: "ADD_ITEM",
      requestedBy: req.user._id,
      itemName,
      itemDescription,
      itemImage,
      categoryId,
      condition,
      availableFrom,
      availableUntil,
    });

    const donation = await Donation.create({
      userId: req.user._id,
      itemName: itemName,
      description: itemDescription,
      condition: condition,
      availableDate: availableFrom || new Date(),
      status: "Pending",
      photos: itemImage ? [{ url: itemImage, caption: itemName }] : [],
    });

    // Send notification to admins (async)
    setImmediate(() => {
      sendAdminNotifications(
        "New Donation Request",
        `${req.user.fullName} wants to donate "${itemName}".`,
        "ItemRequest",
        itemRequest._id
      );
    });

    // Send email notification (async)
    setImmediate(async () => {
      try {
        await sendEmail({
          email: req.user.email,
          subject: "Donation Request Submitted",
          html: `<p>Your donation request for "${itemName}" has been submitted successfully.</p>`,
        });
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    });

    res.status(201).json({
      success: true,
      message: "Duration-based Donation submitted successfully",
      data: itemRequest,
    });
  } catch (error) {
    console.error("Submit add item request error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting request",
    });
  }
};

// User submits request for needed item
exports.submitItemRequest = async (req, res) => {
  try {
    const {
      requestedItemName,
      requestedItemDescription,
      requestedCategoryId,
      urgency,
      neededBy,
    } = req.body;

    // Validate category exists
    const category = await Category.findById(requestedCategoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const itemRequest = await ItemRequest.create({
      requestType: "REQUEST_ITEM",
      requestedBy: req.user._id,
      requestedItemName,
      requestedItemDescription,
      requestedCategoryId,
      urgency,
      neededBy,
    });

    // Send notification to all admins
    try {
      const adminRoles = await Role.find({
        name: { $regex: "admin|super", $options: "i" },
      });

      if (adminRoles.length > 0) {
        const adminRoleIds = adminRoles.map((role) => role._id);
        const admins = await User.find({
          roles: { $in: adminRoleIds },
          status: "Active",
        });

        for (const admin of admins) {
          await NotificationService.sendNotification({
            userId: admin._id,
            title: "New Item Request",
            message: `${req.user.fullName} is looking for "${requestedItemName}".`,
            type: "ItemRequest",
            entityType: "ItemRequest",
            entityId: itemRequest._id,
          });
        }
      }
    } catch (notificationError) {
      console.error("Failed to send admin notification:", notificationError);
    }

    // Send email notification
    try {
      await sendEmail({
        email: req.user.email,
        subject: "Item Request Submitted",
        html: `
          <h2>Item Request Confirmation</h2>
          <p>Dear ${req.user.fullName},</p>
          <p>Your item request has been submitted successfully.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li>Item: ${requestedItemName}</li>
            <li>Category: ${category.name}</li>
            <li>Urgency: ${urgency}</li>
            <li>Status: Pending</li>
            <li>Submitted: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>We will search for this item and notify you if it becomes available.</p>
        `,
      });
    } catch (emailError) {
      console.error(
        "Failed to send item request confirmation email:",
        emailError
      );
    }

    res.status(201).json({
      success: true,
      message: "Item request submitted successfully",
      data: itemRequest,
    });
  } catch (error) {
    console.error("Submit item request error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting request",
    });
  }
};

// User views their own item requests
exports.getUserItemRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { requestedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ItemRequest.find(query)
      .populate("categoryId requestedCategoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ItemRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get user item requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving requests",
    });
  }
};

// Cancel a request
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in regular Request collection first
    let request = await Request.findById(id).populate("itemId", "title");
    let isItemRequest = false;

    // If not found, try ItemRequest collection
    if (!request) {
      request = await ItemRequest.findById(id).populate(
        "categoryId requestedCategoryId",
        "name"
      );
      isItemRequest = true;
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check if user owns this request
    const userId = isItemRequest ? request.requestedBy : request.userId;
    if (userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own requests",
      });
    }

    // Check if request can be cancelled
    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled",
      });
    }

    // Update request status to cancelled
    request.status = "Cancelled";
    await request.save();

    // Send notification about request cancellation
    await NotificationHelper.notifyRequestCancelled(request, req.user);

    // Send cancellation email
    try {
      const itemName = isItemRequest
        ? request.itemName || request.requestedItemName
        : request.itemId?.title || "Unknown Item";

      await sendEmail({
        email: req.user.email,
        subject: "Request Cancelled",
        html: `
          <h2>Request Cancellation Confirmation</h2>
          <p>Dear ${req.user.fullName},</p>
          <p>Your request has been cancelled successfully.</p>
          <p><strong>Cancelled Request:</strong></p>
          <ul>
            <li>Item: ${itemName}</li>
            <li>Cancelled Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can submit a new request anytime from the app.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      data: request,
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling request",
    });
  }
};

// Cancel an item request (donation/custom request)
exports.cancelItemRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const itemRequest = await ItemRequest.findById(id).populate(
      "categoryId requestedCategoryId",
      "name"
    );

    if (!itemRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check if user owns this request
    if (itemRequest.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own requests",
      });
    }

    // Check if request can be cancelled
    if (itemRequest.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled",
      });
    }

    // Update request status to cancelled
    itemRequest.status = "Cancelled";
    await itemRequest.save();

    // Note: Admin notification removed to prevent enum validation errors

    // Send cancellation email (don't let email errors break the cancellation)
    try {
      const itemName = itemRequest.itemName || itemRequest.requestedItemName;
      await sendEmail({
        email: req.user.email,
        subject: "Request Cancelled",
        html: `
          <h2>Request Cancellation Confirmation</h2>
          <p>Dear ${req.user.fullName},</p>
          <p>Your request has been cancelled successfully.</p>
          <p><strong>Cancelled Request:</strong></p>
          <ul>
            <li>Item: ${itemName}</li>
            <li>Cancelled Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can submit a new request anytime from the app.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
      // Don't throw error - cancellation should still succeed
    }

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      data: itemRequest,
    });
  } catch (error) {
    console.error("Cancel item request error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error cancelling request",
      // amazonq-ignore-next-line
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
