let editing = false;
let doctorId = "#DOC00001";

window.onload = async () => {
  try {
    const res = await fetch("/doctor/profile");
    const data = await res.json();

    if (!data.success) return alert("Error loading profile");

    const form = document.getElementById("profileForm");
    for (const key in data.profile) {
      if (form.elements[key]) {
        form.elements[key].value = data.profile[key];
      }
    }

    document.getElementById("fullNameLabel").textContent = "Dr. " + form.elements["full_name"].value;
    document.getElementById("doctorIdLabel").textContent = doctorId;

    if (data.profile_image) {
      document.getElementById("profilePic").src = "/uploads/profile_images/" + data.profile_image;
    }
  } catch (err) {
    console.error("Failed to load doctor profile", err);
  }
};

function toggleEdit() {
  editing = true;
  const form = document.getElementById("profileForm");
  for (const element of form.elements) {
    element.disabled = false;
  }
  document.getElementById("editBtn").classList.add("hidden");
  document.getElementById("saveBtn").classList.remove("hidden");
  document.getElementById("cancelBtn").classList.remove("hidden");
  document.getElementById("uploadBtn").classList.remove("hidden");
}

function cancelEdit() {
  location.reload();
}

function saveChanges() {
  const form = document.getElementById("profileForm");
  const formData = new FormData(form);
  const fileInput = document.getElementById("uploadPhoto");

  if (fileInput.files.length > 0) {
    formData.append("profile_image", fileInput.files[0]);
  }

  fetch("/doctor/profile", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Profile updated");
      location.reload();
    })
    .catch((err) => {
      console.error(err);
      alert("Error updating profile");
    });
}
