// ✅ Load session-based doctor data on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/doctor/profile", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    // 🔍 Log for debugging
    console.log("Doctor profile response status:", res.status);

    if (!res.ok) {
      // 🚨 Either session expired or unauthorized
      const errorData = await res.json().catch(() => ({}));
      console.warn("⚠️ Profile fetch failed:", errorData.message || "Unknown");
      window.location.href = "/index.html";
      return;
    }

    const data = await res.json();
    console.log("✅ Doctor profile loaded:", data);

    // ✅ Set doctor name
    const doctorNameEl = document.getElementById("doctorName");
    if (doctorNameEl) doctorNameEl.textContent = data.full_name || "Doctor";

    // ✅ Set avatar
    if (data.profile_picture_path && document.getElementById("doctorAvatar")) {
      document.getElementById("doctorAvatar").src =
        window.location.origin + data.profile_picture_path;
    }
  } catch (err) {
    console.error("❌ Error fetching doctor profile:", err);
    alert("Session expired. Redirecting to login.");
    window.location.href = "/index.html";
  }
});

// ✅ Logout handler
function logout() {
  fetch("/auth/logout", { method: "POST" })
    .then(() => {
      window.location.href = "/index.html";
    })
    .catch(() => {
      alert("Logout failed.");
    });
}
