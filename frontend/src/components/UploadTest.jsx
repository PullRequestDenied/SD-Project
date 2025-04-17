import { useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function UploadTest() {
  const [file, setFile] = useState(null);   
  const [message, setMessage] = useState("");   
  const { session } = UserAuth();   
  //when file seleceted from input,select first index in event and store it in state
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleUpload = async () => {
  //self explanatory
  if (!file || !session) {
    setMessage("Please select a file");
    return;
  }

  const userId = session.user.id;
  const filePath = `test_uploads/${file.name}`;

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
            </div>
          );
        }

export default UploadTest;