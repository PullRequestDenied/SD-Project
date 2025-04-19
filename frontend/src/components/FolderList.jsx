import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

function FolderList() {
  const { session } = UserAuth();
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [files, setFiles] = useState([]);
  useEffect(() => {
    if (!session) return;
  
    const fetchData = async () => {
      // Fetch folders
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
  
    fetchData();
  }, [session, currentFolderId]);
  return (
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
  );
}

export default FolderList;
