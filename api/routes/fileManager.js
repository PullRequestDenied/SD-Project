const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const {
  readFiles,
  uploadFile,
  moveFile,
  moveFolder, 
  copyFile,
  copyFolder,
  deleteFile,
  deleteFolder,
  createFolder,
  renameFile,
  renameFolder 
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/upload", upload.single("uploadFiles"), uploadFile);
router.post("/delete", deleteFile);
router.post("/move-file", moveFile);
router.post("/move-folder", moveFolder);
router.post("/copy-file", copyFile);
router.post("/copy-folder", copyFolder);
router.post("/delete-folder", deleteFolder);
router.post("/create-folder", createFolder);
router.post("/rename-file", renameFile);
router.post("/rename-folder", renameFolder);

module.exports = router;
