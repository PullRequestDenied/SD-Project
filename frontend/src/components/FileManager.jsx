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
    const folderPath = fullPath ? `${fullPath}/${folderName}/.keep` : `${folderName}/.keep`;

    const { error: uploadError } = await supabase.storage
      .from("archive")
      .upload(folderPath, new Blob([""], { type: "text/plain" }));
    //for preventing duplication ,added on my own not sure if it is needed
    if (uploadError && uploadError.message !== "The resource already exists") {
      console.error("Storage error:", uploadError.message);
      setMessage("❌ Failed to create folder in storage.");
      return;
    }
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

    const { error: uploadError } = await supabase.storage
      .from("archive")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      setMessage(`❌ Upload failed: ${uploadError.message}`);
      return;
    }
    //insert file details into datbase
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
          <div
            className="cursor-pointer text-blue-400 hover:underline font-medium"
            onClick={() => handleFolderClick(folder.id)}
          >
            📁 {folder.name}
          </div>
          <div className="ml-4">
            {files
              .filter(file => file.folder_id === folder.id)
              .map(file => (
                <div key={file.id} className="text-gray-300 ml-2">📄 {file.filename}</div>
              ))}
          </div>
          {renderFolderTree(folder.id, depth + 1)}
        </div>
      ));
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