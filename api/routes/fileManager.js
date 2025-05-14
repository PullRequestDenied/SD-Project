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
  createFolder 
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/upload", upload.single("uploadFiles"), uploadFile);
router.post("/delete", deleteFile);
router.post("/move", moveItem);
router.post("/copy", copyItem);
router.post("/delete-folder", deleteFolder);
router.post("/create-folder", createFolder);


module.exports = router;
