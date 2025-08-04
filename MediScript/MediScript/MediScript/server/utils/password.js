const bcrypt = require("bcrypt");

// For hashing passwords during registration
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

// For comparing during login
const comparePasswords = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

module.exports = {
  hashPassword,
  comparePasswords,
};
