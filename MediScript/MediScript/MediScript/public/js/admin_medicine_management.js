let currentRefillId = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchRefillQueue();

  const refillForm = document.getElementById("refillForm");
  refillForm.addEventListener("submit", handleRefillSubmit);
});

// Fetch refill queue data
async function fetchRefillQueue() {
  try {
    const res = await fetch("/admin/refill");
    const data = await res.json();
    renderRefillTable(data);
  } catch (err) {
    console.error("Error loading refill queue", err);
  }
}

// Render table
function renderRefillTable(data) {
  const tbody = document.getElementById("refillTableBody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="px-4 py-2">${item.name}</td>
      <td>${item.type}</td>
      <td>${item.strength || "-"}</td>
      <td>${item.batch_no}</td>
      <td>${item.category || "-"}</td>
      <td>${item.quantity}</td>
      <td class="text-red-600 font-semibold">${formatDate(item.exp)}</td>
      <td class="capitalize">${item.reason.replace("_", " ")}</td>
      <td class="space-x-2">
        <button onclick="openRefillModal(${item.refill_id})"
          class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded">
          <i class="fas fa-sync-alt mr-1"></i> Refill
        </button>
        <button onclick="deleteRefill(${item.refill_id})"
          class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded">
          <i class="fas fa-trash-alt mr-1"></i> Remove
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// Open refill modal
function openRefillModal(refillId) {
  currentRefillId = refillId;
  document.getElementById("refillModal").classList.remove("hidden");
  document.getElementById("refillModal").classList.add("flex");
  document.getElementById("refillForm").reset();
}

// Close modal
function closeRefillModal() {
  document.getElementById("refillModal").classList.add("hidden");
  document.getElementById("refillModal").classList.remove("flex");
  currentRefillId = null;
}

// Submit refill form
async function handleRefillSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch(`/admin/refill/${currentRefillId}/refill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Medicine refilled.");
      closeRefillModal();
      fetchRefillQueue();
    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Refill failed", err);
  }
}

// Permanently delete a medicine
async function deleteRefill(refillId) {
  if (!confirm("Are you sure you want to permanently remove this medicine?"))
    return;

  try {
    const res = await fetch(`/admin/refill/${refillId}/remove`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (res.ok) {
      alert("🗑️ Medicine removed.");
      fetchRefillQueue();
    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Delete failed", err);
  }
}
