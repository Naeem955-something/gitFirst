document.addEventListener("DOMContentLoaded", () => {
  fetchMedicines();

  const form = document.getElementById("addMedicineForm");
  form.addEventListener("submit", handleAddMedicine);
});

// Fetch all medicines
async function fetchMedicines() {
  try {
    const res = await fetch("/admin/medicines");
    const medicines = await res.json();
    console.log("Fetched medicines:", medicines);
    renderTable(medicines);
  } catch (err) {
    console.error("Failed to load medicines", err);
  }
}

// Render medicines in the table
function renderTable(medicines) {
  const tbody = document.getElementById("medicineTableBody");
  tbody.innerHTML = "";

  medicines.forEach((med) => {
    const price = med.price ? Number(med.price) : 0;
    const mfd = med.mfd ? formatDate(med.mfd) : "-";
    const exp = med.exp ? formatDate(med.exp) : "-";
    const expClass =
      med.exp && isExpiring(med.exp) ? "text-red-600 font-bold" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${med.name || "-"}</td>
      <td>${med.type || "-"}</td>
      <td>${med.strength || "-"}</td>
      <td>${med.generic_name || "-"}</td>
      <td>${med.batch_no || "-"}</td>
      <td>${med.category || "-"}</td>
      <td>${med.quantity != null ? med.quantity : "-"}</td>
      <td>${!isNaN(price) ? price.toFixed(2) : "-"}</td>
      <td>${mfd}</td>
      <td class="${expClass}">${exp}</td>
      <td>
        <button onclick="removeMedicine(${med.medicine_id})"
          class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded">
          <i class="fas fa-times mr-1"></i> Remove
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Format date YYYY-MM-DD → DD MMM YYYY
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// Check if expired or expiring in 1 day
function isExpiring(expStr) {
  const today = new Date();
  const exp = new Date(expStr);
  const diff = (exp - today) / (1000 * 60 * 60 * 24);
  return diff <= 1;
}

// Filter search
function filterMedicines() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#medicineTableBody tr");

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

// Open/close modal
function openAddMedicineModal() {
  document.getElementById("addMedicineModal").classList.remove("hidden");
  document.getElementById("addMedicineModal").classList.add("flex");
}
function closeAddMedicineModal() {
  document.getElementById("addMedicineModal").classList.remove("flex");
  document.getElementById("addMedicineModal").classList.add("hidden");
  document.getElementById("addMedicineForm").reset();
}

// Handle add form submit
async function handleAddMedicine(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const res = await fetch("/admin/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("✅ Medicine added!");
      closeAddMedicineModal();
      fetchMedicines();
    } else {
      const err = await res.json();
      alert("❌ Error: " + err.message);
    }
  } catch (err) {
    console.error("Add failed", err);
    alert("❌ Failed to add medicine.");
  }
}

// Remove one medicine manually
async function removeMedicine(id) {
  if (!confirm("Are you sure you want to remove this medicine?")) return;

  try {
    const res = await fetch(`/admin/medicines/${id}/remove`, {
      method: "POST",
    });

    if (res.ok) {
      alert("🗑️ Medicine moved to refill queue.");
      fetchMedicines();
    } else {
      const err = await res.json();
      alert("❌ Error: " + err.message);
    }
  } catch (err) {
    console.error("Remove failed", err);
  }
}

// Bulk remove expired and out-of-stock
async function removeExpiredMedicines() {
  if (!confirm("Remove all expired or out-of-stock medicines?")) return;

  try {
    const res = await fetch("/admin/medicines/remove-expired", {
      method: "POST",
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ " + data.message);
      fetchMedicines();
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    console.error("Bulk remove failed", err);
  }
}
