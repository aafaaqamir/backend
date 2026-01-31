const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const salesRoutes = require("./routes/sales.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

/* ======================
   CORS CONFIG (IMPORTANT)
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
   HEALTH CHECK (RENDER)
====================== */
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
