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
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedUploadFolderId, setSelectedUploadFolderId] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const { data: folderData } = await supabase
        .from("folders")
        .select("id, name, parent_id");

      const { data: fileData } = await supabase
        .from("files")
        .select("id, filename, folder_id");

      if (folderData) setFolders(folderData);
      if (fileData) setFiles(fileData.filter(f => !f.filename.endsWith(".keep")));
    };

    fetchData();
  }, [session]);

  const handleFolderClick = (folderId) => {
    setCurrentFolderId(folderId);
    setParentId(folderId);
  };

  const toggleFolderExpand = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
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

    const { error: dbError } = await supabase.from("folders").insert({
      name: folderName,
      created_by: userId,
      parent_id: parentId || null,
    });

    if (uploadError || dbError) {
      setMessage("❌ Error creating folder.");
    } else {
      setFolderName("");
      setParentId(null);
      setMessage(`✅ Folder '${folderName}' created!`);
    }
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

    const { error: dbError } = await supabase.from("files").insert({
      filename: file.name,
      path: filePath,
      type: file.type,
      size: file.size,
      metadata: {},
      uploaded_by: userId,
      folder_id: uploadFolderId,
    });

    if (uploadError || dbError) {
      setMessage("❌ Upload failed.");
    } else {
      setFile(null);
      setSelectedUploadFolderId(null);
      setMessage("✅ File uploaded successfully!");
    }
  };

  const renderFolderTree = (parentId = null) => {
    return folders
      .filter(f => f.parent_id === parentId)
      .map(folder => {
        const hasSubfolders = folders.some(f => f.parent_id === folder.id);
        const isExpanded = expandedFolders[folder.id];

        return (
          <div key={folder.id} className="pl-2">
            <div
              className="flex items-center justify-between py-2 px-2 hover:bg-gray-700 rounded-lg cursor-pointer transition duration-150"
              onClick={() => handleFolderClick(folder.id)}
            >
              <span className="flex items-center gap-2">
                📁 <span className="font-semibold">{folder.name}</span>
              </span>

              <div className="w-6 text-right">
                {hasSubfolders ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderExpand(folder.id);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-lg select-none"
                  >
                    {isExpanded ? "➖" : "➕"}
                  </span>
                ) : (
                  <span className="text-gray-500 text-lg select-none">
                    ➕
                  </span>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="pl-4">{renderFolderTree(folder.id)}</div>
            )}
          </div>
        );
      });
  };

  return (
    <main className="p-8 max-w-7xl mx-auto bg-gray-950 text-white rounded-2xl shadow-lg">
      <h2 className="text-4xl font-bold text-center mb-10">📁 File Manager</h2>

      {message && (
        <div className="bg-yellow-800 text-yellow-300 rounded-lg p-4 mb-6 text-center">
          {message}
        </div>
      )}

      {/* Folder tree + files section */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Folders */}
        <aside className="w-full lg:w-1/3 bg-gray-900 p-6 rounded-2xl shadow-md">
          <h3 className="text-2xl font-semibold mb-6">Folders</h3>
          {renderFolderTree()}
        </aside>

        {/* Files */}
        <section className="w-full lg:w-2/3 bg-gray-900 p-6 rounded-2xl shadow-md">
          <h3 className="text-2xl font-semibold mb-6">Files</h3>
          <div className="grid gap-4">
            {files.filter(file => file.folder_id === currentFolderId).length > 0 ? (
              files
                .filter(file => file.folder_id === currentFolderId)
                .map(file => (
                  <div key={file.id} className="p-4 bg-gray-850 rounded-lg border border-gray-700 hover:brightness-110 transition">
                    📄 {file.filename}
                  </div>
                ))
            ) : (
              <p className="text-gray-400">No files in this folder.</p>
            )}
          </div>
        </section>
      </div>

      {/* Bottom actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {/* Create Folder */}
        <div className="bg-gray-900 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h3 className="text-2xl font-semibold mb-4">➕ Create New Folder</h3>
          <input
            type="text"
            placeholder="Folder name..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="p-3 border border-gray-700 bg-gray-850 rounded-lg"
          />
          <select
            value={parentId || ""}
            onChange={(e) => setParentId(e.target.value || null)}
            className="p-3 border border-gray-700 bg-gray-850 rounded-lg"
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
            className="bg-blue-700 hover:bg-blue-600 p-3 rounded-lg font-semibold"
          >
            ➕ Create Folder
          </button>
        </div>

        {/* Upload File */}
        <div className="bg-gray-900 p-6 rounded-2xl shadow-md flex flex-col gap-4">
          <h3 className="text-2xl font-semibold mb-4">⬆️ Upload New File</h3>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-700 file:hover:bg-green-600"
          />
          <select
            value={selectedUploadFolderId || ""}
            onChange={(e) => setSelectedUploadFolderId(e.target.value || null)}
            className="p-3 border border-gray-700 bg-gray-850 rounded-lg"
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
            className="bg-green-700 hover:bg-green-600 p-3 rounded-lg font-semibold"
          >
            ⬆️ Upload File
          </button>
        </div>
      </section>
    </main>
  );
}

export default FileManager;
