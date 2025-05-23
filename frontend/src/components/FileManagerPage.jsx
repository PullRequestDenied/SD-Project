import React, {useState} from 'react'
if (import.meta.hot) {
  import.meta.hot.decline();
}
import { UserAuth } from '../context/AuthContext';
import {
  FileManagerComponent,
  Inject,
  NavigationPane,
  DetailsView,
  Toolbar,
  ContextMenu
} from '@syncfusion/ej2-react-filemanager';

export default function FileManagerPage() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFileId,   setCurrentFileId  ] = useState(null);
  const [currentFileName, setCurrentFileName] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const fileObj = React.useRef(null);
  const { session} = UserAuth();
  const token = session?.access_token || '';
  const hostUrl = 'http://localhost:5000';
  const handleBeforeSend = (args) => {
    args.ajaxSettings.beforeSend = (ajaxArgs) => {
      ajaxArgs.httpRequest.setRequestHeader("Authorization", `${token}`);

      ajaxArgs.httpRequest.setRequestHeader("X-Folder-Id", currentFolderId);
      ajaxArgs.httpRequest.setRequestHeader("X-File-Id", currentFileId);
       const tagsArray = tagsInput.split(',').map(t => t.trim());
       ajaxArgs.httpRequest.setRequestHeader("X-Tags", JSON.stringify(tagsArray));



    };
  };

  const beforeDownload = async args => {
    // 1) cancel default form POST
    args.cancel = true;

    // 2) grab name + id
    const  name  = currentFileName;
    const id       = currentFileId;
    if (!id) return;

    // 3) fetch yourself with headers
    const res = await fetch(`${hostUrl}/api/filemanager/file-operations`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token,
        'X-File-Id':     id
      },
      body: JSON.stringify({ action: 'download', data: [{ id }] })
    });
    if (!res.ok) throw new Error('Download failed');

    // 4) blob + save
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href    = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const onFileSelect = (args) => {
    if (!args.fileDetails.folderId) {
      setCurrentFileId(args.fileDetails.fileId);
      setCurrentFileName(args.fileDetails.name);
      setCurrentFolderId(null);
          fileObj.current.enableToolbarItems(['download']);
      console.log('Selected file ID:', args.fileDetails.fileId);
      console.log('Selected file Name', args.fileDetails.name);
    }
    else {
      setCurrentFolderId(args.fileDetails.folderId);
      setCurrentFileId(null);
      console.log('Selected folder ID:', args.fileDetails.folderId);
          fileObj.current.disableToolbarItems(['download']);
    }


  };

  return (
    <div className="control-section">
<FileManagerComponent

           ref={fileObj}
  style={{ backgroundColor: 'white' }}
  id="file-manager"
  height="375px"
  // only the ‘read’ URL is required for navigation
  ajaxSettings={{
    url: `${hostUrl}/api/filemanager/file-operations`,
    uploadUrl: `${hostUrl}/api/filemanager/upload`,
    downloadUrl: `${hostUrl}/api/filemanager/file-operations`,
  }}

  beforeSend={handleBeforeSend}
  fileSelect={onFileSelect}
  beforeDownload={beforeDownload}
  toolbarSettings={{ items: ['NewFolder','Upload','Cut','Copy','Delete','Download','Rename','Refresh'] }}
>
  {/* inject just the navigation tree and details‐view */}
  <Inject services={[NavigationPane, DetailsView, Toolbar, ContextMenu]} />
</FileManagerComponent>
<div
  style={{
    backgroundColor: 'white',
    padding: '12px',
    marginTop: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  }}
>
  <label
    htmlFor="tags-input"
    style={{
      display: 'block',
      marginBottom: '4px',
      fontSize: '1.1rem',    // ↑ larger
      color: '#000',         // ↑ black
      fontWeight: 500,       // optional: make it stand out
    }}
  >
    Tags (comma-separated)
  </label>
  <input
    id="tags-input"
    type="text"
    placeholder="e.g. invoice, Q2, finance"
    value={tagsInput}
    onChange={e => setTagsInput(e.target.value)}
    style={{
      width: '100%',
      padding: '10px',        // a tad more padding
      fontSize: '1.125rem',   // ↑ larger text
      color: '#000',          // ↑ black
      border: '1px solid #ccc',
      borderRadius: '4px',
      outline: 'none',
    }}
  />
</div>

    </div>
    
  );
}
