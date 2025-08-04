const express = require("express");
const router = express.Router();
const path = require("path");

// Serve main index page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

// Serve prescription viewing page
router.get("/prescription/:id", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../public/doctor/prescription_view.html")
  );
});

module.exports = router;
