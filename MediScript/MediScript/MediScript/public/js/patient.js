// ✅ Load session-based patient data when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/patient/profile", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      // Redirect to login if session is invalid
      window.location.href = "../index.html";
      return;
    }

    const data = await res.json();

    // ✅ Set patient name
    document.getElementById("patientName").textContent =
      data.full_name || "Patient";

    // 🔁 Optional: Load other data
    document.querySelector(
      ".latest-prescription-date"
    ).textContent = `Issued on: ${data.latest_prescription?.date || "..."}`;
    document.querySelector(
      ".latest-prescription-doctor"
    ).textContent = `By Dr. ${data.latest_prescription?.doctor || "..."}`;
    document.querySelector(
      ".latest-prescription-summary"
    ).textContent = `Diagnosis: ${
      data.latest_prescription?.diagnosis || "..."
    }`;

    document.querySelector(".refill-pending").textContent = `Pending: ${
      data.refill_status?.pending || 0
    }`;
    document.querySelector(".refill-approved").textContent = `Approved: ${
      data.refill_status?.approved || 0
    }`;
    document.querySelector(".refill-rejected").textContent = `Rejected: ${
      data.refill_status?.rejected || 0
    }`;

    document.querySelector(".consulted-total").textContent = `Total: ${
      data.consulted_doctors?.total || 0
    }`;
    document.querySelector(".consulted-recent").textContent = `Recent: Dr. ${
      data.consulted_doctors?.recent || "..."
    }`;

    document.querySelector(".drug-names").textContent = `Latest: ${
      data.latest_drugs?.names || "..."
    }`;
    document.querySelector(".drug-date").textContent = `Prescribed on: ${
      data.latest_drugs?.date || "..."
    }`;
  } catch (err) {
    console.error("❌ Error loading patient data:", err);
    alert("Session expired. Redirecting to login.");
    window.location.href = "/";
  }
});

// ✅ Logout handler (also in <script> but duplicated here for separation)
function logout() {
  fetch("/auth/logout", {
    method: "POST",
  })
    .then(() => {
      window.location.href = "/index.html";
    })
    .catch(() => {
      alert("Logout failed.");
    });
}
