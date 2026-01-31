const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
const salesRoutes = require("./routes/sales.routes");

app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", require("./routes/dashboard.routes"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
