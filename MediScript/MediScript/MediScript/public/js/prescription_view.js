// Load prescription details when page loads
document.addEventListener("DOMContentLoaded", async () => {
  // Get prescription ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const prescriptionId = urlParams.get("id");

  if (!prescriptionId) {
    alert("No prescription ID provided");
    window.history.back();
    return;
  }

  await loadPrescription(prescriptionId);
});

// Load prescription data
async function loadPrescription(prescriptionId) {
  try {
    const res = await fetch(`/doctor/prescription/${prescriptionId}`);
    if (!res.ok) throw new Error("Prescription not found");

    const data = await res.json();
    displayPrescription(data);
  } catch (err) {
    console.error("Error loading prescription:", err);
    document.getElementById("loadingState").innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
        <p class="mt-2 text-gray-600">Failed to load prescription</p>
        <button onclick="window.history.back()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Go Back
        </button>
      </div>
    `;
  }
}

// Display prescription
function displayPrescription(data) {
  const { prescription, tests, medicines } = data;

  // Hide loading, show content
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("prescriptionDisplay").classList.remove("hidden");

  const displayDiv = document.getElementById("prescriptionDisplay");

  displayDiv.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8 border-b pb-6">
        <h1 class="text-3xl font-bold text-blue-700">MediScript</h1>
        <p class="text-gray-600">Digital Prescription System</p>
        <p class="text-sm text-gray-500 mt-2">Prescription ID: ${
          prescription.prescription_id
        }</p>
      </div>
      
      <!-- Patient and Doctor Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div class="bg-gray-50 p-4 rounded">
          <h3 class="font-semibold text-gray-700 mb-3">👤 Patient Information</h3>
          <p><strong>Name:</strong> ${prescription.patient_name}</p>
          <p><strong>ID:</strong> ${prescription.patient_id}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <h3 class="font-semibold text-gray-700 mb-3">👨‍⚕️ Doctor Information</h3>
          <p><strong>Name:</strong> Dr. ${prescription.doctor_name}</p>
          <p><strong>Date:</strong> ${formatDate(prescription.created_at)}</p>
        </div>
      </div>
      
      <!-- Symptoms -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">🔍 Symptoms</h3>
        <div class="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded">
          <p class="text-gray-800">${
            prescription.symptoms || "No symptoms recorded"
          }</p>
        </div>
      </div>
      
      <!-- Diagnosis -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">🏥 Diagnosis</h3>
        <div class="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded">
          <p class="text-gray-800">${
            prescription.diagnosis || "No diagnosis recorded"
          }</p>
        </div>
      </div>
      
      <!-- Tests -->
      ${
        tests && tests.length > 0
          ? `
        <div class="mb-6">
          <h3 class="font-semibold text-gray-700 mb-2">🧪 Suggested Tests</h3>
          <div class="bg-yellow-50 p-3 rounded">
            <ul class="list-disc list-inside space-y-1">
              ${tests
                .map((test) => `<li class="text-gray-800">${test}</li>`)
                .join("")}
            </ul>
          </div>
        </div>
      `
          : ""
      }
      
      <!-- Medicines -->
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">💊 Prescribed Medicines</h3>
        ${
          medicines && medicines.length > 0
            ? `
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 px-3 py-2 text-left">Medicine</th>
                  <th class="border border-gray-300 px-3 py-2 text-left">Dosage</th>
                  <th class="border border-gray-300 px-3 py-2 text-left">Timing</th>
                  <th class="border border-gray-300 px-3 py-2 text-left">Duration</th>
                  <th class="border border-gray-300 px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                ${medicines
                  .map(
                    (med) => `
                  <tr>
                    <td class="border border-gray-300 px-3 py-2">
                      <div class="font-medium">${
                        med.medicine_name || "Custom Medicine"
                      }</div>
                      ${
                        med.generic_name
                          ? `<div class="text-sm text-gray-600">Generic: ${med.generic_name}</div>`
                          : ""
                      }
                      ${
                        med.strength
                          ? `<div class="text-sm text-gray-600">Strength: ${med.strength}</div>`
                          : ""
                      }
                    </td>
                    <td class="border border-gray-300 px-3 py-2">${
                      med.dosage || "-"
                    }</td>
                    <td class="border border-gray-300 px-3 py-2">${
                      med.timing || "-"
                    }</td>
                    <td class="border border-gray-300 px-3 py-2">${
                      med.duration || "-"
                    }</td>
                    <td class="border border-gray-300 px-3 py-2">${
                      med.notes || "-"
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : `
          <div class="bg-gray-50 p-3 rounded text-gray-600">
            No medicines prescribed
          </div>
        `
        }
      </div>
      
      <!-- Footer -->
      <div class="text-center mt-8 pt-6 border-t">
        <p class="text-sm text-gray-600">This is a digital prescription generated by MediScript</p>
        <p class="text-xs text-gray-500 mt-1">Generated on ${formatDate(
          prescription.created_at
        )}</p>
      </div>
    </div>
  `;
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
