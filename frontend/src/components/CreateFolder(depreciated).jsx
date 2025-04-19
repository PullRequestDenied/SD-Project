import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function CreateFolder() {
  // Keeps track of the folder name input
  const [folderName, setFolderName] = useState("");

  // Stores the list of existing folders (used to create nested folders)
  const [folders, setFolders] = useState([]);

  // Tracks the selected parent folder (for nesting)
  const [parentId, setParentId] = useState(null);

  // Displays status or error messages
  const [message, setMessage] = useState("");

  // Retrieves the current user's session (for user-specific data)
  const { session } = UserAuth();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [files, setFiles] = useState([]);


  useEffect(() => {
    if (!session) return;

    const fetchFolders = async () => {
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("id, name, parent_id")

  
      if (folderError) {
        console.error("Error fetching folders:", folderError.message);
      } else {
        setFolders(folderData);
      }
  
      // Fetch files in current folder
      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("id, filename")
        .eq("folder_id", currentFolderId || null); // top-level if null
  
      if (fileError) {
        console.error("Error fetching files:", fileError.message);
      } else {
        setFiles(fileData);
      }
    };

    fetchFolders();
  }, [session,currentFolderId]);

  const handleCreateFolder = async () => {
    if (!folderName || !session) {
      setMessage("Please enter a folder name.");
      return;
    }

    const userId = session.user.id;


    const parentName = folders.find((f) => f.id === parentId)?.name || null;
    console.log(parentId);
    const storagePath = parentName
      ? `${parentName}/${folderName}/.keep`
      : `${folderName}/.keep`;
    console.log(storagePath);
    const { error: storageError } = await supabase.storage
      .from("archive")
      .upload(storagePath, new Blob([""], { type: "text/plain" }));

    if (storageError && storageError.message !== "The resource already exists") {
      console.error("Storage error:", storageError.message);
      setMessage(`❌ Storage error: ${storageError.message}`);
      return;
    }
    console.log(folderName);
    console.log(userId);
    console.log(parentId);
    const { error: dbError } = await supabase.from("folders").insert({
      name: folderName,
      created_by: userId,
      parent_id: parentId || null, // null means it's a top-level folder
    });

    if (dbError) {
      console.error("DB error:", dbError.message);
      setMessage(`❌ Database error: ${dbError.message}`);
      return;
    }

    setMessage(`✅ Folder "${folderName}" created successfully!`);
    setFolderName("");
    setParentId(null);

    // 🔄 Refetch folders after creation so dropdown updates immediately
    const { data: updatedFolders } = await supabase
      .from("folders")
      .select("id, name, parent_id")

    setFolders(updatedFolders || []);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📁 Create Folder</h2>


      <input
        className="p-2 mb-2 bg-stone-800 text-white rounded-md block"
        type="text"
        placeholder="Folder name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
      />

      <label className="block mb-1">Parent folder (optional):</label>
      <select
        value={parentId || ""}
        onChange={(e) =>
          setParentId(e.target.value === "" ? null : e.target.value)
        }
        className="p-2 bg-stone-700 text-white rounded-md mb-3 block"
      >
        <option value="">No parent (top-level folder)</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>


      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
        onClick={handleCreateFolder}
      >
        Create Folder
      </button>

      {message && <p>{message}</p>}


      <div>
      {currentFolderId && (
  <button
    onClick={() => setCurrentFolderId(
      folders.find(f => f.id === currentFolderId)?.parent_id || null
    )}
    className="mb-4 px-3 py-1 bg-stone-700 text-white rounded"
  >
    🔙 Back
  </button>
)}

<ul className="mb-4">
  {folders
    .filter((f) => f.parent_id === currentFolderId)
    .map((folder) => (
      <li
        key={folder.id}
        className="cursor-pointer hover:underline text-blue-400"
        onClick={() => setCurrentFolderId(folder.id)}
      >
        📁 {folder.name}
      </li>
    ))}
</ul>

<ul className="mb-2">
  {files.length > 0 && <li className="font-bold">📄 Files:</li>}
  {files.map((file) => (
    <li key={file.id}>📄 {file.filename}</li>
  ))}
</ul>

    </div>
    </div>
  );
}

export default CreateFolder;
