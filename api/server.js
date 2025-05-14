// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const fileManagerRoutes = require("./routes/fileManager");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/filemanager", fileManagerRoutes);

// Default error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
