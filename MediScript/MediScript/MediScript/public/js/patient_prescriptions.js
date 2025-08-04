// Global variables
let currentPrescription = null;
let prescriptions = [];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadPrescriptions();
});

// Load prescriptions
async function loadPrescriptions() {
  try {
    const response = await fetch("/patient/prescriptions");
    if (!response.ok) {
      throw new Error("Failed to load prescriptions");
    }

    prescriptions = await response.json();
    renderPrescriptions();
  } catch (error) {
    console.error("Error loading prescriptions:", error);
    showError("Failed to load prescriptions. Please try again.");
  }
}

// Render prescriptions table
function renderPrescriptions() {
  const loadingState = document.getElementById("loadingState");
  const prescriptionsSection = document.getElementById("prescriptionsSection");
  const emptyState = document.getElementById("emptyState");
  const tableBody = document.getElementById("prescriptionsTableBody");

  loadingState.classList.add("hidden");

  if (prescriptions.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  prescriptionsSection.classList.remove("hidden");
  tableBody.innerHTML = "";

  prescriptions.forEach((prescription) => {
    const row = document.createElement("tr");
    row.className = "border-b border-gray-200 hover:bg-gray-50";

    const statusClass = getStatusClass(prescription.status);

    row.innerHTML = `
      <td class="px-6 py-4 font-medium">RX${prescription.prescription_id
        .toString()
        .padStart(5, "0")}</td>
      <td class="px-6 py-4">Dr. ${prescription.doctor_name}</td>
      <td class="px-6 py-4">${formatDate(prescription.created_at)}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
          ${prescription.status}
        </span>
      </td>
      <td class="px-6 py-4">
        <button
          onclick="viewPrescription(${prescription.prescription_id})"
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          🔘 View Prescription
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// Get status class for styling
function getStatusClass(status) {
  switch (status) {
    case "Refillable":
      return "bg-green-100 text-green-800";
    case "Partially Refillable":
      return "bg-yellow-100 text-yellow-800";
    case "Non-Refillable":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// View prescription details
async function viewPrescription(prescriptionId) {
  try {
    const response = await fetch(`/patient/prescription/${prescriptionId}`);
    if (!response.ok) {
      throw new Error("Failed to load prescription details");
    }

    const data = await response.json();
    currentPrescription = data;

    renderPrescriptionModal(data);
    showPrescriptionModal();
  } catch (error) {
    console.error("Error loading prescription details:", error);
    showError("Failed to load prescription details.");
  }
}

// Render prescription modal
function renderPrescriptionModal(data) {
  const modalContent = document.getElementById("prescriptionDetails");

  const medicinesHtml = data.medicines
    .map((medicine) => {
      const refillButton = medicine.isRefillable
        ? `<button onclick="addToRefillCart(${medicine.id})" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
           Refill
         </button>`
        : `<span class="text-red-600 text-sm font-medium">Non-Refillable</span>`;

      return `
      <tr class="border-b border-gray-200">
        <td class="px-4 py-3">${medicine.medicine_name}</td>
        <td class="px-4 py-3">${medicine.dosage || "-"}</td>
        <td class="px-4 py-3">${medicine.timing || "-"}</td>
        <td class="px-4 py-3">${medicine.duration || "-"}</td>
        <td class="px-4 py-3">${medicine.notes || "-"}</td>
        <td class="px-4 py-3">${refillButton}</td>
      </tr>
    `;
    })
    .join("");

  const testsHtml =
    data.tests.length > 0
      ? data.tests.map((test) => `<li class="mb-1">• ${test}</li>`).join("")
      : '<li class="text-gray-500">No tests suggested</li>';

  modalContent.innerHTML = `
    <div class="space-y-6">
      <!-- Prescription Header -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold text-blue-700">Patient Information</h3>
            <p><strong>Name:</strong> ${data.prescription.patient_name}</p>
            <p><strong>Prescription ID:</strong> RX${data.prescription.prescription_id
              .toString()
              .padStart(5, "0")}</p>
            <p><strong>Date:</strong> ${formatDate(
              data.prescription.created_at
            )}</p>
          </div>
          <div>
            <h3 class="font-semibold text-blue-700">Doctor Information</h3>
            <p><strong>Doctor:</strong> Dr. ${data.prescription.doctor_name}</p>
          </div>
        </div>
      </div>

      <!-- Symptoms & Diagnosis -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Symptoms</h3>
          <p class="border-l-4 border-blue-500 pl-4 bg-gray-50 p-3 rounded">
            ${data.prescription.symptoms || "No symptoms recorded"}
          </p>
        </div>
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Diagnosis</h3>
          <p class="border-l-4 border-green-500 pl-4 bg-gray-50 p-3 rounded">
            ${data.prescription.diagnosis || "No diagnosis recorded"}
          </p>
        </div>
      </div>

      <!-- Suggested Tests -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-2">Suggested Tests</h3>
        <ul class="list-disc list-inside bg-gray-50 p-3 rounded">
          ${testsHtml}
        </ul>
      </div>

      <!-- Medicines -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-2">Medicines</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left">Medicine</th>
                <th class="px-4 py-2 text-left">Dosage</th>
                <th class="px-4 py-2 text-left">Timing</th>
                <th class="px-4 py-2 text-left">Duration</th>
                <th class="px-4 py-2 text-left">Notes</th>
                <th class="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Additional Advice -->
      ${
        data.prescription.additional_advice
          ? `
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Additional Advice</h3>
          <p class="bg-yellow-50 border-l-4 border-yellow-500 pl-4 p-3 rounded">
            ${data.prescription.additional_advice}
          </p>
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Show prescription modal
function showPrescriptionModal() {
  const modal = document.getElementById("prescriptionModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Close prescription modal
function closePrescriptionModal() {
  const modal = document.getElementById("prescriptionModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  currentPrescription = null;
}

// Add medicine to refill cart
async function addToRefillCart(prescriptionMedicineId) {
  try {
    const response = await fetch("/patient/refill-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prescription_medicine_id: prescriptionMedicineId,
        quantity: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add to cart");
    }

    showSuccess("Medicine added to refill cart successfully!");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showError(error.message || "Failed to add medicine to cart");
  }
}

// Download prescription as PDF
function downloadPrescription() {
  if (!currentPrescription) {
    showError("No prescription data available");
    return;
  }

  // For now, we'll create a simple text-based download
  // In a real implementation, you'd use a PDF library like jsPDF
  const prescriptionText = generatePrescriptionText(currentPrescription);

  const blob = new Blob([prescriptionText], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prescription_${currentPrescription.prescription.prescription_id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Generate prescription text for download
function generatePrescriptionText(data) {
  const prescription = data.prescription;

  let text = `MEDISCRIPT - DIGITAL PRESCRIPTION\n`;
  text += `=====================================\n\n`;
  text += `Prescription ID: RX${prescription.prescription_id
    .toString()
    .padStart(5, "0")}\n`;
  text += `Date: ${formatDate(prescription.created_at)}\n`;
  text += `Patient: ${prescription.patient_name}\n`;
  text += `Doctor: Dr. ${prescription.doctor_name}\n\n`;

  text += `SYMPTOMS:\n${prescription.symptoms || "No symptoms recorded"}\n\n`;
  text += `DIAGNOSIS:\n${
    prescription.diagnosis || "No diagnosis recorded"
  }\n\n`;

  if (data.tests.length > 0) {
    text += `SUGGESTED TESTS:\n`;
    data.tests.forEach((test) => {
      text += `• ${test}\n`;
    });
    text += `\n`;
  }

  text += `MEDICINES:\n`;
  data.medicines.forEach((medicine, index) => {
    text += `${index + 1}. ${medicine.medicine_name}\n`;
    text += `   Dosage: ${medicine.dosage || "Not specified"}\n`;
    text += `   Timing: ${medicine.timing || "Not specified"}\n`;
    text += `   Duration: ${medicine.duration || "Not specified"}\n`;
    if (medicine.notes) {
      text += `   Notes: ${medicine.notes}\n`;
    }
    text += `\n`;
  });

  if (prescription.additional_advice) {
    text += `ADDITIONAL ADVICE:\n${prescription.additional_advice}\n\n`;
  }

  text += `This is a digital prescription generated by MediScript.\n`;
  text += `Generated on: ${new Date().toLocaleString()}\n`;

  return text;
}

// Show success message
function showSuccess(message) {
  // You can implement a toast notification here
  alert("✅ " + message);
}

// Show error message
function showError(message) {
  // You can implement a toast notification here
  alert("❌ " + message);
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  const modal = document.getElementById("prescriptionModal");
  if (e.target === modal) {
    closePrescriptionModal();
  }
});
