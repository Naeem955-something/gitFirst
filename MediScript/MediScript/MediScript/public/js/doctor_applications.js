let selectedDoctorId = null;

// 🔁 Load pending applications on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/admin/applications");
    const applications = await res.json();

    const tbody = document.getElementById("applicationTableBody");
    tbody.innerHTML = "";

    applications.forEach((doc, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="border p-2">${index + 1}</td>
        <td class="border p-2">${doc.full_name}</td>
        <td class="border p-2">${doc.email}</td>
        <td class="border p-2">${doc.specialization}</td>
        <td class="border p-2 text-yellow-600 font-semibold">${doc.status}</td>
        <td class="border p-2">
          <button onclick="openReview('${
            doc.doctor_id
          }')" class="btn btn-sm btn-info">Review</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Error loading applications:", err);
    alert("Failed to load doctor applications.");
  }
});

// 🧾 Open review modal
window.openReview = async (doctorId) => {
  selectedDoctorId = doctorId;
  try {
    const res = await fetch("/admin/applications");
    const all = await res.json();
    const doc = all.find((d) => d.doctor_id === doctorId);
    if (!doc) return alert("Doctor application not found.");

    const container = document.getElementById("applicationDetails");
    container.innerHTML = `
      <p><strong>Full Name:</strong> ${doc.full_name}</p>
      <p><strong>Email:</strong> ${doc.email}</p>
      <p><strong>Phone:</strong> ${doc.phone_number}</p>
      <p><strong>Gender:</strong> ${doc.gender}</p>
      <p><strong>Age:</strong> ${doc.age}</p>
      <p><strong>BMDC Number:</strong> ${doc.bmdc_number}</p>
      <p><strong>Specialization:</strong> ${doc.specialization}</p>
      <p><strong>Experience:</strong> ${doc.experience_years} years</p>
      <p><strong>Hospital:</strong> ${doc.current_hospital}</p>
      <p>
        <strong>License PDF:</strong>
        <a href="/admin/license/${doctorId}" target="_blank" class="text-blue-600 underline">View</a>
      </p>
    `;

    document.getElementById("reviewModal").classList.remove("hidden");
  } catch (err) {
    console.error("❌ Error opening review modal:", err);
    alert("Failed to load application.");
  }
};

// 🚪 Close modal
window.closeModal = () => {
  document.getElementById("reviewModal").classList.add("hidden");
  selectedDoctorId = null;
};

// ✅ Submit decision
window.submitDecision = async (action) => {
  if (!selectedDoctorId) return;

  const endpoint =
    action === "approved"
      ? `/admin/approve/${selectedDoctorId}`
      : `/admin/reject/${selectedDoctorId}`;

  try {
    const res = await fetch(endpoint, { method: "POST" });
    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      closeModal();
      location.reload(); // Refresh the table
    } else {
      alert(result.message || "Action failed");
    }
  } catch (err) {
    console.error("❌ Error submitting decision:", err);
    alert("Something went wrong.");
  }
};
