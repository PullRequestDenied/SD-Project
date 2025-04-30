<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
>>>>>>> main
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function UploadTest() {
  const [file, setFile] = useState(null);   
<<<<<<< HEAD
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [message, setMessage] = useState("");   
  const { session } = UserAuth();
  useEffect(() => {
    if (!session) return;
    const fetchFolders = async () => {
      const { data, error } = await supabase
      .from("folders")
      .select("id, name");

      if (error) {
        console.error("Error fetching folders:", error.message);
      } else {
        setFolders(data);
      }
    };
    fetchFolders();
  }, [session]);   
=======
  const [message, setMessage] = useState("");   
  const { session } = UserAuth();   
>>>>>>> main
  //when file seleceted from input,select first index in event and store it in state
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleUpload = async () => {
  //self explanatory
  if (!file || !session) {
    setMessage("Please select a file");
    return;
  }

  const userId = session.user.id;
<<<<<<< HEAD
  const selectedFolderName = selectedFolder === null 
    ? "" 
    : folders.find(f => f.id === selectedFolder)?.name || "";
  const filePath = `${selectedFolderName}/${file.name}`;
=======
  const filePath = `test_uploads/${file.name}`;
>>>>>>> main

  //console.log("Uploading to storage:", filePath);
//uploading to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("archive")
    .upload(filePath, file);

    if (uploadError) {
     // conaole.log("L")
      console.error("Upload error:", uploadError);
      setMessage(`Upload error: ${uploadError.message}`);
      return;
    }
//    console.log("Upload success:", uploadData);
//inserting into database
const { error: dbError } = await supabase.from("files").insert({
  filename: file.name,
  path: filePath,
  type: file.type,
  size: file.size,
  metadata: {},
  uploaded_by: userId,
<<<<<<< HEAD
  folder_id: folders.selectedFolder.id || null, // Use the selected folder ID
=======
>>>>>>> main
});
if (dbError) {
  console.error("Database error:", dbError);
  setMessage(`Database error: ${dbError.message}`);
  return;
}
//console.log("Database insert success:", dbData);
setMessage("File uploaded and saved to the database");
};
  return (
  <div>
    <h2>Upload Test</h2>
    {session ? (
        <>
          <input className='p-3 mb-2 bg-stone-700 rounded-md' type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
          <p>{message}</p>
        </>
              ) : (
                <p>Please sign in to access this page.</p>
              )}
<<<<<<< HEAD
              <label>Select Folder:</label>
<select
  value={selectedFolder || ""}
  onChange={(e) =>
    setSelectedFolder(e.target.value === "" ? null : e.target.value)
  }
  className="p-2 rounded-md mb-2 block"
>
  <option value="">No folder (top-level)</option>
  {folders.map((folder) => (
    <option key={folder.id} value={folder.id}>
      {folder.name}
    </option>
  ))}
</select>
            </div>
            
=======
            </div>
>>>>>>> main
          );
        }

export default UploadTest;