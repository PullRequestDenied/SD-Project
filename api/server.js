// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");


const fileManagerRoutes = require("./routes/fileManager");
const searchRoutes = require("./routes/searchRoutes");
const app = express();
const corsOptions = {
  origin: '*',  // allow all origins :contentReference[oaicite:1]{index=1}
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],  // common methods :contentReference[oaicite:2]{index=2}
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Folder-Id',
    'X-File-Id',
    'X-Tags'
  ]  // include your custom headers :contentReference[oaicite:3]{index=3}
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json());

app.use("/api/filemanager", fileManagerRoutes);
app.use("/api/search", searchRoutes);
// Default error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;