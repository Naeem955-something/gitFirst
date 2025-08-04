document.addEventListener("DOMContentLoaded", () => {
  fetchDoctors();
});

let doctors = [];
let doctorToRemove = null;

// Fetch all doctors
async function fetchDoctors() {
  try {
    const res = await fetch("/admin/doctors");
    const data = await res.json();
    doctors = data;
    renderTable(doctors);
    updateCount();
  } catch (err) {
    console.error("Failed to load doctors", err);
    alert("Failed to load doctors. Please try again.");
  }
}

// Render doctors in the table
function renderTable(doctors) {
  const tbody = document.getElementById("doctorTableBody");
  tbody.innerHTML = "";

  doctors.forEach((doctor) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-4 py-3 font-medium">${doctor.user_id || "—"}</td>
      <td class="px-4 py-3">${doctor.full_name || "—"}</td>
      <td class="px-4 py-3">${doctor.specialization || "—"}</td>
      <td class="px-4 py-3">${doctor.department || "—"}</td>
      <td class="px-4 py-3">${doctor.hospital || "—"}</td>
      <td class="px-4 py-3">${
        doctor.experience_years ? doctor.experience_years + " years" : "—"
      }</td>
      <td class="px-4 py-3">${doctor.phone_number || "—"}</td>
      <td class="px-4 py-3">${doctor.email || "—"}</td>
      <td class="px-4 py-3">
        <button 
          onclick="removeDoctor('${doctor.user_id}', '${
      doctor.full_name || "Unknown"
    }')"
          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded transition-colors"
        >
          <i class="fas fa-trash-alt mr-1"></i> Remove
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Update doctor count
function updateCount() {
  const countElement = document.getElementById("doctorCount");
  countElement.textContent = doctors.length;
}

// Filter doctors
function filterDoctors() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = doctors.filter(
    (doctor) =>
      (doctor.full_name && doctor.full_name.toLowerCase().includes(query)) ||
      (doctor.specialization &&
        doctor.specialization.toLowerCase().includes(query)) ||
      (doctor.hospital && doctor.hospital.toLowerCase().includes(query)) ||
      (doctor.department && doctor.department.toLowerCase().includes(query)) ||
      (doctor.user_id && doctor.user_id.toLowerCase().includes(query))
  );
  renderTable(filtered);
}

// Show remove confirmation modal
function removeDoctor(doctorId, doctorName) {
  doctorToRemove = doctorId;
  document.getElementById("doctorNameToRemove").textContent = doctorName;
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("confirmModal").classList.add("flex");
}

// Close confirmation modal
function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
  document.getElementById("confirmModal").classList.remove("flex");
  doctorToRemove = null;
}

// Confirm and remove doctor
async function confirmRemoveDoctor() {
  if (!doctorToRemove) return;

  try {
    const res = await fetch(`/admin/doctors/${doctorToRemove}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("✅ Doctor removed successfully!");
      closeConfirmModal();
      fetchDoctors(); // Refresh the list
    } else {
      const error = await res.json();
      alert("❌ Error: " + (error.message || "Failed to remove doctor"));
    }
  } catch (err) {
    console.error("Remove failed", err);
    alert("❌ Failed to remove doctor. Please try again.");
  }
}
