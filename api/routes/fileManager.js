const express = require("express");
const multer = require("multer");
const router = express.Router();
const { verifySupabaseJwt } = require('../middlewares/auth-middleware');
const upload = multer({ storage: multer.memoryStorage() });

const {
  fileOperations,
  readFiles,
  uploadFile,
  deleteItem,
  createFolder,
  download,
  updateMetadata,
} = require("../controllers/fileManagerController");

router.post("/", readFiles);
router.post("/file-operations",verifySupabaseJwt, fileOperations);
router.post("/upload",verifySupabaseJwt, upload.single("uploadFiles"), uploadFile);
router.post("/delete-item", deleteItem);
router.post("/download",download)
router.put("/update-metadata",updateMetadata)
// router.post("/copy-file", copyFile);
// router.post("/copy-folder", copyFolder);
// router.post("/delete-folder", deleteFolder);
router.post("/create-folder",verifySupabaseJwt,createFolder);

module.exports = router;
