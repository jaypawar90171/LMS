const mongoose = require("mongoose");
const { Types } = mongoose;
const Queue = require("../models/queue.model");

exports.getQueuedItemsForUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or invalid user.",
      });
    }

    const queueItems = await Queue.find({
      "queueMembers.userId": userId,
    })
      .populate({
        path: "itemId",
        select: "title description authorOrCreator mediaUrl categoryId",
        populate: {
          path: "categoryId",
          select: "name description parentCategoryId",
          populate: {
            path: "parentCategoryId",
            select: "name description",
          },
        },
      })
      .populate("queueMembers.userId", "fullName email")
      .populate("currentNotifiedUser", "fullName email")
      .populate("assignedCopyId", "copyNumber status")
      .populate("transactionId");

    res.status(200).json({
      success: true,
      message: "User queue items retrieved successfully.",
      data: queueItems,
    });
  } catch (error) {
    console.error("Error fetching queue items:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getQueueDetailsByItem = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { queueId } = req.params;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or invalid user.",
      });
    }

    if (!Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queueId.",
      });
    }

    const queueItem = await Queue.findById(queueId)
      .populate({
        path: "itemId",
        select: "title description authorOrCreator mediaUrl categoryId",
        populate: {
          path: "categoryId",
          select: "name description parentCategoryId",
          populate: {
            path: "parentCategoryId",
            select: "name description",
          },
        },
      })
      .populate("queueMembers.userId", "fullName email")
      .populate("currentNotifiedUser", "fullName email")
      .populate("assignedCopyId", "copyNumber status")
      .populate("transactionId");

    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: "Queue item not found",
      });
    }

    const isUserInQueue = queueItem.queueMembers.some((m) =>
      m.userId.equals(userId)
    );

    if (!isUserInQueue) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a member of this queue.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Queue item details retrieved successfully.",
      data: queueItem,
    });
  } catch (error) {
    console.error("Get queue details error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch queue item",
    });
  }
};

exports.withdrawFromQueue = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { queueId } = req.params;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or invalid user.",
      });
    }

    if (!Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queueId.",
      });
    }

    const queueItem = await Queue.findById(queueId);
    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: "Queue item not found",
      });
    }

    // Find queue member
    const memberIndex = queueItem.queueMembers.findIndex((m) =>
      m.userId.equals(userId)
    );

    if (memberIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this queue.",
      });
    }

    // Remove user from queue
    queueItem.queueMembers.splice(memberIndex, 1);

    // Reassign positions
    queueItem.queueMembers.forEach((m, index) => {
      m.position = index + 1;
    });

    // If the withdrawn user was the currently notified one → reset
    if (
      queueItem.currentNotifiedUser &&
      queueItem.currentNotifiedUser.equals(userId)
    ) {
      queueItem.currentNotifiedUser = null;
      queueItem.assignedCopyId = null;
      queueItem.transactionId = null;
    }

    await queueItem.save();

    res.status(200).json({
      success: true,
      message: "Successfully withdrawn from the queue.",
    });
  } catch (error) {
    console.error("Withdraw queue error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to withdraw from queue",
    });
  }
};

