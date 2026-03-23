import express from "express";
import {
	getAdminLoginLogs,
	getAdminStats,
	getAdminUserNames,
	loginAdmin,
	deleteUser
} from "../controllers/adminController.js";
import adminProtect from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/stats", adminProtect, getAdminStats);
router.get("/users", adminProtect, getAdminUserNames);
router.delete("/users/:id", adminProtect, deleteUser);
router.get("/logs", adminProtect, getAdminLoginLogs);

export default router;