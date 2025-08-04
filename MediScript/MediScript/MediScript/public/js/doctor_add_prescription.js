// Global variables
let patientData = {};
let testCounter = 0;
let medicineCounter = 0;
let allMedicines = [];

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  // Get patient ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("patient_id");

  if (!patientId) {
    alert("No patient ID provided");
    window.history.back();
    return;
  }

  // Load patient data
  await loadPatientData(patientId);

  // Load medicines for search
  await loadMedicines();

  // Add initial medicine and test fields
  addMedicine();
  addTest();
});

// Load patient data
async function loadPatientData(patientId) {
  try {
    const res = await fetch(`/doctor/search-patient/${patientId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Patient not found");
    }

    const { patient } = await res.json();

    // Validate patient data
    if (!patient || !patient.full_name) {
      throw new Error("Invalid patient data received");
    }

    patientData = patient;

    // Populate patient info fields
    document.getElementById("patientName").value = patient.full_name;
    document.getElementById("patientId").value = patientId;
    document.getElementById("patientAge").value = patient.age || "";
    document.getElementById("patientGender").value = patient.gender || "";
    document.getElementById("patientPhone").value = patient.phone_number || "";

    console.log("Patient data loaded successfully:", patient);
  } catch (err) {
    console.error("Error loading patient:", err);
    alert(`Failed to load patient data: ${err.message}`);
    window.history.back();
  }
}

// Load medicines for search
async function loadMedicines() {
  try {
    // Try doctor medicines route first
    let res = await fetch("/doctor/medicines");
    if (!res.ok) {
      console.warn(
        "Failed to load medicines from doctor endpoint, trying admin..."
      );
      // Fallback to admin route
      res = await fetch("/admin/medicines");
      if (!res.ok) {
        console.warn(
          "Failed to load medicines from admin endpoint, using empty array"
        );
        allMedicines = [];
        return;
      }
    }

    allMedicines = await res.json();
    console.log(`Loaded ${allMedicines.length} medicines for search`);
  } catch (err) {
    console.error("Error loading medicines:", err);
    // Don't show alert, just use empty array
    allMedicines = [];
  }
}

// Add test field
function addTest() {
  testCounter++;
  const container = document.getElementById("testsContainer");

  const testDiv = document.createElement("div");
  testDiv.className =
    "flex items-center space-x-3 p-3 border rounded bg-gray-50";
  testDiv.innerHTML = `
    <div class="flex-1">
      <input
        type="text"
        name="tests[]"
        placeholder="Enter test name"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        list="commonTests"
      >
      <datalist id="commonTests">
        <option value="Blood Test">
        <option value="Urine Test">
        <option value="X-Ray">
        <option value="ECG">
        <option value="Ultrasound">
        <option value="CT Scan">
        <option value="MRI">
        <option value="Biopsy">
        <option value="Endoscopy">
        <option value="Colonoscopy">
      </datalist>
    </div>
    <button
      type="button"
      onclick="removeTest(this)"
      class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
    >
      ❌ Remove
    </button>
  `;

  container.appendChild(testDiv);
}

// Remove test field
function removeTest(button) {
  button.parentElement.remove();
}

// Add medicine field
function addMedicine() {
  medicineCounter++;
  const container = document.getElementById("medicinesContainer");

  const medicineDiv = document.createElement("div");
  medicineDiv.className = "border rounded p-4 bg-gray-50";
  medicineDiv.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
        <div class="relative">
          <input
            type="text"
            name="medicines[${medicineCounter}][name]"
            placeholder="Search medicine..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            oninput="searchMedicines(this, ${medicineCounter})"
            autocomplete="off"
          >
          <div id="medicineSuggestions${medicineCounter}" class="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-60 overflow-y-auto"></div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
        <input
          type="text"
          name="medicines[${medicineCounter}][dosage]"
          placeholder="e.g., 1 Tablet, 10 ml"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Timing</label>
        <select
          name="medicines[${medicineCounter}][timing]"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Timing</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
          <option value="Before Meal">Before Meal</option>
          <option value="After Meal">After Meal</option>
          <option value="Empty Stomach">Empty Stomach</option>
          <option value="Twice Daily">Twice Daily</option>
          <option value="Thrice Daily">Thrice Daily</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Duration</label>
        <input
          type="text"
          name="medicines[${medicineCounter}][duration]"
          placeholder="e.g., 5 days, 1 week"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
        <textarea
          name="medicines[${medicineCounter}][notes]"
          rows="2"
          placeholder="Food restrictions, warnings, etc."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
      </div>
    </div>
    <div class="mt-3 flex justify-end">
      <button
        type="button"
        onclick="removeMedicine(this)"
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
      >
        ❌ Remove Medicine
      </button>
    </div>
  `;

  container.appendChild(medicineDiv);
}

// Remove medicine field
function removeMedicine(button) {
  button.closest(".border").remove();
}

// Search medicines with autocomplete
function searchMedicines(input, counter) {
  const query = input.value.toLowerCase();
  const suggestionsDiv = document.getElementById(
    `medicineSuggestions${counter}`
  );

  if (query.length < 2) {
    suggestionsDiv.classList.add("hidden");
    return;
  }

  // Find matching medicines
  const matches = allMedicines.filter(
    (med) =>
      med.name.toLowerCase().includes(query) ||
      med.generic_name?.toLowerCase().includes(query)
  );

  // Get unique generic names for alternatives
  const matchedGenerics = [
    ...new Set(matches.map((med) => med.generic_name).filter(Boolean)),
  ];

  // Find all medicines with same generic names
  const alternatives = allMedicines.filter((med) =>
    matchedGenerics.includes(med.generic_name)
  );

  // Combine and remove duplicates
  const allSuggestions = [
    ...new Map(
      [...matches, ...alternatives].map((med) => [med.medicine_id, med])
    ).values(),
  ];

  if (allSuggestions.length === 0) {
    suggestionsDiv.classList.add("hidden");
    return;
  }

  // Display suggestions
  suggestionsDiv.innerHTML = allSuggestions
    .map(
      (med) => `
    <div
      class="px-3 py-2 hover:bg-blue-100 cursor-pointer border-b border-gray-200"
      onclick="selectMedicine('${med.name}', ${counter})"
    >
      <div class="font-medium">${med.name}</div>
      <div class="text-sm text-gray-600">
        ${med.generic_name ? `Generic: ${med.generic_name}` : ""} 
        ${med.strength ? `• ${med.strength}` : ""}
        ${med.type ? `• ${med.type}` : ""}
      </div>
    </div>
  `
    )
    .join("");

  suggestionsDiv.classList.remove("hidden");
}

// Select medicine from suggestions
function selectMedicine(medicineName, counter) {
  const input = document.querySelector(
    `input[name="medicines[${counter}][name]"]`
  );
  input.value = medicineName;

  // Hide suggestions
  document
    .getElementById(`medicineSuggestions${counter}`)
    .classList.add("hidden");
}

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".relative")) {
    document.querySelectorAll('[id^="medicineSuggestions"]').forEach((div) => {
      div.classList.add("hidden");
    });
  }
});

// Handle form submission
document
  .getElementById("prescriptionForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Show preview
    showPrescriptionPreview();
  });

// Validate form
function validateForm() {
  const symptoms = document
    .querySelector('textarea[name="symptoms"]')
    .value.trim();
  const diagnosis = document
    .querySelector('textarea[name="diagnosis"]')
    .value.trim();

  if (!symptoms) {
    alert("Please enter symptoms");
    return false;
  }

  if (!diagnosis) {
    alert("Please enter diagnosis");
    return false;
  }

  // Check if at least one medicine is added
  const medicines = document.querySelectorAll(
    '[name^="medicines"][name$="[name]"]'
  );
  let hasValidMedicine = false;

  medicines.forEach((med) => {
    if (med.value.trim()) {
      hasValidMedicine = true;
    }
  });

  if (!hasValidMedicine) {
    alert("Please add at least one medicine");
    return false;
  }

  return true;
}

// Show prescription preview
function showPrescriptionPreview() {
  const previewDiv = document.getElementById("prescriptionPreview");

  // Get form data
  const formData = new FormData(document.getElementById("prescriptionForm"));
  const symptoms = formData.get("symptoms");
  const diagnosis = formData.get("diagnosis");
  const tests = formData.getAll("tests[]").filter((test) => test.trim());

  // Get medicines data - collect from all medicine fields
  const medicines = [];
  const medicineContainers = document.querySelectorAll(
    "#medicinesContainer .border"
  );

  medicineContainers.forEach((container) => {
    const nameInput = container.querySelector('input[name*="[name]"]');
    const dosageInput = container.querySelector('input[name*="[dosage]"]');
    const timingSelect = container.querySelector('select[name*="[timing]"]');
    const durationInput = container.querySelector('input[name*="[duration]"]');
    const notesTextarea = container.querySelector('textarea[name*="[notes]"]');

    const name = nameInput?.value?.trim();
    const dosage = dosageInput?.value?.trim();
    const timing = timingSelect?.value?.trim();
    const duration = durationInput?.value?.trim();
    const notes = notesTextarea?.value?.trim();

    if (name) {
      medicines.push({
        name: name,
        dosage: dosage || "",
        timing: timing || "",
        duration: duration || "",
        notes: notes || "",
      });
    }
  });

  // Generate preview HTML
  const previewHTML = `
    <div class="max-w-4xl mx-auto bg-white p-8 border">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-blue-700">MediScript</h1>
        <p class="text-gray-600">Digital Prescription System</p>
      </div>
      
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="font-semibold text-gray-700">Patient Information</h3>
          <p><strong>Name:</strong> ${patientData.full_name}</p>
          <p><strong>ID:</strong> ${patientData.user_id}</p>
          <p><strong>Age:</strong> ${patientData.age}</p>
          <p><strong>Gender:</strong> ${patientData.gender}</p>
          <p><strong>Phone:</strong> ${patientData.phone_number}</p>
        </div>
        <div>
          <h3 class="font-semibold text-gray-700">Prescription Details</h3>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Doctor:</strong> Dr. [Doctor Name]</p>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">Symptoms</h3>
        <p class="border-l-4 border-blue-500 pl-4">${symptoms}</p>
      </div>
      
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">Diagnosis</h3>
        <p class="border-l-4 border-green-500 pl-4">${diagnosis}</p>
      </div>
      
      ${
        tests.length > 0
          ? `
        <div class="mb-6">
          <h3 class="font-semibold text-gray-700 mb-2">Suggested Tests</h3>
          <ul class="list-disc list-inside">
            ${tests.map((test) => `<li>${test}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      <div class="mb-6">
        <h3 class="font-semibold text-gray-700 mb-2">Medicines</h3>
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
                <td class="border border-gray-300 px-3 py-2">${med.name}</td>
                <td class="border border-gray-300 px-3 py-2">${med.dosage}</td>
                <td class="border border-gray-300 px-3 py-2">${med.timing}</td>
                <td class="border border-gray-300 px-3 py-2">${med.duration}</td>
                <td class="border border-gray-300 px-3 py-2">${med.notes}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <div class="text-center mt-8">
        <p class="text-sm text-gray-600">This is a digital prescription generated by MediScript</p>
      </div>
    </div>
  `;

  previewDiv.innerHTML = previewHTML;
  document.getElementById("previewModal").classList.remove("hidden");
  document.getElementById("previewModal").classList.add("flex");
}

// Close preview modal
function closePreviewModal() {
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("previewModal").classList.remove("flex");
}

// Confirm prescription
async function confirmPrescription() {
  try {
    // Get form data
    const formData = new FormData(document.getElementById("prescriptionForm"));

    // Prepare prescription data
    const prescriptionData = {
      patient_id: patientData.user_id,
      symptoms: formData.get("symptoms"),
      diagnosis: formData.get("diagnosis"),
      tests: formData.getAll("tests[]").filter((test) => test.trim()),
      medicines: [],
    };

    // Get medicines data - collect from all medicine fields
    const medicineContainers = document.querySelectorAll(
      "#medicinesContainer .border"
    );

    console.log(`Found ${medicineContainers.length} medicine containers`);

    medicineContainers.forEach((container, index) => {
      const nameInput = container.querySelector('input[name*="[name]"]');
      const dosageInput = container.querySelector('input[name*="[dosage]"]');
      const timingSelect = container.querySelector('select[name*="[timing]"]');
      const durationInput = container.querySelector(
        'input[name*="[duration]"]'
      );
      const notesTextarea = container.querySelector(
        'textarea[name*="[notes]"]'
      );

      const name = nameInput?.value?.trim();
      const dosage = dosageInput?.value?.trim();
      const timing = timingSelect?.value?.trim();
      const duration = durationInput?.value?.trim();
      const notes = notesTextarea?.value?.trim();

      console.log(`Medicine ${index + 1}:`, {
        name,
        dosage,
        timing,
        duration,
        notes,
      });

      if (name) {
        prescriptionData.medicines.push({
          name: name,
          dosage: dosage || "",
          timing: timing || "",
          duration: duration || "",
          notes: notes || "",
        });
      }
    });

    console.log("Prescription data to submit:", prescriptionData);

    // Submit prescription
    const res = await fetch("/doctor/prescription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prescriptionData),
    });

    const result = await res.json();
    console.log("Server response:", result);

    if (!res.ok) {
      throw new Error(result.message || "Failed to save prescription");
    }

    // Close modal and show success
    closePreviewModal();
    alert("Prescription saved successfully!");

    // Redirect back to prescription search page
    window.location.href = "doctor_prescribe.html";
  } catch (err) {
    console.error("Error saving prescription:", err);
    alert(`Failed to save prescription: ${err.message}`);
  }
}
