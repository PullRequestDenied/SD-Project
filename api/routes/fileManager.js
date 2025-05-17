const express = require("express");
const multer = require("multer");
const router = express.Router();
const { verifySupabaseJwt } = require('../middlewares/auth-middleware');
const upload = multer({ storage: multer.memoryStorage() });

const {
  fileOperations,
  readFiles,
  uploadFile,
  moveFile,
  moveFolder, 
  copyFile,
  copyFolder,
  deleteItem,
  // deleteFile,
  // deleteFolder,
  createFolder,
  renameFile,
  renameFolder 
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/file-operations",verifySupabaseJwt, fileOperations);
router.post("/upload",verifySupabaseJwt, upload.single("uploadFiles"), uploadFile);
router.post("/delete-item", deleteItem);
router.post("/move-file", moveFile);
router.post("/move-folder", moveFolder);
router.post("/copy-file", copyFile);
router.post("/copy-folder", copyFolder);
// router.post("/delete-folder", deleteFolder);
router.post("/create-folder",verifySupabaseJwt,createFolder);
router.post("/rename-file", renameFile);
router.post("/rename-folder", renameFolder);

module.exports = router;
