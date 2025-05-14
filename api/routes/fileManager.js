const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const {
  readFiles,
  uploadFile,
  deleteFile,
  moveItem, 
  copyItem,
  deleteFolder,
  createFolder,
  renameItem 
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/upload", upload.single("uploadFiles"), uploadFile);
router.post("/delete", deleteFile);
router.post("/move", moveItem);
router.post("/copy", copyItem);
router.post("/delete-folder", deleteFolder);
router.post("/create-folder", createFolder);
router.post("/rename", renameItem);

module.exports = router;
