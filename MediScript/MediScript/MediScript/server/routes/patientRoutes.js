const express = require("express");
const router = express.Router();
const { requireLogin, requireRole } = require("../middlewares/authMiddleware");
const patientController = require("../controllers/patientController");
const { uploadProfileImage } = require("../middlewares/upload"); // ✅ import correct uploader

// View patient dashboard
router.get("/dashboard", patientController.dashboard);

// Get profile
router.get("/profile", patientController.getProfile);

// ✅ Update profile with image
router.post(
  "/profile",
  uploadProfileImage.single("profile_picture"), // ✅ correct uploader here
  patientController.updateProfile
);

// ✅ Prescriptions
router.get("/prescriptions", patientController.getPrescriptions);

router.get("/prescription/:id", patientController.getPrescriptionDetails);

// ✅ Refill Cart
router.get("/refill-cart", patientController.getRefillCart);

router.post("/refill-cart", patientController.addToRefillCart);

router.put("/refill-cart", patientController.updateCartQuantity);

router.delete("/refill-cart/:cart_id", patientController.removeFromCart);

router.delete("/refill-cart", patientController.clearCart);

// ✅ Refill Requests
router.post("/refill-request", patientController.submitRefillRequest);

router.get("/refill-requests", patientController.getRefillRequests);

router.get("/refill-request/:id", patientController.getRefillRequestDetails);

module.exports = router;
