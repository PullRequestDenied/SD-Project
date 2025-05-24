const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require("../middlewares/auth-middleware");
const {
  askQuestion,
  searchFiles,
  getSuggestions,
  summarizeText,
  download,
} = require("../controllers/searchController.js");

// Full-text search with optional filters & pagination
router.get("/", searchFiles);
router.post("/ask-question",askQuestion);
// Autocomplete suggestions for filenames or tags
router.get("/suggestions", getSuggestions);
router.post("/download", download);

// Summarization via Gemini (Vertex AI)
router.post("/summarize", summarizeText);

module.exports = router;
