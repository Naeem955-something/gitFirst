const editBtn = document.getElementById("editBtn");
const editActions = document.getElementById("editActions");
const profileView = document.getElementById("profileView");
const profileForm = document.getElementById("profileForm");
const cancelBtn = document.getElementById("cancelBtn");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const profileImageInput = document.getElementById("profileImageInput");
const avatarPreview = document.getElementById("avatarPreview");
const profileNameLabel = document.getElementById("profile_name");
const patientIdLabel = document.getElementById("patient_id_label");

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
  profileForm.reset();
  loadFormData(originalData);
  profileView.classList.remove("hidden");
  profileForm.classList.add("hidden");
  editBtn.classList.remove("hidden");
  editActions.classList.add("hidden");
  changePhotoBtn.classList.add("hidden");
});

// 🖼 Preview new profile image
profileImageInput?.addEventListener("change", () => {
  const file = profileImageInput.files[0];
  if (file) avatarPreview.src = URL.createObjectURL(file);
});

// 🖱 Trigger file input when camera icon clicked
changePhotoBtn?.addEventListener("click", () => {
  profileImageInput.click();
});

// ⏬ Load profile from backend
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/patient/profile");
    const data = await res.json();
    originalData = { ...data };
    loadViewData(data);
    loadFormData(data);
  } catch (err) {
    console.error("Error fetching profile:", err);
    alert("Failed to load profile data.");
  }
});

// 🧾 View mode field loader
function loadViewData(data) {
  document.getElementById("view_full_name").textContent = data.full_name || "—";
  document.getElementById("view_gender").textContent = data.gender || "—";
  document.getElementById("view_age").textContent = data.age || "—";
  document.getElementById("view_blood_group").textContent =
    data.blood_group || "—";
  document.getElementById("view_email").textContent = data.email || "—";
  document.getElementById("view_phone_number").textContent =
    data.phone_number || "—";
  document.getElementById("view_address").textContent = data.address || "—";
  document.getElementById("view_chronic_conditions").textContent =
    data.chronic_conditions || "—";
  document.getElementById("view_allergies").textContent = data.allergies || "—";
  document.getElementById("view_past_surgeries").textContent =
    data.past_surgeries || "—";
  document.getElementById("view_family_medical_history").textContent =
    data.family_medical_history || "—";

  profileNameLabel.textContent = data.full_name || "Full Name";
  patientIdLabel.textContent = `Patient ID: ${data.user_id || "—"}`;
  if (data.profile_picture_path) {
    const imageUrl = data.profile_picture_path.startsWith("http")
      ? data.profile_picture_path
      : window.location.origin + data.profile_picture_path;
    avatarPreview.src = imageUrl;
  }
}

// 🧾 Edit form loader
function loadFormData(data) {
  profileForm.full_name.value = data.full_name || "";
  profileForm.gender.value = data.gender || "";
  profileForm.age.value = data.age || "";
  profileForm.blood_group.value = data.blood_group || "";
  profileForm.email.value = data.email || "";
  profileForm.phone_number.value = data.phone_number || "";
  profileForm.address.value = data.address || "";
  profileForm.chronic_conditions.value = data.chronic_conditions || "";
  profileForm.allergies.value = data.allergies || "";
  profileForm.past_surgeries.value = data.past_surgeries || "";
  profileForm.family_medical_history.value = data.family_medical_history || "";
}

// 💾 Save Profile
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(profileForm);

  try {
    const res = await fetch("/patient/profile", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      alert("Profile updated successfully.");

      // Update the view with new data
      const newData = Object.fromEntries(formData.entries());
      if (formData.get("profile_picture")) {
        newData.profile_picture_path = URL.createObjectURL(
          formData.get("profile_picture")
        );
      }
      loadViewData(newData);

      // Switch back to view mode
      profileView.classList.remove("hidden");
      profileForm.classList.add("hidden");
      editBtn.classList.remove("hidden");
      editActions.classList.add("hidden");
      changePhotoBtn.classList.add("hidden");
    } else {
      alert(result.message || "Update failed.");
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    alert("Something went wrong.");
  }
});
