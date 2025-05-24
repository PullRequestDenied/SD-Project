import React, {useState} from 'react'
if (import.meta.hot) {
  import.meta.hot.decline();
}
import { UserAuth } from '../context/AuthContext';
import {
  FileManagerComponent,
  Inject,
  DetailsView,
  Toolbar,
  ContextMenu
} from '@syncfusion/ej2-react-filemanager';

export default function FileManagerPage() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFileId,   setCurrentFileId  ] = useState(null);
  const [currentFileName, setCurrentFileName] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [infoMode, setInfoMode] = useState('view'); // 'none' | 'view'
  const [fileInfo, setFileInfo] = useState({ name: '', metadata: '', size: '' });
  const fileObj = React.useRef(null);
  const { session} = UserAuth();
  const token = session?.access_token || '';
  const hostUrl = 'https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net';
  const handleBeforeSend = (args) => {
    args.ajaxSettings.beforeSend = (ajaxArgs) => {
        console.log('BeforeSend action:', args.action);
  console.log('BeforeSend targetPath:', args.ajaxSettings.data?.targetPath);
  console.log('BeforeSend targetData:', args.ajaxSettings.data?.targetData);
      ajaxArgs.httpRequest.setRequestHeader("Authorization", token);

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
function onFailure(args) {
  console.warn('FileManager failure args:', args);
  // Now inspect args.action in the console
  if (args.action === 'Upload') {
    alert('File upload failed: ' + (args.error?.message || 'Please select a valid folder to upload in,files should not be uploaded to root'));
  }
}
  const onFileOpen = args => {
    const folderId = args.fileDetails.folderId;
    setCurrentFolderId(folderId);

    setInfoMode('none');
        if (folderId) {
      fileObj.current.enableToolbarItems(['upload']);
    } else {
      fileObj.current.disableToolbarItems(['upload']);
    }

  };

  const onFileSelect = (args) => {
    if (!args.fileDetails.folderId) {
      setCurrentFileId(args.fileDetails.fileId);
      setCurrentFileName(args.fileDetails.name);
      setCurrentFolderId(null);
 
      console.log(args.fileDetails.metadata);
      setFileInfo({
        name: args.fileDetails.name,
        metadata: args.fileDetails.tags || '',
        size: args.fileDetails.size || ''
      });
      setInfoMode('view');
    }
    else {
      setInfoMode('none');
      setCurrentFileId(null);

    }


  };
  const handleMetadataSave = async () => {
  try {
    const res = await fetch(`${hostUrl}/api/filemanager/update-metadata`, {
      method: 'PUT', // or POST depending on your endpoint
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ fileId: currentFileId, metadata: fileInfo.metadata })
    });
    if (!res.ok) {
      // Show error from server or fallback message
      const errorData = await res.json().catch(() => null);
      const message = (errorData && errorData.error) || 'Internal server error';
      alert(message);
      return;
    }
    alert("Success")
    setInfoMode('none');
  } catch (err) {
    console.error('Metadata save failed:', err);
    alert('Internal server error');
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
  failure={onFailure}
  beforeSend={handleBeforeSend}
  fileOpen={onFileOpen}
  fileSelect={onFileSelect}
  beforeDownload={beforeDownload}

  
>
  {/* inject just the navigation tree and details‐view */}
  <Inject services={[DetailsView, Toolbar, ContextMenu]} />
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
            fontSize: '1.1rem',
            color: '#000',
            fontWeight: 500,
          }}
        >
          Tags (comma-separated) (Enter your tags before uploading a file)
        </label>
        <input
          id="tags-input"
          type="text"
          placeholder="e.g. invoice, Q2, finance"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '1.125rem',
            color: '#000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            outline: 'none',
          }}
        />

        {infoMode !== 'none' && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc', borderRadius: 4, color: '#000' }}>
            <select
              value={infoMode}
              onChange={e => setInfoMode(e.target.value)}
              style={{ marginBottom: 8, padding: 4 }}
            >
              <option value="view">File Information</option>
              <option value="none">Hide</option>
            </select>

            {infoMode === 'view' && (
              <div>
                <p><strong>Name:</strong> {fileInfo.name}</p>
                <p><strong>Size:</strong> {fileInfo.size}</p>
                <label>
                  Metadata: (Edit tags if necessary)
                  <input
                    type="text"
                    value={fileInfo.metadata}
                    onChange={e => setFileInfo({ ...fileInfo, metadata: e.target.value })}
                    style={{ width: '100%', marginTop: 4, marginBottom: 8 }}
                  />
                </label>
                <div>
                  <button onClick={handleMetadataSave} style={{ marginRight: 8 }}>Save</button>
                  <button onClick={() => setInfoMode('none')}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}