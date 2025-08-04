const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const doctorController = require("../controllers/doctorController");
const { requireLogin, requireRole } = require("../middlewares/authMiddleware");
const { uploadLicense, uploadProfileImage } = require("../middlewares/upload");

// ✅ Multer config for license upload (used during apply) - keep this one as it's specific to doctor applications
const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/licenses");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.body.doctor_id}_license${ext}`;
    cb(null, filename);
  },
});

const uploadLicenseForApply = multer({ storage: licenseStorage });

/**
 * ✅ PUBLIC ROUTE: Doctor Application
 */
router.post(
  "/apply",
  uploadLicenseForApply.single("license_pdf"),
  doctorController.applyAsDoctor
);

/**
 * ✅ PROTECTED ROUTES (Doctor)
 */
router.get("/dashboard", requireLogin, requireRole("doctor"), (req, res) => {
  res.status(200).json({
    message: `Welcome Doctor ${req.session.user.user_id}`,
  });
});

router.get("/profile", doctorController.getDoctorProfile);

router.post(
  "/profile",
  uploadProfileImage.single("profile_picture"),
  doctorController.updateDoctorProfile
);

//serch patient + overview
router.get(
  "/search-patient/:id",
  requireLogin,
  requireRole("doctor"),
  doctorController.getPatientOverview
);
router.get(
  "/past-prescriptions/:id",
  requireLogin,
  requireRole("doctor"),
  doctorController.getLastPrescriptions
);
router.get(
  "/past-medicines/:id",
  requireLogin,
  requireRole("doctor"),
  doctorController.getLastMedicines
);

// ✅ Medicines route for prescription writing
router.get(
  "/medicines",
  requireLogin,
  requireRole("doctor"),
  doctorController.getMedicines
);

// ✅ Prescription routes
router.post(
  "/prescription",
  requireLogin,
  requireRole("doctor"),
  doctorController.createPrescription
);

router.get(
  "/prescription/:id",
  requireLogin,
  requireRole("doctor"),
  doctorController.getPrescription
);

module.exports = router;
