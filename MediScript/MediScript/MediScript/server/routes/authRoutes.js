const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerPatient);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
