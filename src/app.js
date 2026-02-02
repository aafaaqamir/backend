const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const salesRoutes = require("./routes/sales.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

/* ======================
   CORS CONFIG
====================== */
app.use(
  cors({
    origin: [
      "https://sales-frontend-rho.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* ======================
   HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;
