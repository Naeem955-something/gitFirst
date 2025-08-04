const db = require("../config/db");

// ✅ Patient Dashboard (Optional)
exports.dashboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT profile_picture_path, full_name FROM patients WHERE user_id = ?`,
      [req.session.user.user_id]
    );

    const profile = rows[0] || {};

    res.status(200).json({
      message: `Welcome to the patient dashboard, ${req.session.user.user_id}`,
      profile_picture_path: profile.profile_picture_path || null,
      full_name: profile.full_name || null,
    });
  } catch (err) {
    console.error("❌ Dashboard load error:", err.message);
    res.status(500).json({ message: "Failed to load dashboard info" });
  }
};

// ✅ Get Patient Profile
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.user_id,
        u.email,
        p.full_name,
        p.gender,
        p.age,
        p.blood_group,
        p.phone_number,
        p.address,
        p.chronic_conditions,
        p.allergies,
        p.past_surgeries,
        p.family_medical_history,
        p.profile_picture_path
      FROM patients p
      JOIN users u ON u.user_id = p.user_id
      WHERE p.user_id = ?`,
      [req.session.user.user_id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("❌ Error loading profile:", err.message);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ✅ Update Patient Profile
exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.session.user.user_id;
    const {
      full_name,
      gender,
      age,
      blood_group,
      phone_number,
      address,
      chronic_conditions,
      allergies,
      past_surgeries,
      family_medical_history,
    } = req.body;

    // 🖼️ Handle optional profile picture
    const profile_picture_path = req.file
      ? `/uploads/profile_images/${req.file.filename}`
      : null;

    // 🔧 Build update query
    let query = `UPDATE patients SET 
      full_name = ?, gender = ?, age = ?, blood_group = ?, 
      phone_number = ?, address = ?, chronic_conditions = ?, 
      allergies = ?, past_surgeries = ?, family_medical_history = ?`;

    const fields = [
      full_name,
      gender,
      age,
      blood_group,
      phone_number,
      address,
      chronic_conditions,
      allergies,
      past_surgeries,
      family_medical_history,
    ];

    if (profile_picture_path) {
      query += `, profile_picture_path = ?`;
      fields.push(profile_picture_path);
    }

    query += ` WHERE user_id = ?`;
    fields.push(user_id);

    await db.query(query, fields);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ✅ Get Patient Prescriptions with Status
exports.getPrescriptions = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    // Get all prescriptions for the patient
    const [prescriptions] = await db.query(
      `SELECT 
        p.prescription_id,
        p.created_at,
        d.full_name as doctor_name,
        d.specialization
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.user_id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC`,
      [patient_id]
    );

    // For each prescription, determine its refill status
    const prescriptionsWithStatus = await Promise.all(
      prescriptions.map(async (prescription) => {
        // Get medicines for this prescription
        const [medicines] = await db.query(
          `SELECT 
            pm.id,
            pm.dosage,
            pm.timing,
            pm.duration,
            pm.refillable,
            COALESCE(m.name, 'Custom Medicine') as medicine_name,
            m.price
          FROM prescription_medicines pm
          LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
          WHERE pm.prescription_id = ?`,
          [prescription.prescription_id]
        );

        // Calculate refill status for each medicine
        const medicinesWithRefillStatus = medicines.map((medicine) => {
          const isRefillable = checkMedicineRefillable(medicine);
          return { ...medicine, isRefillable };
        });

        // Determine overall prescription status
        const refillableCount = medicinesWithRefillStatus.filter(
          (m) => m.isRefillable
        ).length;
        const totalCount = medicinesWithRefillStatus.length;

        let status;
        if (refillableCount === 0) {
          status = "Non-Refillable";
        } else if (refillableCount === totalCount) {
          status = "Refillable";
        } else {
          status = "Partially Refillable";
        }

        return {
          ...prescription,
          status,
          medicines: medicinesWithRefillStatus,
        };
      })
    );

    res.status(200).json(prescriptionsWithStatus);
  } catch (err) {
    console.error("❌ Error fetching prescriptions:", err.message);
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};

// ✅ Get Single Prescription Details
exports.getPrescriptionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    // Get prescription details
    const [prescriptionRows] = await db.query(
      `SELECT p.*, d.full_name as doctor_name, pt.full_name as patient_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.user_id
       JOIN patients pt ON p.patient_id = pt.user_id
       WHERE p.prescription_id = ? AND p.patient_id = ?`,
      [id, patient_id]
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

    // Get medicines with refill status
    const [medicines] = await db.query(
      `SELECT pm.*, 
              COALESCE(m.name, 'Custom Medicine') as medicine_name, 
              m.generic_name, 
              m.strength,
              m.price
       FROM prescription_medicines pm
       LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
       WHERE pm.prescription_id = ?`,
      [id]
    );

    // Add refill status to each medicine
    const medicinesWithRefillStatus = medicines.map((medicine) => {
      const isRefillable = checkMedicineRefillable(medicine);
      return { ...medicine, isRefillable };
    });

    res.status(200).json({
      prescription,
      tests: tests.map((t) => t.test_name),
      medicines: medicinesWithRefillStatus,
    });
  } catch (err) {
    console.error("❌ Error fetching prescription details:", err.message);
    res.status(500).json({ message: "Failed to fetch prescription details" });
  }
};

// ✅ Add Medicine to Refill Cart
exports.addToRefillCart = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });
    const { prescription_medicine_id, quantity = 1 } = req.body;

    // Check if medicine is already in cart
    const [existing] = await db.query(
      `SELECT id FROM refill_cart 
       WHERE patient_id = ? AND prescription_medicine_id = ?`,
      [patient_id, prescription_medicine_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Medicine already in cart" });
    }

    // Check if medicine is refillable
    const [medicine] = await db.query(
      `SELECT pm.*, COALESCE(m.name, 'Custom Medicine') as medicine_name, m.price
       FROM prescription_medicines pm
       LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
       WHERE pm.id = ?`,
      [prescription_medicine_id]
    );

    if (medicine.length === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    if (!checkMedicineRefillable(medicine[0])) {
      return res.status(400).json({ message: "Medicine is not refillable" });
    }

    // Add to cart
    await db.query(
      `INSERT INTO refill_cart (patient_id, prescription_medicine_id, quantity) 
       VALUES (?, ?, ?)`,
      [patient_id, prescription_medicine_id, quantity]
    );

    res.status(201).json({ message: "Medicine added to cart" });
  } catch (err) {
    console.error("❌ Error adding to cart:", err.message);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

// ✅ Get Refill Cart
exports.getRefillCart = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    const [cartItems] = await db.query(
      `SELECT 
        rc.id,
        rc.quantity,
        rc.added_at,
        pm.id as prescription_medicine_id,
        pm.dosage,
        pm.timing,
        pm.duration,
        COALESCE(m.name, 'Custom Medicine') as medicine_name,
        m.price,
        p.prescription_id,
        d.full_name as doctor_name
      FROM refill_cart rc
      JOIN prescription_medicines pm ON rc.prescription_medicine_id = pm.id
      LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
      JOIN prescriptions p ON pm.prescription_id = p.prescription_id
      JOIN doctors d ON p.doctor_id = d.user_id
      WHERE rc.patient_id = ?`,
      [patient_id]
    );

    // Calculate total prices
    const cartWithTotals = cartItems.map((item) => ({
      ...item,
      total_price: (item.price || 0) * item.quantity,
    }));

    res.status(200).json(cartWithTotals);
  } catch (err) {
    console.error("❌ Error fetching cart:", err.message);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

// ✅ Update Cart Item Quantity
exports.updateCartQuantity = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });
    const { cart_id, quantity } = req.body;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await db.query(
        `DELETE FROM refill_cart WHERE id = ? AND patient_id = ?`,
        [cart_id, patient_id]
      );
    } else {
      // Update quantity
      await db.query(
        `UPDATE refill_cart SET quantity = ? WHERE id = ? AND patient_id = ?`,
        [quantity, cart_id, patient_id]
      );
    }

    res.status(200).json({ message: "Cart updated" });
  } catch (err) {
    console.error("❌ Error updating cart:", err.message);
    res.status(500).json({ message: "Failed to update cart" });
  }
};

// ✅ Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });
    const { cart_id } = req.params;

    await db.query(`DELETE FROM refill_cart WHERE id = ? AND patient_id = ?`, [
      cart_id,
      patient_id,
    ]);

    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("❌ Error removing from cart:", err.message);
    res.status(500).json({ message: "Failed to remove from cart" });
  }
};

// ✅ Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    await db.query(`DELETE FROM refill_cart WHERE patient_id = ?`, [
      patient_id,
    ]);

    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    console.error("❌ Error clearing cart:", err.message);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};

// ✅ Submit Refill Request
exports.submitRefillRequest = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });
    const { address, notes } = req.body;

    // Start transaction
    await db.query("START TRANSACTION");

    // Get cart items
    const [cartItems] = await db.query(
      `SELECT 
        rc.prescription_medicine_id,
        rc.quantity,
        m.price
      FROM refill_cart rc
      JOIN prescription_medicines pm ON rc.prescription_medicine_id = pm.id
      LEFT JOIN medicine_inventory m ON pm.medicine_id = m.medicine_id
      WHERE rc.patient_id = ?`,
      [patient_id]
    );

    if (cartItems.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create refill request
    const [requestResult] = await db.query(
      `INSERT INTO refill_requests_final (patient_id, address, notes) 
       VALUES (?, ?, ?)`,
      [patient_id, address, notes]
    );

    const request_id = requestResult.insertId;

    // Add items to request
    for (const item of cartItems) {
      const unit_price = item.price || 0;
      const total_price = unit_price * item.quantity;

      await db.query(
        `INSERT INTO refill_request_items 
         (request_id, prescription_medicine_id, quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          request_id,
          item.prescription_medicine_id,
          item.quantity,
          unit_price,
          total_price,
        ]
      );
    }

    // Clear cart
    await db.query(`DELETE FROM refill_cart WHERE patient_id = ?`, [
      patient_id,
    ]);

    await db.query("COMMIT");

    res.status(201).json({
      message: "Refill request submitted successfully",
      request_id: request_id,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error submitting refill request:", err.message);
    res.status(500).json({ message: "Failed to submit refill request" });
  }
};

// ✅ Get Refill Requests History
exports.getRefillRequests = async (req, res) => {
  try {
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    const [requests] = await db.query(
      `SELECT 
        rr.request_id,
        rr.address,
        rr.notes,
        rr.status,
        rr.delivery_method,
        rr.submitted_at,
        COUNT(rri.id) as item_count
      FROM refill_requests_final rr
      LEFT JOIN refill_request_items rri ON rr.request_id = rri.request_id
      WHERE rr.patient_id = ?
      GROUP BY rr.request_id
      ORDER BY rr.submitted_at DESC`,
      [patient_id]
    );

    res.status(200).json(requests);
  } catch (err) {
    console.error("❌ Error fetching refill requests:", err.message);
    res.status(500).json({ message: "Failed to fetch refill requests" });
  }
};

// ✅ Get Refill Request Details
exports.getRefillRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patient_id = getPatientId(req);
    if (!patient_id)
      return res.status(400).json({ message: "Missing user_id" });

    // Get request details
    const [requestRows] = await db.query(
      `SELECT * FROM refill_requests_final 
       WHERE request_id = ? AND patient_id = ?`,
      [id, patient_id]
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
    console.error("❌ Error fetching request details:", err.message);
    res.status(500).json({ message: "Failed to fetch request details" });
  }
};

// Helper function to check if medicine is refillable
function checkMedicineRefillable(medicine) {
  if (!medicine.refillable) {
    return false;
  }

  if (!medicine.duration) {
    return false;
  }

  // Parse duration (e.g., "5 days", "1 week", "10 days")
  const durationText = medicine.duration.toLowerCase();
  let days = 0;

  if (durationText.includes("day")) {
    days = parseInt(durationText.match(/(\d+)/)?.[1] || 0);
  } else if (durationText.includes("week")) {
    days = parseInt(durationText.match(/(\d+)/)?.[1] || 1) * 7;
  } else if (durationText.includes("month")) {
    days = parseInt(durationText.match(/(\d+)/)?.[1] || 1) * 30;
  }

  if (days === 0) {
    return false;
  }

  // Check if duration has passed (assuming prescription was created recently)
  // This is a simplified check - in real implementation, you'd need to track prescription date
  return true; // For now, assume all refillable medicines are still valid
}

// Helper to get patient_id from request
function getPatientId(req) {
  return req.query.user_id || req.body.user_id || req.params.user_id;
}
