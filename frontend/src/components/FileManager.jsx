import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

// Helper to build folder path
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

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedUploadFolderId, setSelectedUploadFolderId] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("id, name, parent_id");

      if (folderError) {
        console.error("Folder fetch error:", folderError.message);
      } else {
        setFolders(folderData);
      }

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("id, filename, folder_id");

      if (fileError) {
        console.error("File fetch error:", fileError.message);
      } else {
        setFiles(fileData.filter(f => !f.filename.endsWith(".keep")));
      }
    };

    fetchData();
  }, [session, currentFolderId]);

  const buildFullPath = () => {
    return buildFullPathFromFolderId(currentFolderId, folders);
  };

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

  const handleBreadcrumbClick = (index) => {
    const newTrail = breadcrumbTrail.slice(0, index + 1);
    const lastFolder = newTrail[newTrail.length - 1];
    setCurrentFolderId(lastFolder?.id || null);
    setParentId(lastFolder?.id || null);
    setBreadcrumbTrail(newTrail);
  };

  const handleCreateFolder = async () => {
    if (!folderName || !userId) {
      setMessage("❌ Please enter a folder name.");
      return;
    }
    const fullPath = buildFullPathFromFolderId(parentId, folders);
    const folderPath = fullPath ? `${fullPath}/${folderName}/.keep` : `${folderName}/.keep`;

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

  const handleUpload = async () => {
    if (!file || !userId) {
      setMessage("❌ Please select a file to upload.");
      return;
    }

    const uploadFolderId = selectedUploadFolderId ?? currentFolderId ?? null;
    const fullPath = buildFullPathFromFolderId(uploadFolderId, folders);
    const filePath = fullPath ? `${fullPath}/${file.name}` : `${file.name}`;

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
      folder_id: uploadFolderId,
    });

    if (dbError) {
      console.error("DB error:", dbError.message);
      setMessage("❌ Failed to save file in DB.");
      return;
    }

    setFile(null);
    setSelectedUploadFolderId(null);
    setMessage("✅ File uploaded successfully!");
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const renderFolderTree = (parentId = null, depth = 0) => {
    return folders
      .filter(f => f.parent_id === parentId)
      .map(folder => (
        <section
          key={folder.id}
          className="border-l-2 border-gray-600 pl-3 ml-1 mb-3"
          style={{ marginLeft: depth * 10 }}
        >
          <section className="flex items-center space-x-2">
            <button
              onClick={() => toggleFolder(folder.id)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              {expandedFolders[folder.id] ? '➖' : '➕'}
            </button>
            <span
              className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium"
              onClick={() => handleFolderClick(folder.id)}
            >
              📁 {folder.name}
            </span>
          </section>
          {expandedFolders[folder.id] && (
            <aside className="ml-6 mt-2 space-y-1">
              {files
                .filter(file => file.folder_id === folder.id)
                .map(file => (
                  <span key={file.id} className="text-gray-300 ml-2 flex items-center gap-2">
                    📄 {file.filename}
                  </span>
                ))}
              {renderFolderTree(folder.id, depth + 1)}
            </aside>
          )}
        </section>
      ));
  };

  return (
    <main className="p-8 max-w-5xl mx-auto bg-gray-900 shadow-2xl rounded-2xl text-white space-y-8">
      <h2 className="text-4xl font-extrabold border-b-2 border-gray-700 pb-4 mb-6">📁 File Manager</h2>

      <section className="text-sm text-blue-400 flex flex-wrap items-center space-x-1">
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
          <span key={folder.id} className="flex items-center">
            <span className="mx-2 text-gray-500">/</span>
            <span
              className="cursor-pointer hover:underline"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {folder.name}
            </span>
          </span>
        ))}
      </section>

      {/* Create Folder */}
      <section className="flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          placeholder="New folder name..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="p-3 border border-gray-600 bg-gray-800 text-white rounded-lg w-full md:w-1/2"
        />
        <select
          value={parentId || ""}
          onChange={(e) => setParentId(e.target.value || null)}
          className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white w-full md:w-auto"
        >
          <option value="">Root</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {buildFullPathFromFolderId(folder.id, folders)}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateFolder}
          className="bg-blue-700 hover:bg-blue-600 px-6 py-3 text-white rounded-lg font-semibold"
        >
          ➕ Create Folder
        </button>
      </section>

      {/* Folder Tree */}
      <aside className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        {renderFolderTree()}
      </aside>

      {/* Upload Section */}
      <section className="flex flex-col md:flex-row items-center gap-4">
        <input
          data-testid="file-input"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-700 file:hover:bg-green-600"
        />
        <select
          value={selectedUploadFolderId || ""}
          onChange={(e) => setSelectedUploadFolderId(e.target.value || null)}
          className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white w-full md:w-auto"
        >
          <option value="">Root</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {buildFullPathFromFolderId(folder.id, folders)}
            </option>
          ))}
        </select>
        <button
          onClick={handleUpload}
          className="bg-green-700 hover:bg-green-600 px-6 py-3 text-white rounded-lg font-semibold"
        >
          ⬆️ Upload File
        </button>
      </section>

      {message && (
        <article className="bg-yellow-800 text-yellow-300 border border-yellow-600 rounded-lg px-6 py-4">
          {message}
        </article>
      )}
    </main>
  );
}

export default FileManager;
