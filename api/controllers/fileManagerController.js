const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bucket = process.env.SUPABASE_BUCKET;
const BUCKET_ROOT  = "data"; 
const { VertexAI,TextEmbeddingModel } = require('@google-cloud/vertexai');
// Require the Vertex AI client and helpers
const sdk = require('@google-cloud/aiplatform');      // root import
const { PredictionServiceClient } = sdk.v1;          // the v1 namespace
const { helpers } = sdk;                              // helpers live on the root

// Point at the regional API endpoint
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com'
};
const embedClient = new PredictionServiceClient(clientOptions);


const vertexai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location:  'us-central1'
});
// load the embedding model you want (e.g. Goose or Gecko)

/*Helper functions*/
async function embedTexts(project, location, model, texts) {
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;
  // Use helpers.toValue from the root import!
  const instances = texts.map(t =>
    // NOTE: use SEMANTIC_SIMILARITY instead of TEXT_EMBEDDING
    helpers.toValue({ content: t, task_type: 'SEMANTIC_SIMILARITY' })
  );
  const [response] = await embedClient.predict({ endpoint, instances });
  return response.predictions.map(p =>
    p.structValue
     .fields.embeddings
     .structValue
     .fields.values
     .listValue.values
     .map(v => v.numberValue)
  );
}
async function getFolder(folderId) {
  return supabase
    .from("folders")
    .select("id, name, parent_id")
    .eq("id", folderId)
    .single()
    .then(r => r.data)
}
async function buildFolderPath(folderId) {
  let segments = []
  let current = await getFolder(folderId)
  while (current) {
    segments.unshift(current.name)
    if (!current.parent_id) break
    current = await getFolder(current.parent_id)
  }
  return segments.join("/")          // → "" for root, or "foo/bar"
}
async function getDescendantFolderIds(folderId) {
  // assumes you have an RPC or recursive query
  return supabase
    .rpc("get_folder_descendants", { start_id: folderId })
    .then(r => r.data.map(f => f.id))
}
async function getDescendantFolders(folderId) {
  const { data, error } = await supabase
    .rpc('get_folder_descendants', { start_id: folderId });

  if (error) {
    console.error('Error fetching descendant folders:', error);
    throw error;
  }

  return data; // [{ id, name, parent_id }, …]
}
async function getFilesInFolders(folderIds) {
  return supabase
    .from("files")
    .select("id, path,filename,folder_id,type,size,metadata,created_at,uploaded_by")
    .in("folder_id", folderIds)
    .then(r => r.data)
}
async function updateFolderParent(folderId, newParentId) {
  return supabase
    .from("folders")
    .update({ parent_id: newParentId || null })
    .eq("id", folderId)
}
async function updateFilePath(fileId, newPath) {
  return supabase
    .from("files")
    .update({ path: newPath })
    .eq("id", fileId)
}
async function moveStorageObject(oldPath, newPath) {
  // (a) download
  let { data: blob } = await supabase.storage.from(bucket).download(oldPath)
  let buf = await blob.arrayBuffer()
  // (b) upload to newPath
  await supabase.storage.from(bucket).upload(newPath, Buffer.from(buf), { upsert: true })
  // (c) delete old
  await supabase.storage.from(bucket).remove([oldPath])
}
async function updateFileRecord(fileId, { folder_id, path, filename }) {
  const { error } = await supabase
    .from("files")
    .update({ folder_id, path, filename, created_at: new Date() })
    .eq("id", fileId);
  if (error) throw error;
}
async function copyStorageObject(sourcePath, targetPath) {
  // 1) download
  const { data, error: dlErr } = await supabase
    .storage.from(bucket).download(sourcePath);
  if (dlErr) throw dlErr;

  const buffer = await data.arrayBuffer();

  // 2) upload to the new location
  const { error: upErr } = await supabase
    .storage.from(bucket).upload(targetPath, Buffer.from(buffer), { upsert: true });
  if (upErr) throw upErr;

  // NO delete step!
}
async function createFolderRecord({ name, parent_id, created_by = null }) {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id, created_by })
    .select("id, name, parent_id")
    .single();
  if (error) throw error;
  return data;
}
async function insertFileRecord({ folder_id, path, filename, metadata = {} }) {
  const { error } = await supabase
    .from("files")
    .insert([{ folder_id, path, filename, ...metadata }]);
  if (error) throw error;
}
async function updateFolderName(folderId, name) {
  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", folderId);
  if (error) throw error;
}
async function mapPathToFolderId(pathStr) {
  const clean = (pathStr || '').replace(/^\/+|\/+$/g, '');  
  const segments = clean ? clean.split('/') : [];
  let parentId = null;

  for (const segment of segments) {
    let query = supabase
      .from('folders')
      .select('id')
      .eq('name', segment);

    if (parentId === null) {
      query = query.is('parent_id', null);    // SQL: parent_id IS NULL
    } else {
      query = query.eq('parent_id', parentId); // SQL: parent_id = '<uuid>'
    }

    const { data, error } = await query.single();
    if (error || !data) return null;
    parentId = data.id;
  }

  return parentId;
}
/*Helper functions*/
exports.fileOperations = async (req, res) => {
  
    const { action,name,newName,path,targetPath,data,searchString} = req.body;
    console.log(req.body);
      switch (action) {
    case 'read':
      return await exports.readFiles(req, res);
    case 'delete':
      return await exports.deleteItem(req, res,name,data);
    case 'create':
      return await exports.createFolder(req, res,name);
    case 'rename': 
      return await exports.rename(req, res,newName,data);
    case 'move':
      return await exports.move(req, res,path,targetPath,data);
    case 'copy':
      return await exports.copy(req, res,path,targetPath,data);
    case 'search':
      return await exports.filterFiles(req,res,path,searchString);
    case 'download':
      return await exports.download(req,res,data);
  }
}
exports.readFiles = async (req, res) => {
  try {
    const rawPath = (req.body.path || '').replace(/^\/+|\/+$/g, '');
    const folderId =
      rawPath === ''
      ? null                  
      : await mapPathToFolderId(rawPath);

    // 1) Fetch subfolders
let folderQuery = supabase
  .from('folders')
  .select('id, name,parent_id,created_at,created_by');

if (folderId === null) {
  folderQuery = folderQuery.is('parent_id', null); 
} else {
  folderQuery = folderQuery.eq('parent_id', folderId);
}

const { data: folders, error: fErr } = await folderQuery;


    let fileQuery = supabase
        .from('files')
        .select('id,filename,path,type,size,created_at,metadata,folder_id,uploaded_by');
    if (folderId === null) {
        fileQuery = fileQuery.is('folder_id', null);    
    } else {
        fileQuery = fileQuery.eq('folder_id', folderId);
    }
    const { data: files, error: fiErr } = await fileQuery;
    if (fiErr) throw fiErr;


    const cwdName = rawPath ? rawPath.split('/').pop() : 'root';
    res.json({
      cwd: {
        name: cwdName,
        path: rawPath ? `/${rawPath}` : '/',
        hasChild: (folders.length + files.length) > 0
      },
      files: [

        ...folders.map(f => ({
          folderId: f.id,
          parentId:  f.parent_id,
          createdBy: f.created_by,
          name:       f.name,
          size:       0,
          isFile:     false,
          hasChild:   true,
          type:         'Folder',
          dateCreated: f.created_at, 


        })),
  
        ...files.map(f => ({
          fileId:     f.id,
          filePath:   f.path,
          inFolderId:   f.folder_id,
          createdBy:  f.uploaded_by,
          tags:        f.metadata,
          name:        f.filename,
          size:        f.size,
          isFile:      true,
          dateCreated: f.created_at,
          type:     f.filename.includes('.') 
                    ? f.filename.split('.').pop().toLowerCase() 
                    : 'File', 

        }))
      ],
      error: null
      
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.uploadFile = async (req, res) => {
  try {
    const selectedFolderId = req.get('X-Folder-Id') || null;
    const userId = req.userId;
    const file = req.file;
    const folderId = selectedFolderId || null;
    const uploadedBy = userId || null;
    const metadataRaw = req.get('X-Tags') || "";
    const folderPath = await buildFolderPath(folderId);
    console.log(selectedFolderId);
    console.log(folderPath);
 
    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const fullPath = folderPath
      ? `${BUCKET_ROOT}/${folderPath}/${file.originalname}`
      :  `${BUCKET_ROOT}/${file.originalname}`;

    const { error: storageError } = await supabase
      .storage
      .from(bucket)
      .upload(fullPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (storageError) {
      return res.status(500).json({ error: storageError.message });
    }

    let tagsArray;
    if (metadataRaw.trim()) {
      try {
        tagsArray = JSON.parse(metadataRaw);
        if (!Array.isArray(tagsArray)) {
          throw new Error('Not an array');
        }
      } catch (jsonErr) {
        // Fallback: comma-separated
        tagsArray = metadataRaw
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }
    } else {
      tagsArray = [];
    }
    console.log(tagsArray);

    const { data: [fileRecord], error: dbError } = await supabase
      .from("files")
      .insert({
        filename: file.originalname,
        path: fullPath,
        type: file.mimetype,
        size: file.size,
        metadata: tagsArray,
        folder_id: folderId,
        uploaded_by: uploadedBy,
      })
      .select('id');

    if (dbError || !fileRecord) {
      return res.status(500).json({ error: dbError?.message || 'DB insert failed' });
    }
    const newFileId = fileRecord.id;
    console.log(fileRecord.id);

    const textToEmbed = [file.originalname, ...tagsArray].join(' ');

let embedding;
try {
  console.log('Calling embedTexts…');
  const embeddings = await embedTexts(
    process.env.GOOGLE_CLOUD_PROJECT,
    'us-central1',
    'text-embedding-005',
    [textToEmbed]
  );
  console.log('embedTexts returned:', embeddings);
  // since embedTexts returns an array of vectors
  [embedding] = embeddings;
  console.log('Selected first embedding vector (first 5 dims):', embedding.slice(0,5));
} catch (err) {
  console.error('❌ embedTexts threw an error:', err);
  // fail gracefully or re-throw, depending on your flow
  return res.status(500).json({ error: 'Embedding failed' });
}

// 3) Now log your Supabase update payload
console.log('Updating DB row', newFileId, 'with embedding length', embedding.length);

    // 4) Write embedding back into Supabase
    const { data:updatedRows,error: embedError } = await supabase
      .from('files')
      .update({ embedding })
      .eq('id', newFileId)
      .select();
    console.log('Supabase update:', { embedError, updatedRows });
    if (embedError) console.warn('Embedding write failed:', embedError);
    return res.json({ message: "File uploaded and saved in database." });
  } catch (err) {
    if (res.headersSent) return;
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.deleteItem = async (req, res, deleteName, data) => {
  const item = data[0];
  const fileId = item.fileId || null;
  const folderId = item.folderId || null;

  if (fileId) {
    try {
      const path = item.filePath;
      const { error: storageErr } = await supabase
        .storage
        .from(bucket)
        .remove([path]);
      if (storageErr) {
        return res.status(500).json({ error: storageErr.message });
      }
      const { error: dbErr } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);
      if (dbErr) {
        return res.status(500).json({ error: dbErr.message });
      }
      const now = new Date().toISOString();
      return res.json({
        cwd: null,
        details: null,
        error: null,
        files: [
          {
            dateModified: now,
            filterPath: "/",
            hasChild: false,
            isFile: true,
            name: deleteName,
            size: item.size,
            type: item.type,
          }
        ]
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (folderId) {
    try {
      const descendants = await getDescendantFolderIds(folderId);
      const folderIds = [folderId, ...descendants];
      const files = await getFilesInFolders(folderIds);
      const filePaths = files.map(f => f.path);
      const chunkSize = 1000;
      for (let i = 0; i < filePaths.length; i += chunkSize) {
        const chunk = filePaths.slice(i, i + chunkSize);
        const { error: rmErr } = await supabase
          .storage
          .from(bucket)
          .remove(chunk);
        if (rmErr) throw rmErr;
      }
      const { error: fileDelErr } = await supabase
        .from("files")
        .delete()
        .in("folder_id", folderIds);
      if (fileDelErr) throw fileDelErr;
      const { error: folderDelErr } = await supabase
        .from("folders")
        .delete()
        .in("id", folderIds);
      if (folderDelErr) throw folderDelErr;
      const now = new Date().toISOString();
      return res.json({
        cwd: null,
        details: null,
        error: null,
        files: [
          {
            dateModified: now,
            filterPath: "/",
            hasChild: true,
            isFile: false,
            name: deleteName,
            size: item.size,
            type: item.type,
          }
        ]
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }
  }

  return res.status(400).json({
    error: "Missing parameters: provide either {fileId } to delete a file, or { folderId } to delete a folder."
  });
};
exports.move = async (req, res,path,targetPath,data) => {
  const item = data[0];
  const fileId = item.fileId || null;
  const folderId = item.folderId || null;
  const newPath = await mapPathToFolderId(targetPath);
  if (fileId) {
      try {
    // 1) Load the existing file record to get its current path & name
    const { data: file, error: fetchErr } = await supabase
      .from("files")
      .select("path, filename,size")
      .eq("id", fileId)
      .single();
    if (fetchErr || !file) {
      console.error("Fetch file error:", fetchErr);
      return res.status(404).json({ error: "File not found." });
    }

    const fromPath = file.path;
    const filename = file.filename || fromPath.split("/").pop();

    // 2) Build the new storage path
    //    buildFolderPath(newFolderId) → e.g. "Test/Upload"
    const folderPath = await buildFolderPath(newPath);
    const newPrefix  = `${BUCKET_ROOT}${folderPath ? `/${folderPath}` : ""}`;
    const toPath     = `${newPrefix}/${filename}`;

    // 3) Move the blob in Storage
    await moveStorageObject(fromPath, toPath);

    // 4) Update the DB record with its new folder, path & name
    await updateFileRecord(fileId, {
      folder_id: newPath,
      path:      toPath,
      filename
    });
      const now = new Date().toISOString();
res.json({
  cwd: null,
  files: [{
    name:         filename,
    isFile:       true,
    size:         file.size,
    dateCreated:  now,
    dateModified: now,
    filterPath:   toPath || '/',
    hasChild:     false,
    type:         'File'
  }],
  details: null,
  error:   null
});

  } catch (err) {
    console.error("moveFile error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error." });
  }

  }
  if (folderId) {
    try {
    destinationParentId = newPath

    // STEP 1: load folder & compute prefixes
    const folder = await getFolder(folderId)
    const originalParentPath = folder.parent_id
      ? await buildFolderPath(folder.parent_id)
      : ""
    const newParentPath = destinationParentId
      ? await buildFolderPath(destinationParentId)
      : ""

    const relativeOld = originalParentPath
      ? `${originalParentPath}/${folder.name}`
      : folder.name
    const relativeNew = newParentPath
      ? `${newParentPath}/${folder.name}`
      : folder.name

    const originalPrefix = `${BUCKET_ROOT}/${relativeOld}`
    const newPrefix      = `${BUCKET_ROOT}/${relativeNew}`

    // STEP 2: fetch subtree
    const childFolderIds = await getDescendantFolderIds(folderId)
    const allFolderIds   = [folderId, ...childFolderIds]
    const filesToMove    = await getFilesInFolders(allFolderIds)

    // STEP 3: update parent pointer
    await updateFolderParent(folderId, destinationParentId)

    // STEP 4: move each file in storage & update its DB path
    for (let file of filesToMove) {
      const relPath   = file.path.slice(originalPrefix.length + 1)
      const target    = `${newPrefix}/${relPath}`

      await moveStorageObject(file.path, target)
      await updateFilePath(file.id,        target)
    }
          const now = new Date().toISOString();
res.json({
  cwd: null,
  files: [{
    name:         folder.name,
    isFile:       false,
    size:         0,
    dateCreated:  now,
    dateModified: now,
    filterPath:   targetPath || '/',
    hasChild:     true,
    type:         'Folder'
  }],
  details: null,
  error:   null
});
  } catch (err) {
      console.error("moveFolder error:", err);
      return res
        .status(500)
        .json({ error: err.message || "Internal server error" });
    }
  }
};
exports.createFolder = async (req, res, folderName) => {

  const rawParentId = req.get('X-Folder-Id') || null;
  const parentId = rawParentId && rawParentId !== 'null'
    ? rawParentId
    : null;

  const createdBy = req.userId;


  if (!folderName) {
    return res.status(400).json({ error: "Missing folderPathcor folderName" });
  }
  try {
    const {error: dbError} = await supabase.from("folders").insert({
        name: folderName,
        parent_id:parentId || null,
        created_by:createdBy
    });
    if (dbError) {
        console.error("Database error:", dbError.message);
        return res.status(500).json({ error: dbError.message });
      }

const now = new Date().toISOString();
res.json({
  cwd: null,
  files: [{
    name:         folderName,
    isFile:       false,
    size:         0,
    dateCreated:  now,
    dateModified: now,
    filterPath:   req.body.path || '/',
    hasChild:     false,
    type:         'Directory'
  }],
  details: null,
  error:   null
});
  } catch (err) {
    console.error("Unexpected createFolder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.copy = async(req,res,path,targetPath,data) => {
  const item = data[0];
  const fileId = item.fileId || null;
  const folderId = item.folderId || null;
  const destinationFolderId = await mapPathToFolderId(targetPath);
  const createdBy = req.userId;
  if (fileId) {  try {
    // 1) Fetch existing file record
    const { data: file, error: fetchErr } = await supabase
      .from("files")
      .select("path, filename,type,size,metadata,uploaded_by")
      .eq("id", fileId)
      .single();
    if (fetchErr || !file) {
      console.error("Fetch file error:", fetchErr);
      return res.status(404).json({ error: "File not found." });
    }

    const fromPath = file.path;
    const originalName = file.filename;
    const fileType = file.type;
    const fileSize = file.size;
    const fileMetadata = file.metadata;
    const uploadedBy = file.uploaded_by;
    const filename = originalName;

    // 2) Build the new storage path
    const folderPath = await buildFolderPath(destinationFolderId);
    const prefix     = `${BUCKET_ROOT}${folderPath ? `/${folderPath}` : ""}`;
    const toPath     = `${prefix}/${filename}`;

    // 3) Copy the blob in Storage
    await copyStorageObject(fromPath, toPath);

    // 4) Insert new metadata row
    const { error: insertErr } = await supabase
      .from("files")
      .insert({
        folder_id:  destinationFolderId,
        path:       toPath,
        filename,
        type:       fileType,
        size:       fileSize,
        metadata:   fileMetadata,
        uploaded_by: uploadedBy,
        created_at: new Date()
      });
    if (insertErr) throw insertErr;
      const now = new Date().toISOString();
return res.json({
  cwd: null,
  files: [{
    name:         filename,
    isFile:       true,
    size:         file.size,
    dateCreated:  now,
    dateModified: now,
    filterPath:   toPath || '/',
    hasChild:     false,
    type:         'File'
  }],
  details: null,
  error:   null
});

  } catch (err) {
    console.error("copyFile error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error." });
  }}
  if (folderId) {  try {
    // 1) Load source folder
    const rootFolder = await getFolder(folderId);
    if (!rootFolder) {
      return res.status(404).json({ error: "Source folder not found." });
    }
    destinationParentId = destinationFolderId;

    // 2) Duplicate root in DB
    const newRoot = await createFolderRecord({
      name:       rootFolder.name,
      parent_id:  destinationParentId || null,
      created_by: createdBy   || null
    });

    // 3) Compute storage prefixes
    const originalPath = await buildFolderPath(folderId);
    const newRootPath  = await buildFolderPath(newRoot.id);
    const oldPrefix    = `${BUCKET_ROOT}/${originalPath}`;
    const newPrefix    = `${BUCKET_ROOT}/${newRootPath}`;

    // 4) Fetch & prepare descendant folders
    let descendants = await getDescendantFolders(folderId);
    // exclude the root if your RPC returns it
    descendants = descendants.filter(d => d.id !== folderId);

    // precompute fullPath for sorting
    const descendantsWithPaths = await Promise.all(
      descendants.map(async desc => ({
        ...desc,
        fullPath: await buildFolderPath(desc.id)
      }))
    );
    // sort so parents come before children
    descendantsWithPaths.sort((a, b) =>
      a.fullPath.split("/").length - b.fullPath.split("/").length
    );

    // 5) Duplicate each descendant folder
    const folderMap = { [folderId]: newRoot.id };
    for (const desc of descendantsWithPaths) {
      const parentNewId = folderMap[desc.parent_id];
      if (parentNewId == null) {
        throw new Error(`No mapping for parent ${desc.parent_id}`);
      }
      const created = await createFolderRecord({
        name:       desc.name,
        parent_id:  parentNewId,
        created_by: createdBy   || null
      });
      folderMap[desc.id] = created.id;
    }

    // 6) Copy all files under the old subtree
    const allOldIds = [folderId, ...await getDescendantFolderIds(folderId)];
    const files     = await getFilesInFolders(allOldIds);
    let fileEntry = null;
    for (const file of files) {
      if (!file.path || !file.filename) continue;

      // compute relative path and target key
      const relPath    = file.path.slice(oldPrefix.length + 1);
      const targetPath = `${newPrefix}/${relPath}`;

      // copy blob and insert a new metadata record
    await copyStorageObject(file.path, targetPath);
    const { error: insertErr } = await supabase
      .from("files")
      .insert({
        folder_id:  folderMap[file.folder_id],
        path:       targetPath,
        filename:       file.filename,
        type:       file.type,
        size:       file.size,
        metadata:   file.metadata,
        uploaded_by: createdBy,
        created_at: new Date()
      });
    if (insertErr) throw insertErr;
    const now = new Date().toISOString();
    fileEntry = {
        name:        file.filename,
        isFile:      true,
        size:        file.size,
        dateCreated: now,
        dateModified: now,
        filterPath:  targetPath,
        hasChild:    false,
        type:        'File'
        };
    }
      const now = new Date().toISOString();
return res.json({
  cwd: null,
  files: [{
    name:         rootFolder.name,
    isFile:       false,
    size:         0,
    dateCreated:  now,
    dateModified: now,
    filterPath:   newRootPath || '/',
    hasChild:     true,
    type:         'Folder'
  },fileEntry],
  details: null,
  error:   null
});

  } catch (err) {
    console.error("copyFolder error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error." });
  }}

};

exports.rename = async (req, res,name,data) => {
  const item = data[0];
  const newFileName = name;

  const fileId = item.fileId || null;

  const folderId = item.folderId || null;
  if (fileId){
      try {
    // A) fetch existing record
    const { data: file, error: fetchErr } = await supabase
      .from("files")
      .select("path, folder_id,size")
      .eq("id", fileId)
      .single();
    if (fetchErr || !file) {
      return res.status(404).json({ error: "File not found." });
    }

    // B) compute paths
    const oldPath = file.path;

    const folderPath   = await buildFolderPath(file.folder_id);

    const toPath       = `${BUCKET_ROOT}/${folderPath}/${newFileName}`;

    // C) rename in storage
    await moveStorageObject(oldPath, toPath);

    // D) update DB and return new record
    const { data: updated, error: updErr } = await supabase
      .from("files")
      .update({
        path:       toPath,
        filename:   newFileName,
        created_at: new Date()
      })
      .select('filename, size') 
      .eq("id", fileId)
      .single();
    if (updErr) throw updErr;

      const now = new Date().toISOString();
      return res.json({
        cwd:     null,
        details: null,
        error:   null,
        files: [{
    name:         updated.filename,                // use updated.filename
    isFile:       true,
    hasChild:     false,
    size:         updated.size,                    // and updated.size
    dateModified: now,
    filterPath:   `/${folderPath}`,
    type:         updated.filename.split('.').pop() 
        }]
      });
  } catch (err) {
    console.error("renameFile error:", err);
    return res.status(500).json({ error: err.message || "Internal server error." });
  }
  }
  if (folderId){
      try {
    // STEP 1: load existing folder
    const folder = await getFolder(folderId);

    // STEP 2: build old vs new relative prefixes
    const parentPath = folder.parent_id
      ? await buildFolderPath(folder.parent_id)
      : "";
    const oldRel = parentPath
      ? `${parentPath}/${folder.name}`
      : folder.name;
    const newRel = parentPath
      ? `${parentPath}/${newName}`
      : newFileName;

    const oldPrefix = `${BUCKET_ROOT}/${oldRel}`;
    const newPrefix = `${BUCKET_ROOT}/${newRel}`;

    // STEP 3: fetch all descendant IDs + files
    const descendants  = await getDescendantFolderIds(folderId);
    const allFolderIds = [folderId, ...descendants];
    const files        = await getFilesInFolders(allFolderIds);

    // STEP 4: rename in DB
    await updateFolderName(folderId, newFileName);

    // STEP 5: move each file in Storage and update its DB record
    for (let file of files) {
      const relPath    = file.path.slice(oldPrefix.length + 1);
      const targetPath = `${newPrefix}/${relPath}`;

      await moveStorageObject(file.path,   targetPath);
      await updateFilePath(file.id,         targetPath);
    }

      const now = new Date().toISOString();
      return res.json({
        cwd:     null,
        details: null,
        error:   null,
        files: [{
    name:         newFileName,              
    isFile:       false,
    hasChild:     true,
    size:         0,                   
    dateModified: now,
    filterPath:   `/${newRel}`,
    type:         'Folder'
        }]
      });

  } catch (err) {
    console.error("renameFolder error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error." });
  }

  }

};

exports.download = async (req, res,data) => {
  try {

  const item = data[0];

  const fileId = item.id || null;

    const selectedFileId = fileId;
    if (!selectedFileId) {
      return res.status(400).json({ error: 'Error please try again' });
    }


   
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .select('path,filename')
      .eq('id', String(selectedFileId))
      .single();


    if (dbError || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = fileRecord.path;

    const { data: fileStream, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !fileStream) {
      return res.status(500).json({ error: 'Error downloading file' });
    }
    const arrayBuffer = await fileStream.arrayBuffer();                
    const buffer      = Buffer.from(arrayBuffer);  


    const fileName = fileRecord.filename;




    res.attachment(fileName);

res.send(buffer);
  } catch (err) {
    console.error('Download Controller Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.filterFiles = async (req,res,folderPath,searchString)=> {
  const sqlPattern = searchString.replace(/\*/g, '%');


  const { data: items, error } = await supabase
    .from('files')
    .select('id,filename,path,type,size,created_at,metadata,folder_id,uploaded_by')
    .ilike('filename', sqlPattern)              
    .ilike('path', `data${folderPath}%`);     

  if (error) throw error;

  const result = items.map(f => ({
          fileId:     f.id,
          filePath:   f.path,
          inFolderId:   f.folder_id,
          createdBy:  f.uploaded_by,
          tags:        f.metadata,
          name:        f.filename,
          size:        f.size,
          isFile:      true,
          dateCreated: f.created_at,
          type:     f.filename.includes('.') 
                    ? f.filename.split('.').pop().toLowerCase() 
                    : 'File', 
  }));

  return res.json({ files: result });
};
// controllers/fileManagerController.js
exports.updateMetadata = async (req,res) =>{
    try {
    console.log(req.body);
    const { fileId, metadata } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'Missing fileId' });
    }

    // 2. Update the `metadata` column in your `files` table
    const { data, error } = await supabase
      .from('files')
      .update({ metadata })         // set the new metadata (string)
      .eq('id', fileId)
      .select();            // where id = fileId

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    // 3. Respond with success
    return res.status(200).json({ ok: true, updated: data[0] });
  } catch (err) {
    console.error('updateMetadata error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


