const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middlewares/auth-middleware");
const {
  searchFiles,
  getSuggestions,
  summarizeText,
} = require("../controllers/searchController");

// Full-text search with optional filters & pagination
router.get("/", searchFiles);

// Autocomplete suggestions for filenames or tags
router.get("/suggestions", getSuggestions);

// Summarization via Gemini (Vertex AI)
router.post("/summarize", summarizeText);

module.exports = router;
