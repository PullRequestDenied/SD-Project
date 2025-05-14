const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bucket = process.env.SUPABASE_BUCKET;

exports.readFiles = async (req, res) => {
  const { path = "" } = req.body;
  const { data, error } = await supabase.storage.from(bucket).list(path);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ files: data });
};

exports.uploadFile = async (req, res) => {
  const file = req.file;
  const fullPath = req.body.path ? `${req.body.path}/${file.originalname}` : file.originalname;

  const { error } = await supabase.storage.from(bucket).upload(fullPath, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Upload successful" });
};
