const express = require("express");
const { createPresignedUpload, openFile } = require("../controllers/filesController");
const { dailyUploadLimiter } = require("../controllers/rateLimiter");

const router = express.Router();

router.post("/presign", dailyUploadLimiter({ limit: 3 }), createPresignedUpload);
router.get("/open", openFile);

module.exports = router;
