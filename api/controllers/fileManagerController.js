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
exports.deleteFile = async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: "Missing 'path' in request body." });
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Delete error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "File deleted successfully." });
  } catch (err) {
    console.error("Unexpected delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.moveItem = async (req, res) => {
  const { fromPath, toPath } = req.body;

  if (!fromPath || !toPath) {
    return res.status(400).json({ error: "Missing fromPath or toPath." });
  }

  try {
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(fromPath);

    if (downloadError) {
      console.error("Download error during move:", downloadError.message);
      return res.status(500).json({ error: downloadError.message });
    }

    const buffer = await fileData.arrayBuffer();

    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(toPath, Buffer.from(buffer), { upsert: true });

    if (uploadError) {
      console.error("Upload error during move:", uploadError.message);
      return res.status(500).json({ error: uploadError.message });
    }

    const { error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove([fromPath]);

    if (deleteError) {
      console.error("Delete error during move:", deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ message: `Moved from ${fromPath} to ${toPath}` });
  } catch (err) {
    console.error("Unexpected move error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.copyItem = async (req, res) => {
  const { fromPath, toPath } = req.body;

  if (!fromPath || !toPath) {
    return res.status(400).json({ error: "Missing fromPath or toPath." });
  }

  try {
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(fromPath);

    if (downloadError) {
      console.error("Download error during copy:", downloadError.message);
      return res.status(500).json({ error: downloadError.message });
    }

    const buffer = await fileData.arrayBuffer();

    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(toPath, Buffer.from(buffer), { upsert: true });

    if (uploadError) {
      console.error("Upload error during copy:", uploadError.message);
      return res.status(500).json({ error: uploadError.message });
    }

    res.json({ message: `Copied from ${fromPath} to ${toPath}` });
  } catch (err) {
    console.error("Unexpected copy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.deleteFolder = async (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: "Missing folderPath." });
  }

  try {
    // Step 1: List all files under the folder
    const { data, error: listError } = await supabase
      .storage
      .from(bucket)
      .list(folderPath, { limit: 1000, offset: 0, search: "" });

    if (listError) {
      console.error("List error:", listError.message);
      return res.status(500).json({ error: listError.message });
    }

    const filePaths = data.map(f => `${folderPath}/${f.name}`);

    if (filePaths.length === 0) {
      return res.status(404).json({ error: "No files found in folder." });
    }

    // Step 2: Delete all those files
    const { error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove(filePaths);

    if (deleteError) {
      console.error("Delete error:", deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ message: `Deleted folder '${folderPath}' and its contents.` });
  } catch (err) {
    console.error("Unexpected deleteFolder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.createFolder = async (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: "Missing folderPath." });
  }

  const folderKey = `${folderPath}/.keep`;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(folderKey, Buffer.from("placeholder"), {
        contentType: "text/plain",
        upsert: false
      });

    if (error) {
      console.error("Create folder error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: `Folder '${folderPath}' created.` });
  } catch (err) {
    console.error("Unexpected createFolder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.renameItem = async (req, res) => {
  const { fromPath, toPath } = req.body;

  if (!fromPath || !toPath) {
    return res.status(400).json({ error: "Missing fromPath or toPath." });
  }

  try {
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(fromPath);

    if (downloadError || !fileData) {
      console.error("Rename download error:", downloadError);
      return res.status(500).json({ error: "Download failed." });
    }

    const buffer = await fileData.arrayBuffer();

    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(toPath, Buffer.from(buffer), {
        upsert: true
      });

    if (uploadError) {
      console.error("Rename upload error:", uploadError.message);
      return res.status(500).json({ error: uploadError.message });
    }

    const { error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove([fromPath]);

    if (deleteError) {
      console.error("Rename delete error:", deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }

    res.json({ message: `Renamed '${fromPath}' → '${toPath}'` });
  } catch (err) {
    console.error("Unexpected rename error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.renameFolder = async (req, res) => {
  const { fromFolder, toFolder } = req.body;

  if (!fromFolder || !toFolder) {
    return res.status(400).json({ error: "Missing fromFolder or toFolder." });
  }

  try {
    // Step 1: List all files in the old folder
    const { data, error: listError } = await supabase
      .storage
      .from(bucket)
      .list(fromFolder, { limit: 1000 });

    if (listError) {
      console.error("List error:", listError.message);
      return res.status(500).json({ error: listError.message });
    }

    if (!data.length) {
      return res.status(404).json({ error: "Folder is empty or doesn't exist." });
    }

    const failed = [];

    for (const file of data) {
      const fromPath = `${fromFolder}/${file.name}`;
      const toPath = `${toFolder}/${file.name}`;

      // Download original
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from(bucket)
        .download(fromPath);

      if (downloadError || !fileData) {
        console.error(`Failed to download ${fromPath}`, downloadError);
        failed.push(file.name);
        continue;
      }

      const buffer = await fileData.arrayBuffer();

      // Upload to new location
      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(toPath, Buffer.from(buffer), {
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload to ${toPath}`, uploadError);
        failed.push(file.name);
        continue;
      }

      // Delete old file
      const { error: deleteError } = await supabase
        .storage
        .from(bucket)
        .remove([fromPath]);

      if (deleteError) {
        console.error(`Failed to delete ${fromPath}`, deleteError);
        failed.push(file.name);
      }
    }

    if (failed.length > 0) {
      return res.status(207).json({ message: "Some files failed to rename", failed });
    }

    res.json({ message: `Renamed folder '${fromFolder}' to '${toFolder}'` });
  } catch (err) {
    console.error("Unexpected renameFolder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
