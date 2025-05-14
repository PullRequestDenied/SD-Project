const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const {
  readFiles,
  uploadFile,
  deleteFile 
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/upload", upload.single("uploadFiles"), uploadFile);
router.post("/delete", deleteFile);


module.exports = router;
