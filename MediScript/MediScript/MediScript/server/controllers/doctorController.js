const db = require("../config/db");
const { hashPassword } = require("../utils/password");
const fs = require("fs");
const path = require("path");

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = ["public/uploads/profile_images", "public/uploads/licenses"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call this when the server starts
createUploadDirs();

// ✅ Apply as a doctor
exports.applyAsDoctor = async (req, res) => {
  const {
    doctor_id,
    full_name,
    email,
    phone_number,
    password,
    age,
    gender,
    specialization,
    bmdc_number,
    current_hospital,
    experience_years,
  } = req.body;

  const licensePath = req.file
    ? `/uploads/licenses/${req.file.filename}`
    : null;

  try {
    const [exists] = await db.query(
      "SELECT * FROM doctor_applications WHERE doctor_id = ? OR email = ? OR bmdc_number = ?",
      [doctor_id, email, bmdc_number]
    );
    if (exists.length > 0) {
      return res
        .status(409)
        .json({ message: "Doctor ID, Email or BMDC number already exists" });
    }

    const hashed = await hashPassword(password);

    await db.query(
      `INSERT INTO doctor_applications (
        doctor_id, full_name, email, phone_number, password_hash, age,
        gender, specialization, bmdc_number, current_hospital,
        experience_years, license_pdf_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor_id,
        full_name,
        email,
        phone_number,
        hashed,
        age,
        gender,
        specialization,
        bmdc_number,
        current_hospital,
        experience_years,
        licensePath,
      ]
    );

    res
      .status(201)
      .json({ message: "Application submitted successfully. Await approval." });
  } catch (err) {
    console.error("❌ Error in applyAsDoctor:", err.message);
    res.status(500).json({ message: "Server error submitting application" });
  }
};

// ✅ Get doctor profile
exports.getDoctorProfile = async (req, res) => {
  try {
    // For testing without session, use a default doctor ID
    const user_id = req.session?.user?.user_id || "DOC123";

    const [rows] = await db.query(
      `SELECT 
        d.user_id, d.full_name, d.gender, d.age, d.phone_number,
        d.specialization, d.department, d.bmdc_number,
        d.hospital, d.address, d.visiting_hours, d.bio,
        d.experience_years, d.profile_picture_path, u.email
      FROM doctors d
      JOIN users u ON u.user_id = d.user_id
      WHERE d.user_id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Format the response
    const profile = rows[0];
    // Don't modify the path if it's already in the correct format
    if (
      profile.profile_picture_path &&
      !profile.profile_picture_path.startsWith("/uploads/")
    ) {
      profile.profile_picture_path = `/uploads/profile_images/${path.basename(
        profile.profile_picture_path
      )}`;
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("❌ Error fetching doctor profile:", err.message);
    res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
};

// ✅ Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  // For testing without session, use a default doctor ID
  const user_id = req.session?.user?.user_id || "DOC123";

  console.log("📝 Update request body:", req.body); // Debug log

  const {
    full_name,
    gender,
    age: ageStr,
    phone_number,
    department,
    specialization,
    experience_years: expStr,
    hospital,
    address,
    visiting_hours,
    bio,
  } = req.body;

  // ✅ Sanitize numeric fields - handle empty strings and invalid values
  const age = ageStr && ageStr.trim() !== "" ? parseInt(ageStr) : null;
  const experience_years =
    expStr && expStr.trim() !== "" ? parseInt(expStr) : null;

  // Validate numeric fields
  if (age !== null && (isNaN(age) || age < 0 || age > 150)) {
    return res.status(400).json({ message: "Invalid age value" });
  }

  if (
    experience_years !== null &&
    (isNaN(experience_years) || experience_years < 0 || experience_years > 100)
  ) {
    return res.status(400).json({ message: "Invalid experience years value" });
  }

  try {
    // Start a transaction
    await db.query("START TRANSACTION");

    // Build update query with only non-empty fields
    let updateFields = [];
    let queryParams = [];

    if (full_name && full_name.trim()) {
      updateFields.push("full_name = ?");
      queryParams.push(full_name.trim());
    }

    if (gender && gender.trim()) {
      updateFields.push("gender = ?");
      queryParams.push(gender.trim());
    }

    if (age !== null) {
      updateFields.push("age = ?");
      queryParams.push(age);
    }

    if (phone_number && phone_number.trim()) {
      updateFields.push("phone_number = ?");
      queryParams.push(phone_number.trim());
    }

    if (department && department.trim()) {
      updateFields.push("department = ?");
      queryParams.push(department.trim());
    }

    if (specialization && specialization.trim()) {
      updateFields.push("specialization = ?");
      queryParams.push(specialization.trim());
    }

    if (experience_years !== null) {
      updateFields.push("experience_years = ?");
      queryParams.push(experience_years);
    }

    if (hospital && hospital.trim()) {
      updateFields.push("hospital = ?");
      queryParams.push(hospital.trim());
    }

    if (address && address.trim()) {
      updateFields.push("address = ?");
      queryParams.push(address.trim());
    }

    if (visiting_hours && visiting_hours.trim()) {
      updateFields.push("visiting_hours = ?");
      queryParams.push(visiting_hours.trim());
    }

    if (bio && bio.trim()) {
      updateFields.push("bio = ?");
      queryParams.push(bio.trim());
    }

    // Handle profile picture if uploaded
    if (req.file) {
      console.log("📸 Profile picture uploaded:", req.file); // Debug log
      const profile_picture_path = `/uploads/profile_images/${req.file.filename}`;
      updateFields.push("profile_picture_path = ?");
      queryParams.push(profile_picture_path);
      console.log("📸 Profile picture path to save:", profile_picture_path); // Debug log
    } else {
      console.log("📸 No profile picture uploaded"); // Debug log
    }

    if (updateFields.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Build and execute update query
    const query = `UPDATE doctors SET ${updateFields.join(
      ", "
    )} WHERE user_id = ?`;
    queryParams.push(user_id);

    console.log("🔧 Update query:", query); // Debug log
    console.log("🔧 Query params:", queryParams); // Debug log

    await db.query(query, queryParams);

    // Commit the transaction
    await db.query("COMMIT");

    // Get updated profile
    const [updated] = await db.query(
      `SELECT 
        d.*, u.email
      FROM doctors d
      JOIN users u ON u.user_id = d.user_id
      WHERE d.user_id = ?`,
      [user_id]
    );

    if (updated.length === 0) {
      return res.status(404).json({ message: "Doctor not found after update" });
    }

    // Format profile picture path
    const profile = updated[0];
    // Don't modify the path if it's already in the correct format
    if (
      profile.profile_picture_path &&
      !profile.profile_picture_path.startsWith("/uploads/")
    ) {
      profile.profile_picture_path = `/uploads/profile_images/${path.basename(
        profile.profile_picture_path
      )}`;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      profile: profile,
    });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    console.error("❌ Error updating doctor profile:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ✅ 1. Get Patient Overview Info
exports.getPatientOverview = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, age, gender, phone_number
       FROM patients
       WHERE user_id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({ patient: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching patient:", err.message);
    res.status(500).json({ message: "Failed to load patient" });
  }
};

// ✅ 2. Get Last 5 Prescriptions
exports.getLastPrescriptions = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT p.prescription_id, p.created_at, d.full_name AS doctor_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.user_id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching prescriptions:", err.message);
    res.status(500).json({ message: "Failed to fetch past prescriptions" });
  }
};

exports.getLastMedicines = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(m.name, 'Custom Medicine') as name, 
        pm.dosage, 
        pm.timing, 
        pm.duration
       FROM prescription_medicines pm
       JOIN prescriptions p ON pm.prescription_id = p.prescription_id
       LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching past meds:", err.message);
    res.status(500).json({ message: "Failed to fetch past medicines" });
  }
};

// ✅ Get medicines for prescription writing
exports.getMedicines = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT medicine_id, name, type, strength, generic_name, category
      FROM medicine_inventory
      WHERE status = 'active'
      ORDER BY name
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching medicines:", err);
    res.status(500).json({ message: "Failed to fetch medicines." });
  }
};

// ✅ Create prescription
exports.createPrescription = async (req, res) => {
  const doctor_id = req.session?.user?.user_id || "DOC123";
  const { patient_id, symptoms, diagnosis, tests, medicines } = req.body;

  console.log("📝 Creating prescription:", {
    doctor_id,
    patient_id,
    symptoms: symptoms?.substring(0, 50) + "...",
    diagnosis: diagnosis?.substring(0, 50) + "...",
    tests_count: tests?.length || 0,
    medicines_count: medicines?.length || 0,
  });

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // 1. Create prescription
    const [prescriptionResult] = await db.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, symptoms, diagnosis) 
       VALUES (?, ?, ?, ?)`,
      [patient_id, doctor_id, symptoms, diagnosis]
    );

    const prescription_id = prescriptionResult.insertId;
    console.log("✅ Prescription created with ID:", prescription_id);

    // 2. Add tests if any
    if (tests && tests.length > 0) {
      for (const test of tests) {
        if (test.trim()) {
          await db.query(
            `INSERT INTO prescription_tests (prescription_id, test_name) VALUES (?, ?)`,
            [prescription_id, test.trim()]
          );
        }
      }
      console.log(`✅ Added ${tests.filter((t) => t.trim()).length} tests`);
    }

    // 3. Add medicines
    if (medicines && medicines.length > 0) {
      for (const medicine of medicines) {
        if (medicine.name && medicine.name.trim()) {
          // Find medicine in inventory
          const [medicineResult] = await db.query(
            `SELECT medicine_id FROM medicine_inventory WHERE name = ? AND status = 'active'`,
            [medicine.name.trim()]
          );

          const medicine_id =
            medicineResult.length > 0 ? medicineResult[0].medicine_id : null;

          await db.query(
            `INSERT INTO prescription_medicines 
             (prescription_id, medicine_id, dosage, timing, duration, notes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              prescription_id,
              medicine_id,
              medicine.dosage || "",
              medicine.timing || "",
              medicine.duration || "",
              medicine.notes || "",
            ]
          );
        }
      }
      console.log(
        `✅ Added ${medicines.filter((m) => m.name?.trim()).length} medicines`
      );
    }

    // Commit transaction
    await db.query("COMMIT");
    console.log("✅ Transaction committed successfully");

    res.status(201).json({
      message: "Prescription created successfully",
      prescription_id: prescription_id,
    });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    console.error("❌ Error creating prescription:", err.message);
    res.status(500).json({ message: "Failed to create prescription" });
  }
};

// ✅ Get prescription details
exports.getPrescription = async (req, res) => {
  const { id } = req.params;

  try {
    // Get prescription details
    const [prescriptionRows] = await db.query(
      `SELECT p.*, d.full_name as doctor_name, pt.full_name as patient_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.user_id
       JOIN patients pt ON p.patient_id = pt.user_id
       WHERE p.prescription_id = ?`,
      [id]
    );

    if (prescriptionRows.length === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const prescription = prescriptionRows[0];

    // Get tests
    const [tests] = await db.query(
      `SELECT test_name FROM prescription_tests WHERE prescription_id = ?`,
      [id]
    );

    // Get medicines
    const [medicines] = await db.query(
      `SELECT pm.*, 
              COALESCE(m.name, 'Custom Medicine') as medicine_name, 
              m.generic_name, 
              m.strength
       FROM prescription_medicines pm
       LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
       WHERE pm.prescription_id = ?`,
      [id]
    );

    res.status(200).json({
      prescription,
      tests: tests.map((t) => t.test_name),
      medicines,
    });
  } catch (err) {
    console.error("❌ Error fetching prescription:", err.message);
    res.status(500).json({ message: "Failed to fetch prescription" });
  }
};
