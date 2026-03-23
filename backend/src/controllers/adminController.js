import Prompt from "../models/Prompt.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import LoginLog from "../models/LoginLog.js";

export const loginAdmin = async (req, res) => {
  const { password, code } = req.body || {};

  const configuredPassword = process.env.ADMIN_PANEL_PASSWORD || "sat@789S";
  const configuredCode = process.env.ADMIN_PANEL_CODE || "529422";

  if (password !== configuredPassword || code !== configuredCode) {
    return res.status(401).json({
      message: "Invalid admin credentials"
    });
  }

  const token = jwt.sign(
    { isAdmin: true },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return res.status(200).json({
    token
  });
};

export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalPrompts,
      promptsThisMonth,
      activeUsersThisMonth,
      promptsByMode,
      userUsage
    ] = await Promise.all([
      User.countDocuments(),
      Prompt.countDocuments(),
      Prompt.countDocuments({ createdAt: { $gte: monthStart } }),
      Prompt.distinct("user", { createdAt: { $gte: monthStart } }).then((users) => users.length),
      Prompt.aggregate([
        {
          $group: {
            _id: "$mode",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        {
          $lookup: {
            from: "prompts",
            localField: "_id",
            foreignField: "user",
            as: "promptDocs"
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            promptCount: { $size: "$promptDocs" },
            createdAt: 1
          }
        },
        { $sort: { promptCount: -1, createdAt: -1 } }
      ])
    ]);

    const modeMap = promptsByMode.reduce(
      (acc, item) => {
        const key = item._id || "unknown";
        acc[key] = item.count;
        return acc;
      },
      {
        quick: 0,
        balanced: 0,
        auto: 0,
        expert: 0,
        unknown: 0
      }
    );

    return res.status(200).json({
      overview: {
        totalUsers,
        totalPrompts,
        promptsThisMonth,
        activeUsersThisMonth
      },
      promptsByMode: modeMap,
      users: userUsage
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch admin stats"
    });
  }
};

export const getAdminUserNames = async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, email: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user names"
    });
  }
};

export const getAdminLoginLogs = async (req, res) => {
  try {
    const logs = await LoginLog.find({}, { name: 1, email: 1, method: 1, ipAddress: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch login logs"
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete associated prompts
    await Prompt.deleteMany({ user: userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user"
    });
  }
};