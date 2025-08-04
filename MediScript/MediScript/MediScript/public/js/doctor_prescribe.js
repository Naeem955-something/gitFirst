// Patient search functionality
async function searchPatient() {
  const id = document.getElementById("patientIdInput").value.trim();
  if (!id) {
    alert("Please enter a Patient ID");
    return;
  }

  // Show loading state
  const searchBtn = document.querySelector('button[onclick="searchPatient()"]');
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin mr-1"></i> Searching...';
  searchBtn.disabled = true;

  try {
    // Step 1: Fetch Patient Overview
    const res = await fetch(`/doctor/search-patient/${id}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Patient not found");
    }
    const { patient } = await res.json();

    // Display Patient Card
    document.getElementById("patientCard").classList.remove("hidden");
    document.getElementById("patientName").textContent = patient.full_name;
    document.getElementById("patientId").textContent = id;
    document.getElementById("patientAge").textContent = patient.age;
    document.getElementById("patientGender").textContent = patient.gender;
    document.getElementById("patientPhone").textContent = patient.phone_number;

    // Show Add Prescription button
    const addBtn = document.getElementById("addPrescriptionBtnWrap");
    const link = document.getElementById("addPrescriptionLink");
    addBtn.classList.remove("hidden");
    link.href = `doctor_add_prescription.html?patient_id=${id}`;

    // Step 2: Fetch Last 5 Prescriptions
    const presRes = await fetch(`/doctor/past-prescriptions/${id}`);
    const prescriptions = await presRes.json();
    renderPrescriptions(prescriptions);

    // Step 3: Fetch Last 10 Medicines
    const medRes = await fetch(`/doctor/past-medicines/${id}`);
    const meds = await medRes.json();
    renderMedicines(meds);
  } catch (err) {
    console.error("Search failed:", err);
    alert(`❌ ${err.message || "Patient not found or server error."}`);

    // Hide all sections on error
    document.getElementById("patientCard").classList.add("hidden");
    document.getElementById("pastPrescriptionsSection").classList.add("hidden");
    document.getElementById("pastMedicinesSection").classList.add("hidden");
    document.getElementById("addPrescriptionBtnWrap").classList.add("hidden");
  } finally {
    // Restore button state
    searchBtn.innerHTML = originalText;
    searchBtn.disabled = false;
  }
}

// Render past prescriptions table
function renderPrescriptions(prescriptions) {
  const tbody = document.getElementById("prescriptionTableBody");
  const section = document.getElementById("pastPrescriptionsSection");

  tbody.innerHTML = "";
  if (!prescriptions.length) {
    section.classList.add("hidden");
    return;
  }

  prescriptions.forEach((pres) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${pres.prescription_id}</td>
      <td>${pres.doctor_name}</td>
      <td>${formatDate(pres.created_at)}</td>
      <td>
        <a href="prescription_view.html?id=${
          pres.prescription_id
        }" target="_blank"
           class="text-blue-600 hover:underline text-sm">View</a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  section.classList.remove("hidden");
}

// Render past medicines table
function renderMedicines(meds) {
  const tbody = document.getElementById("medicineTableBody");
  const section = document.getElementById("pastMedicinesSection");

  tbody.innerHTML = "";
  if (!meds.length) {
    section.classList.add("hidden");
    return;
  }

  meds.forEach((med) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${med.name}</td>
      <td>${med.dosage || "-"}</td>
      <td>${med.timing || "-"}</td>
      <td>${med.duration || "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  section.classList.remove("hidden");
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Allow Enter key to trigger search
document.addEventListener("DOMContentLoaded", function () {
  const patientIdInput = document.getElementById("patientIdInput");
  if (patientIdInput) {
    patientIdInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchPatient();
      }
    });
  }
});
