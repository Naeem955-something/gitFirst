const db = require("../config/db");
const { hashPassword, comparePasswords } = require("../utils/password");
const { sendOTP } = require("../utils/sendEmail");

// ✅ REGISTER FUNCTION (already present)
exports.registerPatient = async (req, res) => {
  const {
    full_name,
    email,
    patient_id,
    password,
    age,
    gender,
    blood_group,
    phone_number,
  } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT * FROM users WHERE user_id = ? OR email = ?",
      [patient_id, email]
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "User ID or Email already exists" });
    }

    const hashed = await hashPassword(password);

    await db.query(
      "INSERT INTO users (user_id, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [patient_id, email, hashed, "patient"]
    );

    await db.query(
      `INSERT INTO patients 
        (user_id, full_name, age, gender, blood_group, phone_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, full_name, age, gender, blood_group, phone_number]
    );

    res.status(201).json({ message: "Patient registered successfully" });
  } catch (err) {
    console.error("❌ Error in patient registration:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ LOGIN FUNCTION (add this BELOW registerPatient)
exports.login = async (req, res) => {
  const { user_id, password } = req.body;

  try {
    // 1. Check if user exists
    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      user_id,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = users[0];

    // 2. Is user active?
    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Account is inactive. Contact admin." });
    }

    // 3. Compare password with hash
    const match = await comparePasswords(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // 4. Update login time
    await db.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [
      user_id,
    ]);

    // 5. Set session
    req.session.user = {
      user_id: user.user_id,
      role: user.role,
      email: user.email,
    };

    // 6. Return role-based response
    res.status(200).json({
      message: "Login successful",
      redirect:
        user.role === "patient"
          ? "/patient/dashboard.html"
          : user.role === "doctor"
          ? "/doctor/dashboard.html"
          : "/admin/dashboard.html",
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Error in login:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
};

//requestPasswordReset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const user = users[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 min from now

    await db.query(
      `
      INSERT INTO password_resets (user_id, otp_code, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?;
    `,
      [user.user_id, otp, expiresAt, otp, expiresAt]
    );

    await sendOTP(email, otp);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err.message);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

//verifyOTP

exports.verifyOTP = async (req, res) => {
  const { user_id, otp_code } = req.body;

  try {
    const [records] = await db.query(
      "SELECT * FROM password_resets WHERE user_id = ? AND otp_code = ?",
      [user_id, otp_code]
    );

    if (records.length === 0 || new Date(records[0].expires_at) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    console.error("❌ Error in verifyOTP:", err.message);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

//resetPassword

exports.resetPassword = async (req, res) => {
  const { user_id, new_password } = req.body;

  try {
    const hashed = await hashPassword(new_password);

    await db.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
      hashed,
      user_id,
    ]);

    await db.query("DELETE FROM password_resets WHERE user_id = ?", [user_id]);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("❌ Error in resetPassword:", err.message);
    res.status(500).json({ message: "Server error resetting password" });
  }
};
