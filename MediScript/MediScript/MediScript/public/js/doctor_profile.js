// ✅ doctor_profile.js (Complete Script)

// DOM Elements
const editBtn = document.getElementById("editBtn");
const editActions = document.getElementById("editActions");
const profileView = document.getElementById("profileView");
const profileForm = document.getElementById("profileForm");
const cancelBtn = document.getElementById("cancelBtn");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const profileImageInput = document.getElementById("profileImageInput");
const avatarPreview = document.getElementById("avatarPreview");
const doctorNameLabel = document.getElementById("profile_name");
const doctorIdLabel = document.getElementById("doctor_id_label");

let originalData = {};

// 🔁 Toggle to Edit Mode
editBtn?.addEventListener("click", () => {
  profileView.classList.add("hidden");
  profileForm.classList.remove("hidden");
  editBtn.classList.add("hidden");
  editActions.classList.remove("hidden");
  changePhotoBtn.classList.remove("hidden");
});

// 🔁 Cancel Edit
cancelBtn?.addEventListener("click", () => {
  // Reset form to original data
  loadFormData(originalData);
  // Reset file input
  if (profileImageInput) {
    profileImageInput.value = "";
  }
  // Reset avatar preview
  if (originalData.profile_picture_path) {
    avatarPreview.src =
      window.location.origin + originalData.profile_picture_path;
  } else {
    avatarPreview.src = "../img/default-profile.png";
  }
  // Switch back to view mode
  profileView.classList.remove("hidden");
  profileForm.classList.add("hidden");
  editBtn.classList.remove("hidden");
  editActions.classList.add("hidden");
  changePhotoBtn.classList.add("hidden");
});

// 🖼 Preview new profile image
profileImageInput?.addEventListener("change", () => {
  const file = profileImageInput.files[0];
  if (file) {
    avatarPreview.src = URL.createObjectURL(file);
  }
});

// 🖱 Trigger file input
changePhotoBtn?.addEventListener("click", () => {
  profileImageInput.click();
});

// ⏬ Load profile from backend
window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("🔄 Loading doctor profile..."); // Debug log
    const res = await fetch("/doctor/profile");
    const data = await res.json();
    console.log("📥 Received profile data:", data); // Debug log

    if (!res.ok) {
      throw new Error(data.message || "Profile fetch failed");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No profile data received");
    }

    originalData = { ...data };
    loadView(data);
    loadFormData(data);
    console.log("✅ Profile loaded successfully"); // Debug log
  } catch (err) {
    console.error("❌ Error loading doctor data:", err);
    alert(
      err.message || "Failed to load doctor profile. Please try again later."
    );
  }
});

// 👀 Load View Mode Data
function loadView(data) {
  document.querySelector("#view_full_name").textContent = data.full_name || "—";
  document.querySelector("#view_gender").textContent = data.gender || "—";
  document.querySelector("#view_age").textContent = data.age || "—";
  document.querySelector("#view_email").textContent = data.email || "—";
  document.querySelector("#view_phone_number").textContent =
    data.phone_number || "—";
  document.querySelector("#view_specialization").textContent =
    data.specialization || "—";
  document.querySelector("#view_department").textContent =
    data.department || "—";
  document.querySelector("#view_experience_years").textContent =
    data.experience_years || "—";
  document.querySelector("#view_bmdc_number").textContent =
    data.bmdc_number || "—";
  document.querySelector("#view_hospital").textContent = data.hospital || "—";
  document.querySelector("#view_address").textContent = data.address || "—";
  document.querySelector("#view_visiting_hours").textContent =
    data.visiting_hours || "—";
  document.querySelector("#view_bio").textContent = data.bio || "—";

  doctorNameLabel.textContent = `Dr. ${data.full_name || "Doctor"}`;
  doctorIdLabel.textContent = `Doctor ID: ${data.user_id || "—"}`;

  // Update profile picture
  if (data.profile_picture_path) {
    const imageUrl = data.profile_picture_path.startsWith("http")
      ? data.profile_picture_path
      : window.location.origin + data.profile_picture_path;
    avatarPreview.src = imageUrl;
  } else {
    avatarPreview.src = "../img/default-profile.png";
  }
}

// ✍️ Load Form for Edit
function loadFormData(data) {
  profileForm.full_name.value = data.full_name || "";
  profileForm.gender.value = data.gender || "";
  profileForm.age.value = data.age || "";
  profileForm.phone_number.value = data.phone_number || "";
  profileForm.specialization.value = data.specialization || "";
  profileForm.department.value = data.department || "";
  profileForm.experience_years.value = data.experience_years || "";
  profileForm.hospital.value = data.hospital || "";
  profileForm.address.value = data.address || "";
  profileForm.visiting_hours.value = data.visiting_hours || "";
  profileForm.bio.value = data.bio || "";
}

// 💾 Save Profile
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("🔄 Submitting profile update..."); // Debug log

  // Validate gender only if it's selected
  const gender = profileForm.gender.value;
  if (gender && !["Male", "Female", "Other"].includes(gender)) {
    alert("Please select a valid gender (Male, Female, or Other)");
    return;
  }

  // Validate numeric fields only if they have values
  const age = profileForm.age.value ? parseInt(profileForm.age.value) : null;
  const experience_years = profileForm.experience_years.value
    ? parseInt(profileForm.experience_years.value)
    : null;

  if (age !== null && (isNaN(age) || age < 0 || age > 150)) {
    alert("Please enter a valid age");
    return;
  }

  if (
    experience_years !== null &&
    (isNaN(experience_years) || experience_years < 0 || experience_years > 100)
  ) {
    alert("Please enter valid years of experience");
    return;
  }

  const formData = new FormData(profileForm);
  console.log("📤 Form data being sent:", Object.fromEntries(formData)); // Debug log

  try {
    const res = await fetch("/doctor/profile", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    console.log("📥 Update response:", result); // Debug log

    if (res.ok) {
      // Update the view with the returned profile data
      if (result.profile) {
        originalData = { ...result.profile }; // Update original data
        loadView(result.profile);

        // Switch back to view mode
        profileView.classList.remove("hidden");
        profileForm.classList.add("hidden");
        editBtn.classList.remove("hidden");
        editActions.classList.add("hidden");
        changePhotoBtn.classList.add("hidden");

        alert("Profile updated successfully.");
      } else {
        alert(
          "Profile updated but failed to load new data. Please refresh the page."
        );
      }
    } else {
      alert(result.message || "Update failed.");
    }
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    alert("Something went wrong.");
  }
});
