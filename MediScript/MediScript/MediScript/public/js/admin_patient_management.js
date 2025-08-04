document.addEventListener("DOMContentLoaded", () => {
  fetchPatients();
});

let patients = [];
let patientToRemove = null;

// Fetch all patients
async function fetchPatients() {
  try {
    const res = await fetch("/admin/patients");
    const data = await res.json();
    patients = data;
    renderTable(patients);
    updateCount();
  } catch (err) {
    console.error("Failed to load patients", err);
    alert("Failed to load patients. Please try again.");
  }
}

// Render patients in the table
function renderTable(patients) {
  const tbody = document.getElementById("patientTableBody");
  tbody.innerHTML = "";

  patients.forEach((patient) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";

    tr.innerHTML = `
      <td class="px-4 py-3 font-medium">${patient.user_id || "—"}</td>
      <td class="px-4 py-3">${patient.full_name || "—"}</td>
      <td class="px-4 py-3">${patient.age || "—"}</td>
      <td class="px-4 py-3">${patient.gender || "—"}</td>
      <td class="px-4 py-3">${patient.blood_group || "—"}</td>
      <td class="px-4 py-3">${patient.phone_number || "—"}</td>
      <td class="px-4 py-3">${patient.email || "—"}</td>
      <td class="px-4 py-3 max-w-xs truncate" title="${
        patient.address || ""
      }">${patient.address || "—"}</td>
      <td class="px-4 py-3">
        <button 
          onclick="removePatient('${patient.user_id}', '${
      patient.full_name || "Unknown"
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

// Update patient count
function updateCount() {
  const countElement = document.getElementById("patientCount");
  countElement.textContent = patients.length;
}

// Filter patients
function filterPatients() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = patients.filter(
    (patient) =>
      (patient.full_name && patient.full_name.toLowerCase().includes(query)) ||
      (patient.phone_number &&
        patient.phone_number.toLowerCase().includes(query)) ||
      (patient.blood_group &&
        patient.blood_group.toLowerCase().includes(query)) ||
      (patient.user_id && patient.user_id.toLowerCase().includes(query)) ||
      (patient.email && patient.email.toLowerCase().includes(query))
  );
  renderTable(filtered);
}

// Show remove confirmation modal
function removePatient(patientId, patientName) {
  patientToRemove = patientId;
  document.getElementById("patientNameToRemove").textContent = patientName;
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("confirmModal").classList.add("flex");
}

// Close confirmation modal
function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
  document.getElementById("confirmModal").classList.remove("flex");
  patientToRemove = null;
}

// Confirm and remove patient
async function confirmRemovePatient() {
  if (!patientToRemove) return;

  try {
    const res = await fetch(`/admin/patients/${patientToRemove}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("✅ Patient removed successfully!");
      closeConfirmModal();
      fetchPatients(); // Refresh the list
    } else {
      const error = await res.json();
      alert("❌ Error: " + (error.message || "Failed to remove patient"));
    }
  } catch (err) {
    console.error("Remove failed", err);
    alert("❌ Failed to remove patient. Please try again.");
  }
}
