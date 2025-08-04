const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// Get all pending doctor applications
exports.getPendingDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(
      "SELECT * FROM doctor_applications WHERE status = 'pending'"
    );
    res.status(200).json(doctors);
  } catch (err) {
    console.error("❌ Error fetching pending doctors:", err.message);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// View license PDF
exports.getLicenseFile = async (req, res) => {
  const { doctor_id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT license_pdf_path FROM doctor_applications WHERE doctor_id = ?",
      [doctor_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Doctor not found" });

    const filePath = path.join(
      __dirname,
      "../../public",
      rows[0].license_pdf_path
    );
    res.sendFile(filePath);
  } catch (err) {
    console.error("❌ Error sending license file:", err.message);
    res.status(500).json({ message: "Failed to load license" });
  }
};

// Approve doctor
exports.approveDoctor = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // 1. Get application
    const [rows] = await db.query(
      "SELECT * FROM doctor_applications WHERE doctor_id = ?",
      [doctor_id]
    );
    if (rows.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doc = rows[0];

    // 2. Insert into users
    await db.query(
      "INSERT INTO users (user_id, email, password_hash, role) VALUES (?, ?, ?, 'doctor')",
      [doc.doctor_id, doc.email, doc.password_hash]
    );

    // 3. Insert into doctors
    await db.query(
      `INSERT INTO doctors (
        user_id, full_name, gender, phone_number,
        specialization, bmdc_number, hospital, experience_years
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.doctor_id,
        doc.full_name,
        doc.gender,
        doc.phone_number,
        doc.specialization,
        doc.bmdc_number,
        doc.current_hospital,
        doc.experience_years,
      ]
    );

    // 4. Update application status
    await db.query(
      "UPDATE doctor_applications SET status = 'approved' WHERE doctor_id = ?",
      [doctor_id]
    );

    // Commit transaction
    await db.query("COMMIT");
    res.status(200).json({ message: "Doctor approved successfully" });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    console.error("❌ Error approving doctor:", err.message);
    res.status(500).json({ message: "Failed to approve doctor" });
  }
};

// Reject doctor
exports.rejectDoctor = async (req, res) => {
  const { doctor_id } = req.params;
  try {
    await db.query(
      "UPDATE doctor_applications SET status = 'rejected' WHERE doctor_id = ?",
      [doctor_id]
    );
    res.status(200).json({ message: "Doctor rejected" });
  } catch (err) {
    console.error("❌ Error rejecting doctor:", err.message);
    res.status(500).json({ message: "Failed to reject doctor" });
  }
};

// // ✅ Get admin profile
// exports.getProfile = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT
//         a.user_id, a.full_name, a.phone_number,
//         a.profile_picture_path, u.email
//        FROM admins a
//        JOIN users u ON u.user_id = a.user_id
//        WHERE a.user_id = ?`,
//       [req.session.user.user_id]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: "Admin not found" });
//     }

//     res.status(200).json(rows[0]);
//   } catch (err) {
//     console.error("❌ Error fetching admin profile:", err.message);
//     res.status(500).json({ message: "Failed to fetch profile" });
//   }
// };

// // ✅ Update admin profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const { full_name, phone_number } = req.body;
//     const user_id = req.session.user.user_id;
//     const profile_picture_path = req.file
//       ? `/uploads/profile_images/${req.file.filename}`
//       : null;

//     let query = `UPDATE admins SET full_name = ?, phone_number = ?`;
//     const fields = [full_name, phone_number];

//     if (profile_picture_path) {
//       query += `, profile_picture_path = ?`;
//       fields.push(profile_picture_path);
//     }

//     query += ` WHERE user_id = ?`;
//     fields.push(user_id);

//     await db.query(query, fields);

//     res.status(200).json({ message: "Profile updated successfully" });
//   } catch (err) {
//     console.error("❌ Error updating admin profile:", err.message);
//     res.status(500).json({ message: "Failed to update profile" });
//   }
// };

exports.getSummary = async (req, res) => {
  try {
    const [[{ totalDoctors }]] = await db.query(
      "SELECT COUNT(*) AS totalDoctors FROM doctors"
    );

    const [[{ pendingApplications }]] = await db.query(
      "SELECT COUNT(*) AS pendingApplications FROM doctor_applications WHERE status = 'pending'"
    );

    const [[{ totalPatients }]] = await db.query(
      "SELECT COUNT(*) AS totalPatients FROM patients"
    );

    // ✅ Safe fallback for missing tables
    let totalMedicines = 0;
    let pendingRefills = 0;

    try {
      [[{ totalMedicines }]] = await db.query(
        "SELECT COUNT(*) AS totalMedicines FROM medicines"
      );
    } catch (e) {
      console.warn("⚠️ Table 'medicines' missing. Using 0.");
    }

    try {
      [[{ pendingRefills }]] = await db.query(
        "SELECT COUNT(*) AS pendingRefills FROM refill_requests WHERE status = 'pending'"
      );
    } catch (e) {
      console.warn("⚠️ Table 'refill_requests' missing. Using 0.");
    }

    // ✅ Admin full name
    const [[{ full_name }]] = await db.query(
      "SELECT full_name FROM admins WHERE user_id = ?",
      [req.session.user.user_id]
    );

    res.json({
      full_name,
      totalDoctors,
      pendingApplications,
      totalPatients,
      totalMedicines,
      pendingRefills,
    });
  } catch (err) {
    console.error("❌ Error loading admin summary:", err.message);
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
};

// ✅ GET /admin/medicines
exports.getMedicines = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM medicine_inventory
      WHERE status = 'active'
      ORDER BY name
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching medicines:", err);
    res.status(500).json({ message: "Failed to fetch medicines." });
  }
};

// ✅ POST /admin/medicines
exports.addMedicine = async (req, res) => {
  const {
    name,
    type,
    strength,
    generic_name,
    batch_no,
    category,
    quantity,
    price,
    mfd,
    exp,
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO medicine_inventory 
      (name, type, strength, generic_name, batch_no, category, quantity, price, mfd, exp, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name,
        type,
        strength,
        generic_name,
        batch_no,
        category,
        quantity,
        price,
        mfd,
        exp,
      ]
    );

    res.status(201).json({ message: "Medicine added", id: result.insertId });
  } catch (err) {
    console.error("❌ Error adding medicine:", err);
    res.status(500).json({ message: "Failed to add medicine." });
  }
};

// ✅ POST /admin/medicines/remove-expired
exports.removeExpiredMedicines = async (req, res) => {
  try {
    // Get all medicines that are expired or out of stock AND still marked active
    const [expired] = await db.query(`
      SELECT medicine_id,
             CASE 
               WHEN exp <= CURDATE() THEN 'expired'
               WHEN quantity <= 0 THEN 'out_of_stock'
             END AS reason
      FROM medicine_inventory
      WHERE (exp <= CURDATE() OR quantity <= 0) AND status = 'active'
    `);

    if (expired.length === 0) {
      return res
        .status(200)
        .json({ message: "No expired or out-of-stock medicines found." });
    }

    // Insert into refill_queue + update status
    for (const med of expired) {
      await db.query(
        `INSERT INTO refill_queue (medicine_id, reason) VALUES (?, ?)`,
        [med.medicine_id, med.reason]
      );

      await db.query(
        `UPDATE medicine_inventory SET status = 'refill' WHERE medicine_id = ?`,
        [med.medicine_id]
      );
    }

    res
      .status(200)
      .json({ message: `${expired.length} medicines moved to refill queue.` });
  } catch (err) {
    console.error("❌ Error removing expired medicines:", err);
    res.status(500).json({ message: "Failed to process expired medicines." });
  }
};

// ✅ POST /admin/medicines/:id/remove
exports.removeMedicineById = async (req, res) => {
  const medicineId = req.params.id;

  try {
    // Check if it exists and is active
    const [rows] = await db.query(
      `SELECT * FROM medicine_inventory WHERE medicine_id = ? AND status = 'active'`,
      [medicineId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Medicine not found or already removed." });
    }

    const medicine = rows[0];
    const reason =
      medicine.quantity <= 0
        ? "out_of_stock"
        : medicine.exp <= new Date().toISOString().slice(0, 10)
        ? "expired"
        : "manual";

    // Insert into refill_queue
    await db.query(
      `INSERT INTO refill_queue (medicine_id, reason) VALUES (?, ?)`,
      [medicineId, reason]
    );

    // Update status
    await db.query(
      `UPDATE medicine_inventory SET status = 'refill' WHERE medicine_id = ?`,
      [medicineId]
    );

    res.status(200).json({ message: "Medicine moved to refill queue." });
  } catch (err) {
    console.error("❌ Error removing medicine:", err);
    res.status(500).json({ message: "Failed to remove medicine." });
  }
};

// ✅ GET /admin/refill
exports.getRefillQueue = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.refill_id, r.reason, r.moved_on, m.*
      FROM refill_queue r
      JOIN medicine_inventory m ON r.medicine_id = m.medicine_id
      ORDER BY r.moved_on DESC
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching refill queue:", err);
    res.status(500).json({ message: "Failed to load refill queue." });
  }
};

// ✅ DELETE /admin/refill/:id/remove
exports.deleteRefillMedicine = async (req, res) => {
  const refillId = req.params.id;

  try {
    // Get medicine_id
    const [refill] = await db.query(
      `SELECT medicine_id FROM refill_queue WHERE refill_id = ?`,
      [refillId]
    );

    if (refill.length === 0) {
      return res.status(404).json({ message: "Refill item not found." });
    }

    const medicineId = refill[0].medicine_id;

    // Delete from both tables
    await db.query(`DELETE FROM refill_queue WHERE refill_id = ?`, [refillId]);
    await db.query(`DELETE FROM medicine_inventory WHERE medicine_id = ?`, [
      medicineId,
    ]);

    res.status(200).json({ message: "Medicine permanently removed." });
  } catch (err) {
    console.error("❌ Error deleting medicine:", err);
    res.status(500).json({ message: "Failed to delete medicine." });
  }
};

// ✅ POST /admin/refill/:id/refill
exports.refillMedicine = async (req, res) => {
  const refillId = req.params.id;
  const { quantity, mfd, exp, price } = req.body;

  try {
    // Get the medicine_id from the refill_queue
    const [refill] = await db.query(
      `SELECT medicine_id FROM refill_queue WHERE refill_id = ?`,
      [refillId]
    );

    if (refill.length === 0) {
      return res.status(404).json({ message: "Refill item not found." });
    }

    const medicineId = refill[0].medicine_id;

    // Update the inventory
    await db.query(
      `UPDATE medicine_inventory
       SET quantity = ?, mfd = ?, exp = ?, price = ?, status = 'active'
       WHERE medicine_id = ?`,
      [quantity, mfd, exp, price, medicineId]
    );

    // Remove from refill_queue
    await db.query(`DELETE FROM refill_queue WHERE refill_id = ?`, [refillId]);

    res.status(200).json({ message: "Medicine refilled successfully." });
  } catch (err) {
    console.error("❌ Error refilling medicine:", err.message);
    res.status(500).json({ message: "Failed to refill medicine." });
  }
};

// ✅ DELETE /admin/refill/:id/remove
exports.deleteRefillMedicine = async (req, res) => {
  const refillId = req.params.id;

  try {
    // Get medicine_id
    const [refill] = await db.query(
      `SELECT medicine_id FROM refill_queue WHERE refill_id = ?`,
      [refillId]
    );

    if (refill.length === 0) {
      return res.status(404).json({ message: "Refill item not found." });
    }

    const medicineId = refill[0].medicine_id;

    // Delete from both tables
    await db.query(`DELETE FROM refill_queue WHERE refill_id = ?`, [refillId]);
    await db.query(`DELETE FROM medicine_inventory WHERE medicine_id = ?`, [
      medicineId,
    ]);

    res.status(200).json({ message: "Medicine permanently removed." });
  } catch (err) {
    console.error("❌ Error deleting medicine:", err);
    res.status(500).json({ message: "Failed to delete medicine." });
  }
};

// ✅ GET /admin/doctors - Get all approved doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        d.user_id, d.full_name, d.age, d.gender, d.phone_number,
        d.specialization, d.department, d.hospital, d.experience_years,
        u.email
      FROM doctors d
      JOIN users u ON u.user_id = d.user_id
      WHERE u.is_active = TRUE
      ORDER BY d.full_name
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching doctors:", err);
    res.status(500).json({ message: "Failed to fetch doctors." });
  }
};

// ✅ DELETE /admin/doctors/:id - Remove doctor
exports.removeDoctor = async (req, res) => {
  const doctorId = req.params.id;

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // Check if doctor exists
    const [doctor] = await db.query(
      "SELECT user_id FROM doctors WHERE user_id = ?",
      [doctorId]
    );

    if (doctor.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Deactivate user (soft delete)
    await db.query("UPDATE users SET is_active = FALSE WHERE user_id = ?", [
      doctorId,
    ]);

    // Delete from doctors table (cascade will handle related data)
    await db.query("DELETE FROM doctors WHERE user_id = ?", [doctorId]);

    // Commit transaction
    await db.query("COMMIT");

    res.status(200).json({ message: "Doctor removed successfully." });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    console.error("❌ Error removing doctor:", err);
    res.status(500).json({ message: "Failed to remove doctor." });
  }
};

// ✅ GET /admin/patients - Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.user_id, p.full_name, p.age, p.gender, p.blood_group,
        p.phone_number, p.address,
        u.email
      FROM patients p
      JOIN users u ON u.user_id = p.user_id
      WHERE u.is_active = TRUE
      ORDER BY p.full_name
    `);

    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Error fetching patients:", err);
    res.status(500).json({ message: "Failed to fetch patients." });
  }
};

// ✅ DELETE /admin/patients/:id - Remove patient
exports.removePatient = async (req, res) => {
  const patientId = req.params.id;

  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // Check if patient exists
    const [patient] = await db.query(
      "SELECT user_id FROM patients WHERE user_id = ?",
      [patientId]
    );

    if (patient.length === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Patient not found." });
    }

    // Deactivate user (soft delete)
    await db.query("UPDATE users SET is_active = FALSE WHERE user_id = ?", [
      patientId,
    ]);

    // Delete from patients table (cascade will handle related data)
    await db.query("DELETE FROM patients WHERE user_id = ?", [patientId]);

    // Commit transaction
    await db.query("COMMIT");

    res.status(200).json({ message: "Patient removed successfully." });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    console.error("❌ Error removing patient:", err);
    res.status(500).json({ message: "Failed to remove patient." });
  }
};

// ✅ Get Refill Requests (with status filter)
exports.getRefillRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = "";
    let params = [];

    if (status && status !== "all") {
      whereClause = "WHERE rr.status = ?";
      params.push(status);
    }

    const [requests] = await db.query(
      `SELECT 
        rr.request_id,
        rr.address,
        rr.notes,
        rr.status,
        rr.delivery_method,
        rr.submitted_at,
        p.user_id as patient_id,
        p.full_name as patient_name,
        p.age,
        p.phone_number,
        COUNT(rri.id) as item_count
      FROM refill_requests_final rr
      JOIN patients p ON rr.patient_id = p.user_id
      LEFT JOIN refill_request_items rri ON rr.request_id = rri.request_id
      ${whereClause}
      GROUP BY rr.request_id
      ORDER BY rr.submitted_at DESC`,
      params
    );

    res.status(200).json(requests);
  } catch (err) {
    console.error("❌ Error fetching refill requests:", err);
    res.status(500).json({ message: "Failed to fetch refill requests." });
  }
};

// ✅ Get Refill Request Details
exports.getRefillRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get request details
    const [requestRows] = await db.query(
      `SELECT 
        rr.*,
        p.full_name as patient_name,
        p.age,
        p.phone_number
      FROM refill_requests_final rr
      JOIN patients p ON rr.patient_id = p.user_id
      WHERE rr.request_id = ?`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestRows[0];

    // Get request items
    const [items] = await db.query(
      `SELECT 
        rri.*,
        pm.dosage,
        pm.timing,
        pm.duration,
        COALESCE(m.name, 'Custom Medicine') as medicine_name,
        p.prescription_id,
        d.full_name as doctor_name
      FROM refill_request_items rri
      JOIN prescription_medicines pm ON rri.prescription_medicine_id = pm.id
      LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
      JOIN prescriptions p ON pm.prescription_id = p.prescription_id
      JOIN doctors d ON p.doctor_id = d.user_id
      WHERE rri.request_id = ?`,
      [id]
    );

    res.status(200).json({
      request,
      items,
    });
  } catch (err) {
    console.error("❌ Error fetching request details:", err);
    res.status(500).json({ message: "Failed to fetch request details." });
  }
};

// ✅ Approve Refill Request
exports.approveRefillRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE refill_requests_final SET status = 'approved' WHERE request_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: "Request approved successfully" });
  } catch (err) {
    console.error("❌ Error approving request:", err);
    res.status(500).json({ message: "Failed to approve request." });
  }
};

// ✅ Decline Refill Request
exports.declineRefillRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE refill_requests_final SET status = 'declined' WHERE request_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: "Request declined successfully" });
  } catch (err) {
    console.error("❌ Error declining request:", err);
    res.status(500).json({ message: "Failed to decline request." });
  }
};

// ✅ Mark Refill Request as Delivered
exports.deliverRefillRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Start transaction
    await db.query("START TRANSACTION");

    // 1. Mark as delivered
    const [result] = await db.query(
      `UPDATE refill_requests_final SET status = 'delivered' WHERE request_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Request not found" });
    }

    // 2. Get all items in the request
    const [items] = await db.query(
      `SELECT rri.quantity, pm.medicine_id
       FROM refill_request_items rri
       JOIN prescription_medicines pm ON rri.prescription_medicine_id = pm.id
       WHERE rri.request_id = ?`,
      [id]
    );

    // 3. For each item, decrement the inventory (only if medicine_id is not null)
    for (const item of items) {
      if (item.medicine_id) {
        await db.query(
          `UPDATE medicine_inventory SET quantity = GREATEST(quantity - ?, 0) WHERE medicine_id = ?`,
          [item.quantity, item.medicine_id]
        );
      }
    }

    // Commit transaction
    await db.query("COMMIT");

    res
      .status(200)
      .json({
        message:
          "Request marked as delivered successfully and inventory updated.",
      });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error marking as delivered:", err);
    res.status(500).json({ message: "Failed to mark as delivered." });
  }
};

// ✅ Archive Delivered/Declined Requests
exports.archiveRefillRequests = async (req, res) => {
  try {
    // Start transaction
    await db.query("START TRANSACTION");

    // Get requests to archive
    const [requestsToArchive] = await db.query(
      `SELECT request_id FROM refill_requests_final 
       WHERE status IN ('delivered', 'declined')`
    );

    if (requestsToArchive.length === 0) {
      await db.query("ROLLBACK");
      return res.status(200).json({ message: "No requests to archive" });
    }

    // Archive each request
    for (const request of requestsToArchive) {
      await db.query(
        `INSERT INTO refill_request_history (request_id) VALUES (?)`,
        [request.request_id]
      );
    }

    // Delete archived requests from main table
    await db.query(
      `DELETE FROM refill_requests_final 
       WHERE status IN ('delivered', 'declined')`
    );

    await db.query("COMMIT");

    res.status(200).json({
      message: `${requestsToArchive.length} requests archived successfully`,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error archiving requests:", err);
    res.status(500).json({ message: "Failed to archive requests." });
  }
};

// ✅ Get Refill Request History
exports.getRefillRequestHistory = async (req, res) => {
  try {
    const [history] = await db.query(
      `SELECT 
        rrh.id,
        rrh.archived_at,
        rr.request_id,
        rr.address,
        rr.notes,
        rr.status,
        rr.delivery_method,
        rr.submitted_at,
        p.full_name as patient_name,
        p.age,
        p.phone_number,
        COUNT(rri.id) as item_count
      FROM refill_request_history rrh
      JOIN refill_requests_final rr ON rrh.request_id = rr.request_id
      JOIN patients p ON rr.patient_id = p.user_id
      LEFT JOIN refill_request_items rri ON rr.request_id = rri.request_id
      GROUP BY rrh.id
      ORDER BY rrh.archived_at DESC`
    );

    res.status(200).json(history);
  } catch (err) {
    console.error("❌ Error fetching refill history:", err);
    res.status(500).json({ message: "Failed to fetch refill history." });
  }
};
