// public/js/admin.js

let selectedAppId = null;

async function loadApplications() {
  try {
    const res = await fetch("/admin/applications");
    const data = await res.json();
    const tbody = document.getElementById("applicationTableBody");
    tbody.innerHTML = "";

    data.forEach((app, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-3 border">${index + 1}</td>
        <td class="p-3 border">${app.full_name}</td>
        <td class="p-3 border">${app.email}</td>
        <td class="p-3 border">${app.specialization}</td>
        <td class="p-3 border capitalize">${app.status}</td>
        <td class="p-3 border">
          <button onclick="openReview(${
            app.id
          })" class="bg-blue-600 text-white px-3 py-1 rounded">Review</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load applications", err);
  }
}

async function openReview(id) {
  selectedAppId = id;
  const res = await fetch(`/admin/applications/${id}`);
  const app = await res.json();

  const details = document.getElementById("applicationDetails");
  details.innerHTML = `
    <p><strong>Full Name:</strong> ${app.full_name}</p>
    <p><strong>Email:</strong> ${app.email}</p>
    <p><strong>Phone:</strong> ${app.phone || "N/A"}</p>
    <p><strong>Gender:</strong> ${app.gender || "N/A"}</p>
    <p><strong>Specialization:</strong> ${app.specialization}</p>
    <p><strong>Experience (years):</strong> ${app.experience_years}</p>
    <p><strong>BMDC Number:</strong> ${app.bmdc_number}</p>
    <p><strong>Hospital:</strong> ${app.hospital}</p>
  `;

  document.getElementById("reviewModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("reviewModal").classList.add("hidden");
  selectedAppId = null;
}

async function submitDecision(action) {
  if (!selectedAppId) return;
  const res = await fetch("/admin/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: selectedAppId, action }),
  });
  const result = await res.json();
  alert(result.message);
  closeModal();
  loadApplications();
}

document.addEventListener("DOMContentLoaded", loadApplications);
