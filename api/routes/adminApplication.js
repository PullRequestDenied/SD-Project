const express = require("express");
const router = express.Router();
const { verifySupabaseJwt } = require('../middlewares/auth-middleware');

const {
  getAuthUsers,
  getRoleUsers,
  removeAdmin,
  addAdmin,
  rejectUser,
  checkApplication,
  submitApplication
} = require("../controllers/adminApplicationController");

router.get("/getAuth", getAuthUsers);
router.get("/getRoles", getRoleUsers);
router.get("/application",verifySupabaseJwt, checkApplication);

router.post("/remove-admin",verifySupabaseJwt, removeAdmin);
router.post("/add-admin",verifySupabaseJwt, addAdmin);
router.post("/submit-application",verifySupabaseJwt, submitApplication);

router.put("/reject-user",verifySupabaseJwt, rejectUser);

module.exports = router;