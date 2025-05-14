const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bucket = process.env.SUPABASE_BUCKET;

async function listAllFilesRecursively(folderPath) {
  let files = [];
  const stack = [folderPath];

  while (stack.length) {
    const currentPath = stack.pop();
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(currentPath, { limit: 1000 });

    if (error) {
      throw new Error(`Error listing ${currentPath}: ${error.message}`);
    }

    for (const item of data) {
      if (item.name.endsWith("/")) {
        // In theory, subfolders would end with "/", but Supabase returns folders as items with `item.metadata` null
        stack.push(`${currentPath}/${item.name}`);
      } else if (!item.metadata) {
        // This is a folder
        stack.push(`${currentPath}/${item.name}`);
      } else {
        files.push(`${currentPath}/${item.name}`);
      }
    }
  }

  return files;
}

exports.readFiles = async (req, res) => {
  const { path = "" } = req.body;
  const { data, error } = await supabase.storage.from(bucket).list(path);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ files: data });
};

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const folderPath = req.body.path || "";
    const folderId = req.body.folderId || null; // optional
    const uploadedBy = req.body.uploadedBy || null; // optional
    const metadataRaw = req.body.metadata || ""; // optional

    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const fullPath = folderPath ? `${folderPath}/${file.originalname}` : file.originalname;
  const { error:storageError } = await supabase.storage.from(bucket).upload(fullPath, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });

  if (storageError){
    console.error("Upload error:", storageError.message);
    return res.status(500).json({ error: storageError.message });
  } 

  res.json({ message: "Upload successful" });
    let parsedMetadata = {};
    if (metadataRaw.trim()) {
      parsedMetadata = metadataRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
        const { error: dbError } = await supabase.from("files").insert({
      filename: file.originalname,
      path: fullPath,
      type: file.mimetype,
      size: file.size,
      metadata: parsedMetadata,
      folder_id: folderId,
      uploaded_by: uploadedBy
    });
        if (dbError) {
      console.error("DB insert error:", dbError.message);
      return res.status(500).json({ error: dbError.message });
    }
        res.json({ message: "File uploaded and saved in database." });
  } catch (err) {
    console.error("Unexpected upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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
  const {folderId} = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: "Missing folderPath." });
  }

  try {
    const filePaths = await listAllFilesRecursively(folderPath);
    console.log(filePaths);
    if (filePaths.length === 0) {
      return res.status(404).json({ error: "No files found in folder." });
    }
    const { error: deleteError } = await supabase
      .storage
      .from(bucket)
      .remove(filePaths);

    if (deleteError) {
      console.error("Delete error:", deleteError.message);
      return res.status(500).json({ error: deleteError.message });
    }
    
    if (!folderId) {
      console.warn("No folderId provided — skipping database cleanup.");
    } else {
      // 1. Fetch all folders
      const { data: allFolders, error: folderListError } = await supabase
        .from("folders")
        .select("*");

      if (folderListError) {
        console.error("Failed to fetch folders for DB cleanup:", folderListError.message);
        return res.status(500).json({ error: folderListError.message });
      }

      // 2. Recursively collect all descendant folder IDs
      const getDescendantIds = (id) => {
        const children = allFolders.filter(f => f.parent_id === id);
        return children.flatMap(child => [child.id, ...getDescendantIds(child.id)]);
      };

      const folderIdsToDelete = [folderId, ...getDescendantIds(folderId)];

      // 3. Delete files from DB
      const { error: fileDeleteError } = await supabase
        .from("files")
        .delete()
        .in("folder_id", folderIdsToDelete);

      if (fileDeleteError) {
        console.error("File DB delete error:", fileDeleteError.message);
        return res.status(500).json({ error: fileDeleteError.message });
      }

      // 4. Delete folders from DB
      const { error: folderDeleteError } = await supabase
        .from("folders")
        .delete()
        .in("id", folderIdsToDelete);

      if (folderDeleteError) {
        console.error("Folder DB delete error:", folderDeleteError.message);
        return res.status(500).json({ error: folderDeleteError.message });
      }
    }

    res.json({ message: `Deleted folder '${folderPath}' and its contents.` });
  } catch (err) {
    console.error("Unexpected deleteFolder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.createFolder = async (req, res) => {
  const { folderPath,folderName,parentId,createdBy } = req.body;

  if (!folderPath || !folderName) {
    return res.status(400).json({ error: "Missing folderPathcor folderName" });
  }

  const keepFilePath = `${folderPath}/.keep`;

  try {
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(keepFilePath, Buffer.from("placeholder"), {
        contentType: "text/plain",
        upsert: false
      });

    if (storageError) {
      console.error("Create folder error:", storageError.message);
      return res.status(500).json({ error: storageError.message });
    }
    const {error: dbError} = await supabase.from("folders").insert({
        name: folderName,
        parent_id:parentId || null,
        created_by:createdBy || null,
    });
    if (dbError) {
        console.error("Database error:", dbError.message);
        return res.status(500).json({ error: dbError.message });
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
