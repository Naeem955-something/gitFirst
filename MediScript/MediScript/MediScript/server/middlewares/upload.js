const multer = require("multer"); // ✅ This was missing
const path = require("path");
const fs = require("fs");

const getStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "uploads",
        folder
      );
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

const uploadLicense = multer({ storage: getStorage("licenses") }); // for doctor uploads
const uploadProfileImage = multer({ storage: getStorage("profile_images") }); // for patient profile pictures

module.exports = {
  uploadLicense,
  uploadProfileImage,
};
