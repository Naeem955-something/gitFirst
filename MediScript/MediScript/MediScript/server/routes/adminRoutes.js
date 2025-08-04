const express = require("express");
const router = express.Router();
const { requireLogin, requireRole } = require("../middlewares/authMiddleware");
const { uploadProfileImage } = require("../middlewares/upload");
const adminController = require("../controllers/adminController");

// 🔐 Dashboard route
router.get("/dashboard", requireLogin, requireRole("admin"), (req, res) => {
  res.status(200).json({
    message: `Hello Admin ${req.session.user.user_id}`,
  });
});

// 📝 Admin Profile
// router.get(
//   "/profile",
//   requireLogin,
//   requireRole("admin"),
//   adminController.getProfile
// );
// router.post(
//   "/profile",
//   requireLogin,
//   requireRole("admin"),
//   uploadProfileImage.single("profile_picture"),
//   adminController.updateProfile
// );

// 🩺 Doctor Application Handling
router.get(
  "/applications",
  requireLogin,
  requireRole("admin"),
  adminController.getPendingDoctors
);
router.get(
  "/license/:doctor_id",
  requireLogin,
  requireRole("admin"),
  adminController.getLicenseFile
);
router.post(
  "/approve/:doctor_id",
  requireLogin,
  requireRole("admin"),
  adminController.approveDoctor
);
router.post(
  "/reject/:doctor_id",
  requireLogin,
  requireRole("admin"),
  adminController.rejectDoctor
);

router.get(
  "/summary",
  requireLogin,
  requireRole("admin"),
  adminController.getSummary
);

router.get("/medicines", adminController.getMedicines);
router.post("/medicines", adminController.addMedicine);

router.post(
  "/medicines/remove-expired",
  adminController.removeExpiredMedicines
);

router.post("/medicines/:id/remove", adminController.removeMedicineById);

router.get("/refill", adminController.getRefillQueue);

router.post("/refill/:id/refill", adminController.refillMedicine);

router.delete("/refill/:id/remove", adminController.deleteRefillMedicine);

// ✅ Doctor Management Routes
router.get("/doctors", adminController.getAllDoctors);
router.delete("/doctors/:id", adminController.removeDoctor);

// ✅ Patient Management Routes
router.get("/patients", adminController.getAllPatients);
router.delete("/patients/:id", adminController.removePatient);

// ✅ Refill Request Management Routes
router.get("/refill-requests", adminController.getRefillRequests);
router.get("/refill-request/:id", adminController.getRefillRequestDetails);
router.post(
  "/refill-request/:id/approve",
  adminController.approveRefillRequest
);
router.post(
  "/refill-request/:id/decline",
  adminController.declineRefillRequest
);
router.post(
  "/refill-request/:id/delivered",
  adminController.deliverRefillRequest
);
router.post("/refill-requests/archive", adminController.archiveRefillRequests);
router.get("/refill-history", adminController.getRefillRequestHistory);

module.exports = router;
