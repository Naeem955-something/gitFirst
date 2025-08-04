const bcrypt = require("bcrypt");

const hashManual = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plain, salt);
  console.log("👉 Hashed password:", hash);
};

hashManual("admin1234"); // change password here and run: node hash.js
