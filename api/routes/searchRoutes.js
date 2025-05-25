const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middlewares/auth-middleware");
const {
  askQuestion,
  summarizeText,
  download,
} = require("../controllers/searchController.js");

// Full-text search with optional filters & pagination

router.post("/ask-question",askQuestion);
router.post("/download", download);

router.post("/summarize", summarizeText);

module.exports = router;
