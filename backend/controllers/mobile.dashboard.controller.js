const Transaction = require("../models/transaction.model");
const Item = require("../models/item.model");
const User = require("../models/user.model");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    if(!userId){
      return res.status(400).json({ success: false, message: "Invalid User ID" });
    }

    const user = await User.findById(userId).select("fullName roles").lean();

    const issuedTransactions = await Transaction.find({
      userId,
      status: "Issued",
    })
      .populate({
        path: "itemId",
        select: "title photos categoryId description typeSpecificFields",
      })
      .populate({
        path: "copyId",
        select: "copyNumber condition",
      })
      .lean();

    const overdueTransactions = await Transaction.find({
      userId,
      status: "Overdue",
    })
      .populate({
        path: "itemId",
        select: "title photos categoryId description typeSpecificFields",
      })
      .populate({
        path: "copyId",
        select: "copyNumber condition",
      })
      .lean();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const newArrivals = await Item.find({
      createdAt: { $gte: fifteenDaysAgo },
    })
      .populate("categoryId", "name")
      .lean();

    return res.status(200).json({
      success: true,
      user: {
        fullName: user?.fullName || "User",
        roles: user?.roles || [],
      },
      issuedTransactions: issuedTransactions,
      overdueTransactions: overdueTransactions,
      newArrivals: newArrivals,
      summary: {
        issued: issuedTransactions.length,
        overdue: overdueTransactions.length,
        newArrivals: newArrivals.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
