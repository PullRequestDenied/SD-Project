import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

/*NOTE a breadcumb is something like this: root > parent > child





*/
//helper function to build the folder path i.e root/parent/child
const buildFullPathFromFolderId = (folderId, folders) => {
  let path = [];
  let current = folders.find(f => f.id === folderId);
  while (current) {
    path.unshift(current.name);
    current = folders.find(f => f.id === current.parent_id);
  }
  return path.join("/");
};

function FileManager() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  //variables used to fetch folders files mnage breadcrumb etc
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [copyTargetFolderId, setCopyTargetFolderId] = useState(null);
  const [fileMetadata, setFileMetadata] = useState("");

  //when the page loads or the current folder changes, fetch the folders and files from the database
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("id, name, parent_id")


      if (folderError) {
        console.error("Folder fetch error:", folderError.message);
      } else {
        setFolders(folderData);
      }

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("id, filename, folder_id")

      if (fileError) {
        console.error("File fetch error:", fileError.message);
      } else {
        //filter out .keep files because superbase doesn't allow creation of empty folders
        setFiles(fileData.filter(f => !f.filename.endsWith(".keep")));
      }
    };

    fetchData();
  }, [session, currentFolderId]);

  const buildFullPath = () => {
    return buildFullPathFromFolderId(currentFolderId, folders);
  };
  //when a user clicks a folder,it sets it as the current folder and builds the path
  const handleFolderClick = (folderId) => {
    const newTrail = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
      newTrail.unshift(current);
      current = folders.find(f => f.id === current.parent_id);
    }
    setBreadcrumbTrail(newTrail);
    setCurrentFolderId(folderId);
    setParentId(folderId);
  };
  //allows a user to navigate back in the breadcumb trail
  const handleBreadcrumbClick = (index) => {
    const newTrail = breadcrumbTrail.slice(0, index + 1);
    const lastFolder = newTrail[newTrail.length - 1];
    setCurrentFolderId(lastFolder?.id || null);
    setParentId(lastFolder?.id || null);
    setBreadcrumbTrail(newTrail);
  };
  //as it says,for folder creation
  const handleCreateFolder = async () => {
    if (!folderName || !userId) {
      setMessage("❌ Please enter a folder name.");
      return;
    }
    //builds path and adds .keep so the folder is created in archive
    const fullPath = buildFullPath();
    const folderPath = fullPath ? `${fullPath}/${folderName}` : `${folderName}`;
    //insert folder details into database
    const { error: dbError } = await supabase.from("folders").insert({
      name: folderName,
      created_by: userId,
      parent_id: parentId || null,
    });

    if (dbError) {
      console.error("DB error:", dbError.message);
      setMessage("❌ Failed to create folder in database.");
      return;
    }

    setFolderName("");
    setMessage(`✅ Folder '${folderName}' created!`);
  };
  //time for uploading files
  const handleUpload = async () => {
    if (!file || !userId) {
      setMessage("❌ Please select a file to upload.");
      return;
    }
    //getting path and uploading to archive
    const fullPath = buildFullPath();
    const filePath = fullPath ? `${fullPath}/${file.name}` : `${file.name}`;
    const storagePath = `data/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("archive")
      .upload(storagePath, file,{ upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      setMessage(`❌ Upload failed: ${uploadError.message}`);
      return;
    }
    let parsedMetadata = {};
try {
  parsedMetadata = fileMetadata ? JSON.parse(fileMetadata) : {};
} catch (err) {
  setMessage("❌ Metadata must be valid JSON.");
  return;
}


    //insert file details into datbase
    const { error: dbError } = await supabase.from("files").insert({
      filename: file.name,
      path: filePath,
      type: file.type,
      size: file.size,
      metadata: parsedMetadata,
      uploaded_by: userId,
      folder_id: currentFolderId || null,
    });

    if (dbError) {
      console.error("DB error:", dbError.message);
      setMessage("❌ Failed to save file in DB.");
      return;
    }

    setFile(null);
    setFileMetadata("");

    setMessage("✅ File uploaded successfully!");
  };
  const handleDelete = async (folderId = null, fileId = null, filename = null) => {
    if (fileId && filename) {
      // 🔹 Deleting a single file
      const storagePath = `data/${filename}`;
  
      const { error: storageError } = await supabase.storage
        .from("archive")
        .remove([storagePath]);
  
      if (storageError && storageError.message !== "Object not found") {
        console.error("Storage deletion error:", storageError.message);
        setMessage(`❌ Failed to delete file from storage: ${storageError.message}`);
        return;
      }
  
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);
  
      if (dbError) {
        console.error("DB deletion error:", dbError.message);
        setMessage("❌ Failed to delete file from database.");
        return;
      }
  
      setMessage("✅ File deleted successfully!");
    }
  
    if (folderId) {
      // 🔹 Deleting a folder and all its contents
      // 1. Get all subfolders recursively
      const allFolders = await supabase.from("folders").select("*");
      const getSubfolderIds = (id) => {
        const children = allFolders.data.filter(f => f.parent_id === id);
        return children.reduce(
          (acc, f) => [...acc, f.id, ...getSubfolderIds(f.id)],
          []
        );
      };
  
      const folderIdsToDelete = [folderId, ...getSubfolderIds(folderId)];
  
      // 2. Get all files in those folders
      const { data: filesToDelete, error: fileQueryError } = await supabase
        .from("files")
        .select("*")
        .in("folder_id", folderIdsToDelete);
  
      if (fileQueryError) {
        console.error("Failed to fetch files for deletion:", fileQueryError.message);
        setMessage("❌ Could not fetch files to delete.");
        return;
      }
  
      // 3. Delete files from storage
      const storagePaths = filesToDelete.map((f) => `data/${f.filename}`);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("archive")
          .remove(storagePaths);
  
        if (storageError) {
          console.error("Storage bulk delete error:", storageError.message);
          setMessage("❌ Failed to delete files from storage.");
          return;
        }
      }
  
      // 4. Delete file records
      await supabase.from("files").delete().in("id", filesToDelete.map(f => f.id));
  
      // 5. Delete folder records
      await supabase.from("folders").delete().in("id", folderIdsToDelete);
  
      setMessage("✅ Folder and all its contents deleted!");
    }
  };
  
  //Used to render folders,sorry frontend people if its confusing,I put it here because the return was looking too long(it is still long :( )
  const renderFolderTree = (parentId = null, depth = 0) => {
    return folders
      .filter(f => f.parent_id === parentId)
      .map(folder => (
        <div
          key={folder.id}
          className="border-l-2 border-gray-600 pl-3 ml-1 mb-2"
          style={{ marginLeft: depth * 10 }}
        >
          <div className="flex justify-between items-center cursor-pointer">
            <div
              className="text-blue-400 hover:underline font-medium"
              onClick={() => handleFolderClick(folder.id)}
            >
              📁 {folder.name}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleDelete(folder.id)}
                className="text-red-400 hover:text-red-300 text-sm ml-2"
                title="Delete folder and its contents"
              >
                🗑️
              </button>
              <button
                onClick={() => handleCopy({ folderId: folder.id, destinationFolderId: copyTargetFolderId })}
                className="text-green-400 hover:text-green-300 text-sm ml-2"
                title="Copy folder to selected folder"
              >
                📁 Copy
              </button>
              <button
                onClick={() => handleMove({ folderId: folder.id, destinationFolderId: copyTargetFolderId })}
                className="text-yellow-400 hover:text-yellow-300 text-sm ml-2"
                title="Move folder to selected folder"
              >
                🚚 Move
              </button>
            </div>
          </div>
  
          <div className="ml-4">
            {files
              .filter(file => file.folder_id === folder.id)
              .map(file => (
                <div key={file.id} className="flex justify-between items-center text-gray-300 ml-2">
                  📄 {file.filename}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleDelete(null, file.id, file.filename)}
                      className="text-red-400 hover:text-red-300 text-sm ml-2"
                      title="Delete file"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => handleCopy({ file, destinationFolderId: copyTargetFolderId })}
                      className="text-green-400 hover:text-green-300 text-sm ml-2"
                      title="Copy file to selected folder"
                    >
                      📄 Copy
                    </button>
                    <button
                      onClick={() => handleMove({ file, destinationFolderId: copyTargetFolderId })}
                      className="text-yellow-400 hover:text-yellow-300 text-sm ml-2"
                      title="Move file to selected folder"
                    >
                      🚚 Move
                    </button>
                  </div>
                </div>
              ))}
          </div>
  
          {renderFolderTree(folder.id, depth + 1)}
        </div>
      ));
  };
  
  const handleCopy = async ({ file = null, folderId = null, destinationFolderId }) => {
    if (!destinationFolderId) {
      setMessage("❌ Destination folder is required.");
      return;
    }
  
    try {
      if (file) {
        // ✅ Copy a single file
        const { error } = await supabase.from("files").insert({
          filename: file.filename,
          path: file.path, // keep virtual path if needed
          type: file.type,
          size: file.size,
          metadata: file.metadata || {},
          uploaded_by: file.uploaded_by,
          folder_id: destinationFolderId,
        });
  
        if (error) {
          console.error("File copy error:", error.message);
          setMessage("❌ Failed to copy file.");
          return;
        }
  
        setMessage(`✅ File '${file.filename}' copied successfully!`);
        return;
      }
  
      if (folderId) {
        // ✅ Copy a folder and all contents
        const { data: allFolders } = await supabase.from("folders").select("*");
        const { data: allFiles } = await supabase.from("files").select("*");
  
        const folderMap = {}; // oldFolderId → newFolderId
  
        // Find the folder to copy and its children
        const getDescendants = (parentId) => {
          const children = allFolders.filter(f => f.parent_id === parentId);
          return children.flatMap(child => [child, ...getDescendants(child.id)]);
        };
  
        const sourceFolder = allFolders.find(f => f.id === folderId);
        if (!sourceFolder) {
          setMessage("❌ Source folder not found.");
          return;
        }
  
        const descendantFolders = [sourceFolder, ...getDescendants(folderId)];
  
        // Copy each folder and track new IDs
        for (const folder of descendantFolders) {
          const newFolder = {
            name: folder.name,
            created_by: folder.created_by,
            parent_id:
            folder.id === folderId
            ? destinationFolderId
            : folderMap[folder.parent_id],
          };
  
          const { data: insertedFolder, error } = await supabase
            .from("folders")
            .insert(newFolder)
            .select()
            .single();
  
          if (error) {
            console.error("Folder copy error:", error.message);
            setMessage("❌ Failed to copy folder.");
            return;
          }
  
          folderMap[folder.id] = insertedFolder.id;
        }
  
        // Copy files into the new folder structure
        const filesToCopy = allFiles.filter(f => folderMap[f.folder_id]);
        for (const file of filesToCopy) {
          const { error: insertError } = await supabase.from("files").insert({
            filename: file.filename,
            path: file.path,
            type: file.type,
            size: file.size,
            metadata: file.metadata || {},
            uploaded_by: file.uploaded_by,
            folder_id: folderMap[file.folder_id],
          });
  
          if (insertError) {
            console.error("File copy error:", insertError.message);
            setMessage("❌ Failed to copy a file.");
            return;
          }
        }
  
        setMessage("✅ Folder and all contents copied successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("❌ Unexpected error occurred during copy.");
    }
  };
  const handleMove = async ({ file = null, folderId = null, destinationFolderId }) => {
    if (!destinationFolderId) {
      setMessage("❌ Destination folder is required.");
      return;
    }
  
    try {
      if (file) {
        // ✅ Move a single file by updating folder_id
        const { error } = await supabase
          .from("files")
          .update({ folder_id: destinationFolderId })
          .eq("id", file.id);
  
        if (error) {
          console.error("File move error:", error.message);
          setMessage("❌ Failed to move file.");
          return;
        }
  
        setMessage(`✅ File '${file.filename}' moved successfully!`);
        return;
      }
  
      if (folderId) {
        // ✅ Move a folder and its entire hierarchy
        const { data: allFolders } = await supabase.from("folders").select("*");
  
        const folderMap = {}; // oldFolderId → newFolderId
  
        // Step 1: Get all descendant folders
        const getDescendants = (parentId) => {
          const children = allFolders.filter(f => f.parent_id === parentId);
          return children.flatMap(child => [child, ...getDescendants(child.id)]);
        };
  
        const sourceFolder = allFolders.find(f => f.id === folderId);
        if (!sourceFolder) {
          setMessage("❌ Source folder not found.");
          return;
        }
  
        const descendantFolders = [sourceFolder, ...getDescendants(folderId)];
  
        // Step 2: Move folders — update each folder’s parent_id
        for (const folder of descendantFolders) {
          const newParentId =
            folder.id === folderId
              ? destinationFolderId
              : folderMap[folder.parent_id];
  
          const { data, error } = await supabase
            .from("folders")
            .update({ parent_id: newParentId })
            .eq("id", folder.id)
            .select()
            .single();
  
          if (error) {
            console.error("Folder move error:", error.message);
            setMessage("❌ Failed to move folder.");
            return;
          }
  
          folderMap[folder.id] = data.id;
        }
  
        setMessage("✅ Folder and contents moved successfully!");
      }
    } catch (err) {
      console.error("Unexpected move error:", err);
      setMessage("❌ Unexpected error during move.");
    }
  };
    
//normal stuff without semantic tags,sorry,there is some flex so somewhat confusing
//its not perfect yet,to go back to root you have to click the breadcrumb trail.
  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-800 shadow-lg rounded-lg text-white space-y-6">
      <h2 className="text-3xl font-bold border-b border-gray-700 pb-2 mb-4">📁 File Manager</h2>

      <div className="text-sm text-blue-400 space-x-1 flex flex-wrap items-center">
        <span
          className="cursor-pointer hover:underline"
          onClick={() => {
            setCurrentFolderId(null);
            setBreadcrumbTrail([]);
            setParentId(null);
          }}
        >
          Root
        </span>
        {breadcrumbTrail.map((folder, index) => (
          <span key={folder.id}>
            {' > '}
            <span
              className="cursor-pointer hover:underline"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {folder.name}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
  <label className="text-white">Destination Folder:</label>
  <select
    value={copyTargetFolderId || ""}
    onChange={(e) => setCopyTargetFolderId(e.target.value || null)}
    className="bg-gray-700 text-white p-2 rounded border border-gray-600"
  >
    <option value="">-- Select Folder --</option>
    {folders.map((folder) => (
      <option key={folder.id} value={folder.id}>
        {folder.name}
      </option>
    ))}
  </select>
</div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="p-2 border border-gray-600 bg-gray-700 text-white rounded w-full"
        />
        <button
          onClick={handleCreateFolder}
          className="bg-blue-700 hover:bg-blue-600 px-4 py-2 text-white rounded shadow"
        >
          ➕ Create Folder
        </button>
      </div>

      <div className="bg-gray-700 p-4 rounded border border-gray-600">
        {renderFolderTree()}
      </div>
      <div className="w-full">
  <label htmlFor="metadata" className="text-white block mb-1">
    Optional Metadata (JSON format):
  </label>
  <textarea
    id="metadata"
    value={fileMetadata}
    onChange={(e) => setFileMetadata(e.target.value)}
    className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-2"
    placeholder='e.g. {"category": "invoice", "owner": "admin"}'
    rows={3}
  />
</div>
      <div className="flex items-center gap-3">
        <input
          data-testid="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-white file-input file-input-bordered bg-gray-700 border-gray-600"
        />
        <button
          onClick={handleUpload}
          className="bg-green-700 hover:bg-green-600 px-4 py-2 text-white rounded shadow"
        >
          ⬆️ Upload File
        </button>
      </div>

      {message && (
        <div className="bg-yellow-900 text-yellow-300 border border-yellow-700 rounded px-4 py-2">
          {message}
        </div>
      )}
    </div>
  );
}

export default FileManager;