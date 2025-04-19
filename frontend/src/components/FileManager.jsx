import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function FileManager() {
  // -- Auth Session --
  const { session } = UserAuth();
  const userId = session?.user?.id;

  // -- State: folder & file handling --
  const [folders, setFolders] = useState([]); // All folders from DB
  const [files, setFiles] = useState([]); // Files for the current folder
  const [currentFolderId, setCurrentFolderId] = useState(null); // Navigation (null = root)

  // -- State: creation & upload --
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState(null); // For folder creation dropdown
  const [file, setFile] = useState(null); // Selected file
  const [message, setMessage] = useState(""); // Feedback

  // ✅ Fetch folders and files whenever session or current folder changes
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      // Get all folders
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("id, name, parent_id")

      if (folderError) {
        console.error("Folder fetch error:", folderError.message);
      } else {
        setFolders(folderData);
      }

      // Get files inside the selected folder
      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("id, filename")
        .eq("folder_id", currentFolderId || null);

      if (fileError) {
        console.error("File fetch error:", fileError.message);
      } else {
        setFiles(fileData);
      }
    };

    fetchData();
  }, [session, currentFolderId]);

  // ✅ Create new folder (nested or top-level)
  const handleCreateFolder = async () => {
    if (!folderName || !userId) {
      setMessage("❌ Please enter a folder name.");
      return;
    }

    const parentName = folders.find(f => f.id === parentId)?.name || "";
    const folderPath = parentName ? `${parentName}/${folderName}/.keep` : `${folderName}/.keep`;

    const { error: uploadError } = await supabase.storage
      .from("archive")
      .upload(folderPath, new Blob([""], { type: "text/plain" }));

    if (uploadError && uploadError.message !== "The resource already exists") {
      console.error("Storage error:", uploadError.message);
      setMessage("❌ Failed to create folder in storage.");
      return;
    }

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
    setParentId(null);
    setMessage(`✅ Folder '${folderName}' created!`);
  };

  // ✅ Upload a file to the current folder
  const handleUpload = async () => {
    if (!file || !userId) {
      setMessage("❌ Please select a file to upload.");
      return;
    }

    const folderName = folders.find(f => f.id === currentFolderId)?.name || "top-level";
    const filePath = `${folderName}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("archive")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      setMessage(`❌ Upload failed: ${uploadError.message}`);
      return;
    }

    const { error: dbError } = await supabase.from("files").insert({
      filename: file.name,
      path: filePath,
      type: file.type,
      size: file.size,
      metadata: {},
      uploaded_by: userId,
      folder_id: currentFolderId || null,
    });

    if (dbError) {
      console.error("DB error:", dbError.message);
      setMessage("❌ Failed to save file in DB.");
      return;
    }

    setFile(null);
    setMessage("✅ File uploaded successfully!");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">📁 File Manager</h2>

      {/* ✅ Back button for navigating up the folder tree */}
      {currentFolderId && (
        <button
          onClick={() => setCurrentFolderId(folders.find(f => f.id === currentFolderId)?.parent_id || null)}
          className="px-3 py-1 bg-stone-700 text-white rounded"
        >
          🔙 Back
        </button>
      )}

      {/* ✅ Folder creation section */}
      <div>
        <input
          type="text"
          placeholder="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="p-2 bg-stone-800 text-white rounded-md mr-2"
        />

        <select
          value={parentId || ""}
          onChange={(e) => setParentId(e.target.value || null)}
          className="p-2 bg-stone-700 text-white rounded-md"
        >
          <option value="">Top-level folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <button onClick={handleCreateFolder} className="ml-2 bg-blue-600 px-4 py-2 text-white rounded">
          Create Folder
        </button>
      </div>

      {/* ✅ Folder navigation view */}
      <ul>
        {folders.filter(f => f.parent_id === currentFolderId).map((folder) => (
          <li
            key={folder.id}
            className="cursor-pointer text-blue-400 hover:underline"
            onClick={() => setCurrentFolderId(folder.id)}
          >
            📁 {folder.name}
          </li>
        ))}
      </ul>

      {/* ✅ File upload section */}
      <div className="pt-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-2"
        />
        <button
          onClick={handleUpload}
          className="bg-green-600 px-4 py-2 text-white rounded"
        >
          Upload File
        </button>
      </div>

      {/* ✅ List of files in the current folder */}
      <ul>
        {files.length > 0 && <li className="font-bold pt-4">📄 Files:</li>}
        {files.map((file) => (
          <li key={file.id}>📄 {file.filename}</li>
        ))}
      </ul>

      {/* ✅ Status message */}
      {message && <p className="pt-4">{message}</p>}
    </div>
  );
}

export default FileManager;
