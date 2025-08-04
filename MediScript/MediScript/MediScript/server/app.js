const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const MySQLStore = require("express-mysql-session")(session);
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mediscript",
});
const app = express();

dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

// Routes (example)
app.use("/auth", require("./routes/authRoutes"));
app.use("/doctor", require("./routes/doctorRoutes"));
app.use("/patient", require("./routes/patientRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/", require("./routes/publicRoutes"));

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
