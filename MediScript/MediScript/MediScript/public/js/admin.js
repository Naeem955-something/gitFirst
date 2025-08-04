// ✅ FILE: public/js/admin.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/admin/summary");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load summary");
    }

    document.getElementById("adminName").textContent =
      data.full_name || "Admin";

    // 🧾 Fill dashboard values
    document.getElementById("doctor-count").textContent = data.totalDoctors;
    document.getElementById("pending-count").textContent =
      data.pendingApplications;
    document.getElementById("patient-count").textContent = data.totalPatients;
    document.getElementById("medicine-count").textContent = data.totalMedicines;
    document.getElementById("request-count").textContent = data.pendingRefills;
  } catch (err) {
    console.error("Dashboard load failed:", err);
    alert("Could not load admin dashboard summary.");
  }
});
