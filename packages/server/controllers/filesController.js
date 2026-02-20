const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIME_ALLOWLIST = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const getFileExtension = (filename = "") => {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) {
    return "";
  }
  return filename.slice(lastDot).toLowerCase();
};

const isValidUpload = ({ name, mime, size }) => {
  if (!name || !mime || typeof size !== "number") {
    return "Missing required upload fields.";
  }
  if (!MIME_ALLOWLIST.includes(mime)) {
    return "Unsupported file type.";
  }
  if (size <= 0 || size > MAX_FILE_SIZE_BYTES) {
    return "File too large. Max size is 10MB.";
  }
  return null;
};

module.exports.createPresignedUpload = async (req, res) => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!req.session.user) {
    res.status(401).json({ error: "Not authorized" });
    return;
  }
  if (!region || !bucket) {
    res.status(500).json({ error: "Missing AWS configuration" });
    return;
  }

  const { name, mime, size } = req.body;
  const numericSize = Number(size);
  const validationError = isValidUpload({ name, mime, size: numericSize });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const fileExtension = getFileExtension(name);
  const key = `uploads/${req.session.user.userid}/${uuidv4()}${fileExtension}`;

  try {
    const s3Client = new S3Client({ region });
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mime,
      ContentLength: numericSize,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const openUrl = new URL(`${req.baseUrl}/open`, `${req.protocol}://${req.get("host")}`);
    openUrl.searchParams.set("key", key);
    res.json({
      uploadUrl,
      openUrl: openUrl.toString(),
      key,
      mime,
      name,
      size: numericSize,
    });
  } catch (error) {
    console.error("Failed to create presigned URL", error);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
};

module.exports.openFile = async (req, res) => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!req.session.user) {
    res.status(401).send("Not authorized");
    return;
  }
  if (!region || !bucket) {
    res.status(500).send("Missing AWS configuration");
    return;
  }

  const key = typeof req.query.key === "string" ? req.query.key : "";
  const userPrefix = `uploads/${req.session.user.userid}/`;
  if (!key || !key.startsWith(userPrefix) || key.includes("..")) {
    res.status(400).send("Invalid key");
    return;
  }

  try {
    const s3Client = new S3Client({ region });
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    res.redirect(signedUrl);
  } catch (error) {
    console.error("Failed to open file", error);
    res.status(500).send("Failed to open file");
  }
};
