let editing = false;
const TEMP_PATIENT_ID = 3; // Replace with session-based ID later

window.onload = async () => {
  try {
    const res = await fetch("/patient/profile");
    const data = await res.json();

    if (!data.success) return;

    const form = document.getElementById("profileForm");
    for (const key in data.profile) {
      if (form.elements[key]) {
        form.elements[key].value = data.profile[key] || "";
      }
    }

    document.getElementById("patientId").textContent = `#${
      data.profile.patient_id || TEMP_PATIENT_ID
    }`;
    if (data.profile.profile_image) {
      document.getElementById(
        "profileImage"
      ).src = `/uploads/profile_images/${data.profile.profile_image}`;
    }
  } catch (err) {
    console.error("Failed to load patient profile", err);
  }
};

function enableEdit() {
  editing = true;
  const form = document.getElementById("profileForm");
  for (const element of form.elements) {
    element.disabled = false;
  }
  document.getElementById("editBtn").classList.add("hidden");
  document.getElementById("editActions").classList.remove("hidden");
  document.getElementById("uploadBtn").classList.remove("hidden");
}

function cancelEdit() {
  location.reload();
}

function saveProfile() {
  const form = document.getElementById("profileForm");
  const formData = new FormData(form);
  const photoInput = document.getElementById("photoInput");
  if (photoInput.files.length > 0) {
    formData.append("profile_image", photoInput.files[0]);
  }

  fetch("/patient/profile", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      location.reload();
    })
    .catch((err) => {
      console.error("Update failed", err);
      alert("Could not update profile.");
    });
}
