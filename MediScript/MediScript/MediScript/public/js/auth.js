// ✅ FILE: public/js/auth.js (FIXED VERSION)

// --------- OPEN MODALS -----------
document
  .querySelector("button[onclick='login_modal.showModal()']")
  ?.addEventListener("click", () => login_modal.showModal());
document
  .querySelector("button[onclick='register_modal.showModal()']")
  ?.addEventListener("click", () => register_modal.showModal());
document
  .querySelector("button[onclick='doctor_modal.showModal()']")
  ?.addEventListener("click", () => doctor_modal.showModal());

window.showForgotPasswordModal = () => forgot_modal.showModal();

// --------- LOGIN -----------
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const data = {
    user_id: form.user_id.value,
    password: form.password.value,
    role: form.role.value,
  };

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      alert(result.message);
      window.location.href = result.redirect;
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Something went wrong.");
  }
});

// --------- REGISTER (PATIENT) -----------
document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const data = {
      patient_id: form.patient_id.value,
      full_name: form.full_name.value,
      email: form.email.value,
      password: form.password.value,
      age: form.age.value,
      gender: form.gender.value,
      blood_group: form.blood_group.value,
      phone_number: form.phone_number.value,
    };

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Registration successful");
        register_modal.close();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong.");
    }
  });

// --------- DOCTOR APPLICATION -----------
document.getElementById("doctorForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch("/doctor/apply", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (res.ok) {
      alert("Application submitted. Await admin approval.");
      doctor_modal.close();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Doctor application error:", err);
    alert("Something went wrong.");
  }
});

// --------- FORGOT PASSWORD -----------
const forgotForm = document.getElementById("forgotForm");
const otpForm = document.getElementById("otpForm");
const resetForm = document.getElementById("resetForm");

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forgotForm.email.value;

    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("OTP sent. Check your email.");
        forgotForm.classList.add("hidden");
        otpForm.classList.remove("hidden");
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      alert("Something went wrong.");
    }
  });
}

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user_id = otpForm.user_id.value;
    const otp_code = otpForm.otp_code.value;

    try {
      const res = await fetch("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, otp_code }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("OTP verified. Please enter your new password.");
        otpForm.classList.add("hidden");
        resetForm.classList.remove("hidden");
        resetForm.user_id.value = user_id;
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      alert("Something went wrong.");
    }
  });
}

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user_id = resetForm.user_id.value;
    const new_password = resetForm.new_password.value;

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, new_password }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Password reset successful. You can now log in.");
        forgot_modal.close();
        forgotForm.reset();
        otpForm.reset();
        resetForm.reset();
        forgotForm.classList.remove("hidden");
        otpForm.classList.add("hidden");
        resetForm.classList.add("hidden");
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      alert("Something went wrong.");
    }
  });
}
