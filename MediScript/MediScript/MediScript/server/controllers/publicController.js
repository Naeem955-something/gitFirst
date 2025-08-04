const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.applyDoctor = async (req, res) => {
  const {
    full_name, email, phone, password,
    age, gender, specialization,
    hospital, experience_years, bmdc_number
  } = req.body;

  const license_pdf = req.file?.filename;

  if (!license_pdf) {
    return res.status(400).json({ message: "License PDF is required" });
  }

  try {
    // Check for duplicate email or BMDC
    const [existing] = await db.query('SELECT * FROM doctor_applications WHERE email = ? OR bmdc_number = ?', [email, bmdc_number]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email or BMDC already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(`
      INSERT INTO doctor_applications 
      (full_name, email, phone, password_hash, age, gender, specialization, hospital, experience_years, bmdc_number, license_pdf)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      full_name, email, phone, hash, age, gender,
      specialization, hospital, experience_years, bmdc_number, license_pdf
    ]);

    res.json({ success: true, message: "Application submitted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during application" });
  }
};
