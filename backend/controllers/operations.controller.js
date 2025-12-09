const Transaction = require("../models/transaction.model");
const Request = require("../models/request.model");
const Item = require("../models/item.model");
const ItemCopy = require("../models/itemCopy.model");
const User = require("../models/user.model");
const Fine = require("../models/fine.model");
const RenewalRequest = require("../models/renewalRequest.model");
const { ActivityLogger } = require("../utils/activity-logger");
const NotificationService = require("../services/notification.service");
const Notification = require("../models/notification.model");

// Issue an item to a user
exports.issueItem = async (req, res) => {
  try {
    const { itemId, userId, dueDate, notes } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue item to inactive or locked user",
      });
    }

    // Validate item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if item is available
    if (item.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No available copies of this item",
      });
    }

    // Find an available copy
    const copy = await ItemCopy.findOne({
      itemId: item._id,
      status: "Available",
    });

    if (!copy) {
      return res.status(400).json({
        success: false,
        message: "No available copies of this item",
      });
    }

    // Calculate due date if not provided
    const issueDueDate = dueDate ? new Date(dueDate) : new Date();
    if (!dueDate) {
      issueDueDate.setDate(issueDueDate.getDate() + item.defaultReturnPeriod);
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user._id,
      itemId: item._id,
      copyId: copy._id,
      issueDate: new Date(),
      dueDate: issueDueDate,
      status: "Issued",
      notes,
      createdBy: req.user._id,
    });

    // Update copy status
    copy.status = "Issued";
    copy.lastIssuedDate = new Date();
    copy.updatedBy = req.user._id;
    await copy.save();

    // Update item available copies count
    item.availableCopies -= 1;
    await item.save();

    // Log activity
    await ActivityLogger.itemIssue(
      req.user._id,
      item._id,
      item.title,
      user.fullName
    );

    // Check if there was a pending request for this user and item
    const pendingRequest = await Request.findOne({
      userId: user._id,
      itemId: item._id,
      status: "Pending",
      requestType: "Borrow",
    });

    if (pendingRequest) {
      pendingRequest.status = "Fulfilled";
      pendingRequest.transactionId = transaction._id;
      pendingRequest.reviewedBy = req.user._id;
      pendingRequest.reviewDate = new Date();
      await pendingRequest.save();
    }

    // Send notification to user about item issue
    try {
      await NotificationService.sendNotification({
        userId: user._id,
        title: "Item Issued",
        message: `"${
          item.title
        }" has been issued to you. Due date: ${issueDueDate.toLocaleDateString()}`,
        type: "ItemIssued",
        entityType: "Transaction",
        entityId: transaction._id,
        data: {
          itemId: item._id,
          dueDate: issueDueDate,
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to send item issue notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Item issued successfully",
      data: {
        transaction,
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
        },
        item: {
          id: item._id,
          title: item.title,
          barcode: item.barcode,
        },
        copy: {
          id: copy._id,
          copyNumber: copy.copyNumber,
          barcode: copy.barcode,
        },
        dueDate: issueDueDate,
      },
    });
  } catch (error) {
    console.error("Issue item error:", error);
    res.status(500).json({
      success: false,
      message: "Error issuing item",
    });
  }
};

// Return an issued item
exports.returnItem = async (req, res) => {
  try {
    const {
      itemId,
      userId,
      condition,
      isDamaged,
      isLost,
      damageDetails,
      notes,
    } = req.body;

    // Find the active transaction
    const transaction = await Transaction.findOne({
      userId,
      itemId,
      returnDate: null,
      status: { $in: ["Issued", "Overdue"] },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "No active transaction found for this user and item",
      });
    }

    // Get item and copy
    const item = await Item.findById(itemId);
    const copy = await ItemCopy.findById(transaction.copyId);
    const user = await User.findById(userId);

    if (!item || !copy || !user) {
      return res.status(404).json({
        success: false,
        message: "Item, copy, or user not found",
      });
    }

    // Update transaction
    transaction.returnDate = new Date();
    transaction.status = "Returned";
    transaction.updatedBy = req.user._id;

    // Handle condition - validate against allowed values
    const allowedConditions = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
    if (condition && allowedConditions.includes(condition)) {
      transaction.returnCondition = condition;
    }

    if (notes) {
      transaction.notes = transaction.notes
        ? `${transaction.notes}\n\nReturn notes: ${notes}`
        : `Return notes: ${notes}`;
    }

    await transaction.save();

    // Update copy status based on condition
    if (isLost) {
      copy.status = "Lost";
      copy.notes = copy.notes
        ? `${copy.notes}\n\nMarked as lost on return.`
        : "Marked as lost on return.";
    } else if (isDamaged) {
      copy.status = "Under Repair";
      copy.condition = "Damaged";
      copy.notes = copy.notes
        ? `${copy.notes}\n\n${damageDetails || "Damaged on return."}`
        : damageDetails || "Damaged on return.";
    } else {
      copy.status = "Available";
      if (condition && allowedConditions.includes(condition)) {
        copy.condition = condition;
      }
    }

    copy.updatedBy = req.user._id;
    await copy.save();

    // Update item available copies count if not lost or damaged
    if (!isLost && !isDamaged) {
      item.availableCopies += 1;
      await item.save();
    }

    // Check if the item was returned late and create fine if needed
    const isOverdue = transaction.dueDate < transaction.returnDate;
    let fine = null;

    if (isOverdue || isDamaged || isLost) {
      // Calculate fine amount
      let amount = 0;
      let reason = "";

      if (isOverdue) {
        // Calculate days overdue
        const dueDate = new Date(transaction.dueDate);
        const returnDate = new Date(transaction.returnDate);
        const daysOverdue = Math.ceil(
          (returnDate - dueDate) / (1000 * 60 * 60 * 24)
        );

        // Default fine rate: $1 per day overdue
        amount += daysOverdue * 1;
        reason = `Overdue by ${daysOverdue} days`;
      }

      if (isDamaged) {
        // Default damage fine: 50% of item price
        amount += item.price * 0.5;
        reason = reason ? `${reason}, Damaged` : "Damaged";
      }

      if (isLost) {
        // Lost item fine: full price of item
        amount += item.price;
        reason = reason ? `${reason}, Lost` : "Lost";
      }

      // Create fine record
      fine = await Fine.create({
        userId: user._id,
        itemId: item._id,
        transactionId: transaction._id,
        amount,
        reason,
        status: "Outstanding",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
        notes: `Fine created on return of item. ${damageDetails || ""}`,
        createdBy: req.user._id,
      });
    }

    // Log activity
    await ActivityLogger.itemReturn(
      req.user._id,
      item._id,
      item.title,
      user.fullName
    );

    // Check if there are pending requests for this item and process the queue
    await processItemQueue(item._id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Item returned successfully",
      data: {
        transaction,
        fine,
        isOverdue,
        isDamaged,
        isLost,
      },
    });
  } catch (error) {
    console.error("Return item error:", error);
    res.status(500).json({
      success: false,
      message: "Error returning item",
    });
  }
};

// Extend due date for an issued item
exports.extendDueDate = async (req, res) => {
  try {
    const { itemId, userId, newDueDate, reason } = req.body;

    // Validate new due date
    if (!newDueDate || new Date(newDueDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "New due date must be in the future",
      });
    }

    // Find the active transaction
    const transaction = await Transaction.findOne({
      userId,
      itemId,
      returnDate: null,
      status: { $in: ["Issued", "Overdue"] },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "No active transaction found for this user and item",
      });
    }

    // Check if the item is already overdue
    if (transaction.dueDate < new Date() && transaction.status === "Overdue") {
      return res.status(400).json({
        success: false,
        message: "Cannot extend due date for overdue items",
      });
    }

    // Get item and user
    const item = await Item.findById(itemId);
    const user = await User.findById(userId);

    if (!item || !user) {
      return res.status(404).json({
        success: false,
        message: "Item or user not found",
      });
    }

    // Update transaction
    const oldDueDate = new Date(transaction.dueDate);
    transaction.dueDate = new Date(newDueDate);
    transaction.extensionCount += 1;
    transaction.lastExtensionDate = new Date();
    transaction.status = "Issued"; // Reset status if it was marked as overdue
    transaction.notes = transaction.notes
      ? `${transaction.notes}\n\nDue date extended from ${
          oldDueDate.toISOString().split("T")[0]
        } to ${new Date(newDueDate).toISOString().split("T")[0]}. Reason: ${
          reason || "Not provided"
        }`
      : `Due date extended from ${oldDueDate.toISOString().split("T")[0]} to ${
          new Date(newDueDate).toISOString().split("T")[0]
        }. Reason: ${reason || "Not provided"}`;
    transaction.updatedBy = req.user._id;

    await transaction.save();

    // Check if there was a pending extension request
    const pendingRequest = await Request.findOne({
      userId: user._id,
      itemId: item._id,
      status: "Pending",
      requestType: "Extend",
    });

    if (pendingRequest) {
      pendingRequest.status = "Fulfilled";
      pendingRequest.reviewedBy = req.user._id;
      pendingRequest.reviewDate = new Date();
      await pendingRequest.save();
    }

    res.status(200).json({
      success: true,
      message: "Due date extended successfully",
      data: {
        transaction,
        oldDueDate,
        newDueDate: transaction.dueDate,
        extensionCount: transaction.extensionCount,
      },
    });
  } catch (error) {
    console.error("Extend due date error:", error);
    res.status(500).json({
      success: false,
      message: "Error extending due date",
    });
  }
};

// Get all transactions with filtering
exports.getTransactions = async (req, res) => {
  try {
    const {
      userId,
      itemId,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Add userId filter with validation
    if (userId) {
      if (typeof userId === "string" && /^[0-9a-fA-F]{24}$/.test(userId)) {
        query.userId = userId;
      }
    }

    // Add itemId filter with validation
    if (itemId) {
      if (typeof itemId === "string" && /^[0-9a-fA-F]{24}$/.test(itemId)) {
        query.itemId = itemId;
      }
    }

    // Add status filter with validation
    if (status) {
      const allowedStatuses = ["Issued", "Returned", "Overdue", "Pending"];
      if (typeof status === "string" && allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Add date range filter
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) {
        query.issueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.issueDate.$lte = new Date(toDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .select("+transactionId") // Ensure transactionId is included
      .populate("userId", "fullName email")
      .populate({
        path: "itemId",
        select: "title barcode categoryId",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .populate("copyId", "copyNumber barcode")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving transactions",
    });
  }
};

// Get all requests with filtering
exports.getRequests = async (req, res) => {
  try {
    const { status, requestType, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // Add status filter with validation
    if (status) {
      const allowedStatuses = [
        "Pending",
        "Approved",
        "Rejected",
        "Fulfilled",
        "Cancelled",
      ];
      if (typeof status === "string" && allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Add requestType filter with validation
    if (requestType) {
      const allowedRequestTypes = ["Borrow", "Reserve", "Extend"];
      if (
        typeof requestType === "string" &&
        allowedRequestTypes.includes(requestType)
      ) {
        query.requestType = requestType;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const requests = await Request.find(query)
      .populate("userId", "fullName email")
      .populate("itemId", "title barcode")
      .populate("reviewedBy", "fullName")
      .populate("createdBy", "fullName")
      .sort({ priority: -1, requestDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalRequests = await Request.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      total: totalRequests,
      totalPages: Math.ceil(totalRequests / parseInt(limit)),
      currentPage: parseInt(page),
      data: requests,
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving requests",
    });
  }
};

// Update request status (approve/reject)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Validate status
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    // Find request
    const request = await Request.findById(req.params.requestId)
      .populate("userId", "fullName email")
      .populate("itemId", "title barcode");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check if request is already processed
    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}`,
      });
    }

    // Update request
    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewDate = new Date();
    request.reviewNotes = notes;

    await request.save();

    // If approved and it's a borrow request, try auto-issue
    if (status === "Approved" && request.requestType === "Borrow") {
      const autoIssueResult = await tryAutoIssueItem(request, req.user._id);
      if (autoIssueResult) {
        return res.status(200).json({
          success: true,
          message: "Request approved and item issued automatically",
          data: autoIssueResult,
        });
      }
    }

    // Send notification to user
    try {
      let notificationTitle, notificationMessage;

      if (status === "Approved") {
        notificationTitle = "Request Approved";
        notificationMessage = `Your request for "${
          request.itemId.title
        }" has been approved. ${
          request.requestType === "Borrow"
            ? "You will be notified when the item is available for pickup."
            : ""
        }`;
      } else {
        notificationTitle = "Request Rejected";
        notificationMessage = `Your request for "${
          request.itemId.title
        }" has been rejected. ${notes ? `Reason: ${notes}` : ""}`;
      }

      await NotificationService.sendNotification({
        userId: request.userId._id,
        title: notificationTitle,
        message: notificationMessage,
        type: "RequestReview",
        entityType: "Request",
        entityId: request._id,
      });
    } catch (notificationError) {
      console.error("Failed to send user notification:", notificationError);
    }

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: request,
    });
  } catch (error) {
    console.error("Update request status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating request status",
    });
  }
};

// Get all items with active queues
exports.getQueues = async (req, res) => {
  try {
    const { search, itemType, page = 1, limit = 10 } = req.query;

    // Find all items with pending requests
    const itemsWithRequests = await Request.aggregate([
      {
        $match: {
          status: "Pending",
          requestType: "Borrow",
        },
      },
      {
        $group: {
          _id: "$itemId",
          queueLength: { $sum: 1 },
        },
      },
    ]);

    if (itemsWithRequests.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: Math.max(1, parseInt(page) || 1),
        data: [],
      });
    }

    // Get item IDs with queues
    const itemIds = itemsWithRequests.map((item) => item._id);

    // Build query for items
    const query = { _id: { $in: itemIds } };

    // Add itemType filter with validation
    if (itemType) {
      const allowedItemTypes = [
        "Book",
        "Journal",
        "Magazine",
        "DVD",
        "CD",
        "Equipment",
      ];
      if (typeof itemType === "string" && allowedItemTypes.includes(itemType)) {
        query.itemType = itemType;
      }
    }

    // Add search filter with validation
    if (search) {
      if (
        typeof search === "string" &&
        search.length <= 100 &&
        search.trim().length > 0
      ) {
        const sanitizedSearch = search.replace(/[^a-zA-Z0-9\s]/g, "").trim();
        if (sanitizedSearch.length >= 2) {
          query.$text = { $search: sanitizedSearch };
        }
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get items with queues
    const items = await Item.find(query)
      .populate("categoryId", "name")
      .sort({ title: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get all queue requests for these items in one query
    const allQueueRequests = await Request.find({
      itemId: { $in: itemIds },
      status: "Pending",
      requestType: "Borrow",
    })
      .populate("userId", "fullName email")
      .sort({ priority: -1, requestDate: 1 })
      .lean();

    // Group requests by itemId
    const requestsByItem = allQueueRequests.reduce((acc, req) => {
      const itemId = req.itemId.toString();
      if (!acc[itemId]) acc[itemId] = [];
      if (acc[itemId].length < 5) acc[itemId].push(req);
      return acc;
    }, {});

    // Build response with queue details
    const itemsWithQueueDetails = items.map((item) => {
      const queueItem = itemsWithRequests.find(
        (qItem) => qItem._id.toString() === item._id.toString()
      );
      const queueRequests = requestsByItem[item._id.toString()] || [];

      return {
        id: item._id,
        title: item.title,
        barcode: item.barcode,
        itemType: item.itemType,
        category: item.categoryId ? item.categoryId.name : null,
        availableCopies: item.availableCopies,
        queueLength: queueItem ? queueItem.queueLength : 0,
        topInQueue: queueRequests.map((req) => ({
          id: req._id,
          user: {
            id: req.userId._id,
            name: req.userId.fullName,
            email: req.userId.email,
          },
          requestDate: req.requestDate,
          priority: req.priority,
        })),
      };
    });

    // Get total count for pagination
    const totalItems = await Item.countDocuments(query);

    res.status(200).json({
      success: true,
      count: items.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      data: itemsWithQueueDetails,
    });
  } catch (error) {
    console.error("Get queues error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving queues",
    });
  }
};

// Get queue details for a specific item
exports.getItemQueue = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Validate item
    const item = await Item.findById(itemId).populate("categoryId", "name");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Get queue requests
    const queueRequests = await Request.find({
      itemId: item._id,
      status: "Pending",
      requestType: "Borrow",
    })
      .populate("userId", "fullName email phoneNumber")
      .populate("createdBy", "fullName")
      .sort({ priority: -1, requestDate: 1 });

    // Get current issues
    const currentIssues = await Transaction.find({
      itemId: item._id,
      returnDate: null,
      status: { $in: ["Issued", "Overdue"] },
    })
      .populate("userId", "fullName email")
      .populate("copyId", "copyNumber barcode");

    res.status(200).json({
      success: true,
      data: {
        item: {
          id: item._id,
          title: item.title,
          barcode: item.barcode,
          itemType: item.itemType,
          category: item.categoryId ? item.categoryId.name : null,
          availableCopies: item.availableCopies,
          totalCopies: item.quantity,
        },
        queueLength: queueRequests.length,
        queue: queueRequests,
        currentIssues,
      },
    });
  } catch (error) {
    console.error("Get item queue error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving item queue",
    });
  }
};

// Add user to item queue
exports.addToQueue = async (req, res) => {
  try {
    const { itemId, userId, priority, notes } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot add inactive or locked user to queue",
      });
    }

    // Validate item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if user already has an active transaction for this item
    const existingTransaction = await Transaction.findOne({
      userId,
      itemId,
      returnDate: null,
      status: { $in: ["Issued", "Overdue"] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "User already has this item issued",
      });
    }

    // Check if user is already in the queue for this item
    const existingRequest = await Request.findOne({
      userId,
      itemId,
      status: "Pending",
      requestType: "Borrow",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "User is already in the queue for this item",
      });
    }

    // Create request
    const request = await Request.create({
      userId,
      itemId,
      requestType: "Borrow",
      status: "Pending",
      notes,
      priority: priority || 0,
      createdBy: req.user._id,
    });

    // Check if we can issue immediately
    if (item.availableCopies > 0) {
      // Find an available copy
      const copy = await ItemCopy.findOne({
        itemId: item._id,
        status: "Available",
      });

      if (copy) {
        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + item.defaultReturnPeriod);

        // Create transaction
        const transaction = await Transaction.create({
          userId,
          itemId: item._id,
          copyId: copy._id,
          issueDate: new Date(),
          dueDate,
          status: "Issued",
          notes: `Auto-issued based on queue request #${request._id}`,
          createdBy: req.user._id,
        });

        // Update copy status
        copy.status = "Issued";
        copy.lastIssuedDate = new Date();
        copy.updatedBy = req.user._id;
        await copy.save();

        // Update item available copies count
        item.availableCopies -= 1;
        await item.save();

        // Update request
        request.status = "Fulfilled";
        request.transactionId = transaction._id;
        request.reviewedBy = req.user._id;
        request.reviewDate = new Date();
        await request.save();

        return res.status(200).json({
          success: true,
          message: "Item available and issued immediately",
          data: {
            request,
            transaction,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "User added to queue successfully",
      data: request,
    });
  } catch (error) {
    console.error("Add to queue error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding user to queue",
    });
  }
};

// Remove user from item queue
exports.removeFromQueue = async (req, res) => {
  try {
    const { itemId, userId } = req.params;
    const { reason } = req.query;

    // Find request
    const request = await Request.findOne({
      userId,
      itemId,
      status: "Pending",
      requestType: "Borrow",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "User not found in queue for this item",
      });
    }

    // Update request
    request.status = "Cancelled";
    request.reviewedBy = req.user._id;
    request.reviewDate = new Date();
    request.reviewNotes = reason || "Removed from queue by administrator";

    await request.save();

    res.status(200).json({
      success: true,
      message: "User removed from queue successfully",
      data: request,
    });
  } catch (error) {
    console.error("Remove from queue error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing user from queue",
    });
  }
};

// Allocate item to a specific user in the queue
exports.allocateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, reason } = req.body;

    // Validate item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if item has available copies
    if (item.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No available copies of this item",
      });
    }

    // Find an available copy
    const copy = await ItemCopy.findOne({
      itemId: item._id,
      status: "Available",
    });

    if (!copy) {
      return res.status(400).json({
        success: false,
        message: "No available copies of this item",
      });
    }

    // Find user's request in the queue
    const request = await Request.findOne({
      userId,
      itemId,
      status: "Pending",
      requestType: "Borrow",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "User not found in queue for this item",
      });
    }

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue item to inactive or locked user",
      });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + item.defaultReturnPeriod);

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      itemId: item._id,
      copyId: copy._id,
      issueDate: new Date(),
      dueDate,
      status: "Issued",
      notes: `Manually allocated from queue. ${reason || ""}`,
      createdBy: req.user._id,
    });

    // Update copy status
    copy.status = "Issued";
    copy.lastIssuedDate = new Date();
    copy.updatedBy = req.user._id;
    await copy.save();

    // Update item available copies count
    item.availableCopies -= 1;
    await item.save();

    // Update request
    request.status = "Fulfilled";
    request.transactionId = transaction._id;
    request.reviewedBy = req.user._id;
    request.reviewDate = new Date();
    request.reviewNotes = reason || "Manually allocated by administrator";
    await request.save();

    // Send notification to user about item allocation
    try {
      await NotificationService.sendNotification({
        userId: user._id,
        title: "Item Allocated",
        message: `"${item.title}" has been allocated to you from the queue and is ready for pickup!`,
        type: "ItemIssued",
        entityType: "Transaction",
        entityId: transaction._id,
        data: {
          itemId: item._id,
          dueDate: transaction.dueDate,
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to send allocation notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Item allocated successfully",
      data: {
        transaction,
        request,
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
        },
        item: {
          id: item._id,
          title: item.title,
          barcode: item.barcode,
        },
        copy: {
          id: copy._id,
          copyNumber: copy.copyNumber,
          barcode: copy.barcode,
        },
      },
    });
  } catch (error) {
    console.error("Allocate item error:", error);
    res.status(500).json({
      success: false,
      message: "Error allocating item",
    });
  }
};

// Get renewal requests for admin approval
exports.getRenewalRequests = async (req, res) => {
  try {
    const { status = "Pending", page = 1, limit = 10 } = req.query;

    const query = { status };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const renewalRequests = await RenewalRequest.find(query)
      .populate({
        path: "transactionId",
        populate: {
          path: "itemId",
          select: "title barcode itemType",
        },
      })
      .populate("userId", "fullName email")
      .populate("approvedBy", "fullName")
      .populate("rejectedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RenewalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: renewalRequests.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: renewalRequests,
    });
  } catch (error) {
    console.error("Get renewal requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving renewal requests",
    });
  }
};

// Approve renewal request
exports.approveRenewalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvedDueDate, adminNotes } = req.body;

    const renewalRequest = await RenewalRequest.findById(requestId)
      .populate("transactionId")
      .populate("userId", "fullName")
      .populate({
        path: "transactionId",
        populate: {
          path: "itemId",
          select: "title",
        },
      });

    if (!renewalRequest) {
      return res.status(404).json({
        success: false,
        message: "Renewal request not found",
      });
    }

    if (renewalRequest.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Renewal request already processed",
      });
    }

    // Update the transaction due date
    const transaction = renewalRequest.transactionId;
    const newDueDate = approvedDueDate
      ? new Date(approvedDueDate)
      : renewalRequest.requestedDueDate;

    transaction.dueDate = newDueDate;
    transaction.renewalCount = (transaction.renewalCount || 0) + 1;
    transaction.lastRenewalDate = new Date();
    await transaction.save();

    // Update renewal request
    renewalRequest.status = "Approved";
    renewalRequest.approvedDueDate = newDueDate;
    renewalRequest.adminNotes = adminNotes;
    renewalRequest.approvedBy = req.user._id;
    renewalRequest.approvedAt = new Date();
    await renewalRequest.save();

    // Create notification
    await Notification.create({
      userId: renewalRequest.userId._id,
      title: "Renewal Approved",
      message: `Your renewal request for "${
        transaction.itemId.title
      }" has been approved. New due date: ${newDueDate.toLocaleDateString()}`,
      type: "renewal_approved",
    });

    res.status(200).json({
      success: true,
      message: "Renewal request approved successfully",
      data: renewalRequest,
    });
  } catch (error) {
    console.error("Approve renewal request error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving renewal request",
    });
  }
};

// Reject renewal request
exports.rejectRenewalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const renewalRequest = await RenewalRequest.findById(requestId)
      .populate("userId", "fullName")
      .populate({
        path: "transactionId",
        populate: {
          path: "itemId",
          select: "title",
        },
      });

    if (!renewalRequest) {
      return res.status(404).json({
        success: false,
        message: "Renewal request not found",
      });
    }

    if (renewalRequest.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Renewal request already processed",
      });
    }

    // Update renewal request
    renewalRequest.status = "Rejected";
    renewalRequest.adminNotes = adminNotes || "Renewal request rejected";
    renewalRequest.rejectedBy = req.user._id;
    renewalRequest.rejectedAt = new Date();
    await renewalRequest.save();

    // Create notification
    await Notification.create({
      userId: renewalRequest.userId._id,
      title: "Renewal Rejected",
      message: `Your renewal request for "${
        renewalRequest.transactionId.itemId.title
      }" has been rejected. ${
        adminNotes || "Please return the item by the original due date."
      }`,
      type: "renewal_rejected",
    });

    res.status(200).json({
      success: true,
      message: "Renewal request rejected successfully",
      data: renewalRequest,
    });
  } catch (error) {
    console.error("Reject renewal request error:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting renewal request",
    });
  }
};

// Helper function to try auto-issuing an item for approved request
async function tryAutoIssueItem(request, adminUserId) {
  try {
    const item = await Item.findById(request.itemId);
    if (!item || item.availableCopies <= 0) return null;

    const copy = await ItemCopy.findOne({
      itemId: item._id,
      status: "Available",
    });

    if (!copy) return null;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + item.defaultReturnPeriod);

    const transaction = await Transaction.create({
      userId: request.userId,
      itemId: item._id,
      copyId: copy._id,
      issueDate: new Date(),
      dueDate,
      status: "Issued",
      notes: `Auto-issued based on approved request #${request._id}`,
      createdBy: adminUserId,
    });

    copy.status = "Issued";
    copy.lastIssuedDate = new Date();
    copy.updatedBy = adminUserId;

    item.availableCopies -= 1;

    request.status = "Fulfilled";
    request.transactionId = transaction._id;

    await Promise.all([copy.save(), item.save(), request.save()]);

    try {
      await NotificationService.sendNotification({
        userId: request.userId._id,
        title: "Item Ready for Pickup",
        message: `Your request for "${request.itemId.title}" has been approved and the item is now ready for pickup!`,
        type: "ItemIssued",
        entityType: "Transaction",
        entityId: transaction._id,
      });
    } catch (notificationError) {
      console.error(
        "Failed to send auto-issue notification:",
        notificationError
      );
    }

    return { request, transaction };
  } catch (error) {
    console.error("Auto-issue error:", error);
    return null;
  }
}

// Helper function to process item queue when a copy becomes available
async function processItemQueue(itemId, adminUserId) {
  try {
    // Check if item has available copies
    const item = await Item.findById(itemId);
    if (!item || item.availableCopies <= 0) {
      return false;
    }

    // Find an available copy
    const copy = await ItemCopy.findOne({
      itemId,
      status: "Available",
    });

    if (!copy) {
      return false;
    }

    // Find the next request in the queue
    const nextRequest = await Request.findOne({
      itemId,
      status: "Pending",
      requestType: "Borrow",
    })
      .sort({ priority: -1, requestDate: 1 })
      .populate("userId");

    if (!nextRequest) {
      return false; // No pending requests
    }

    // Check if user is active
    if (nextRequest.userId.status !== "Active") {
      // Skip this user and try the next one
      nextRequest.status = "Rejected";
      nextRequest.reviewedBy = adminUserId;
      nextRequest.reviewDate = new Date();
      nextRequest.reviewNotes = "User is inactive or locked";
      await nextRequest.save();

      // Recursively try the next user in queue
      return await processItemQueue(itemId, adminUserId);
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + item.defaultReturnPeriod);

    // Create transaction
    const transaction = await Transaction.create({
      userId: nextRequest.userId._id,
      itemId,
      copyId: copy._id,
      issueDate: new Date(),
      dueDate,
      status: "Issued",
      notes: `Auto-issued from queue (request #${nextRequest._id})`,
      createdBy: adminUserId,
    });

    // Update all entities in parallel
    copy.status = "Issued";
    copy.lastIssuedDate = new Date();
    copy.updatedBy = adminUserId;

    item.availableCopies -= 1;

    nextRequest.status = "Fulfilled";
    nextRequest.transactionId = transaction._id;
    nextRequest.reviewedBy = adminUserId;
    nextRequest.reviewDate = new Date();

    await Promise.all([copy.save(), item.save(), nextRequest.save()]);

    return true;
  } catch (error) {
    console.error("Process queue error:", error);
    // Ensure we return false to indicate failure
    return false;
  }
}
