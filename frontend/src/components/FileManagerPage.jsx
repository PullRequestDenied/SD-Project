import React, { useState } from 'react';
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
import { useDarkMode } from '../context/DarkModeContext';

export default function FileManagerPage() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFileId,   setCurrentFileId  ] = useState(null);
  const [currentFileName, setCurrentFileName] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [infoMode, setInfoMode] = useState('view'); // 'none' | 'view'
  const [fileInfo, setFileInfo] = useState({ name: '', metadata: '', size: '' });
  const fileObj = React.useRef(null);
  
  const { session } = UserAuth();
  const { darkMode } = useDarkMode();

  const token   = session?.access_token || '';
  const hostUrl = 'https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net';

  const handleBeforeSend = (args) => {
    args.ajaxSettings.beforeSend = (ajaxArgs) => {
      console.log('BeforeSend action:', args.action);
      console.log('BeforeSend targetPath:', args.ajaxSettings.data?.targetPath);
      console.log('BeforeSend targetData:', args.ajaxSettings.data?.targetData);
      ajaxArgs.httpRequest.setRequestHeader('Authorization', token);
      ajaxArgs.httpRequest.setRequestHeader('X-Folder-Id', currentFolderId);
      ajaxArgs.httpRequest.setRequestHeader('X-File-Id', currentFileId);
      const tagsArray = tagsInput.split(',').map(t => t.trim());
      ajaxArgs.httpRequest.setRequestHeader('X-Tags', JSON.stringify(tagsArray));
    };
  };
const onFileManagerCreated = function() {
  this.disableToolbarItems(['View']);
  this.disableToolbarItems(['Details'])
};
  const beforeDownload = async (args) => {
    // 1) cancel default form POST
    args.cancel = true;

    // 2) grab name + id
    const name = currentFileName;
    const id   = currentFileId;
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
    link.href = url;
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
      alert(
        'File upload failed: ' +
          (args.error?.message ||
            'Please select a valid folder to upload in,files should not be uploaded to root,if you are not in root,please refresh the page.')
      );
    }
  }

  const onFileOpen = (args) => {
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
    } else {
      setInfoMode('none');
      setCurrentFileId(null);
    }
  };

  const handleMetadataSave = async () => {
    try {
      const res = await fetch(`${hostUrl}/api/filemanager/update-metadata`, {
        method: 'PUT', // or POST depending on your endpoint
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ fileId: currentFileId, metadata: fileInfo.metadata })
      });
      if (!res.ok) {
        // Show error from server or fallback message
        const errorData = await res.json().catch(() => null);
        const message = (errorData && errorData.error) || 'Internal server error';
        alert(message);
        return;
      }
      alert('Success');
      setInfoMode('none');
    } catch (err) {
      console.error('Metadata save failed:', err);
      alert('Internal server error');
    }
  };

  return (
    <div
      className={`control-section p-6 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white filemanager-dark' : 'bg-white text-gray-900 filemanager-light'
      }`}
    >
      {/* ---- Dark-Mode & Light-Mode CSS overrides ---- */}
      <style>{`
/* ===== BASE DARK MODE FILEMANAGER ===== */
.filemanager-dark .e-filemanager,
.filemanager-dark .e-gridheader,
.filemanager-dark .e-toolbar,
.filemanager-dark .e-breadcrumb-bar,
.filemanager-dark .e-search-input,
.filemanager-dark .e-input-group input {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  border-color: #374151 !important;
}
.filemanager-dark .e-input-group input::placeholder,
.filemanager-dark .e-search-input::placeholder {
  color: #cbd5e1 !important;
}
.filemanager-dark .e-toolbar .e-btn,
.filemanager-dark .e-toolbar .e-btn .e-btn-icon,
.filemanager-dark .e-toolbar .e-tbar-btn-text {
  background-color: transparent !important;
  color: #f9fafb !important;
}

/* ===== TREEVIEW ===== */
.filemanager-dark .e-treeview .e-list-item:not(.e-hover):not(.e-active):not(.e-node-focus) .e-fullrow {
  background-color: transparent !important;
}
.filemanager-dark .e-treeview .e-list-item .e-text-content {
  color: #ffffff !important;
}
.filemanager-dark .e-treeview .e-node-focus .e-fullrow,
.filemanager-dark .e-treeview .e-active .e-fullrow {
  background-color: rgba(255, 255, 255, 0.08) !important;
}
.filemanager-dark .e-treeview .e-list-item.e-hover .e-fullrow {
  background-color: rgba(255, 255, 255, 0.04) !important;
}

/* ===== TILE VIEW / FILE PANEL ===== */
.filemanager-dark .e-grid .e-row:hover,
.filemanager-dark .e-list-parent .e-list-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}
.filemanager-dark .e-cell,
.filemanager-dark .e-list-text,
.filemanager-dark .e-fe-text {
  color: #ffffff !important;
  background-color: transparent !important;
}
.filemanager-dark .e-fe-hover,
.filemanager-dark .e-active {
  background-color: rgba(255, 255, 255, 0.07) !important;
  color: #ffffff !important;
}

/* ===== TOOLBAR / PATH INPUT FIXES ===== */
.filemanager-dark .e-breadcrumb-bar,
.filemanager-dark .e-addressbar-input,
.filemanager-dark .e-input-group input,
.filemanager-dark .e-search-container input,
.filemanager-dark .e-toolbar .e-toolbar-items,
.filemanager-dark .e-toolbar .e-toolbar-item {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  border-color: #374151 !important;
}
.filemanager-dark .e-address input::placeholder,
.filemanager-dark .e-input-group input::placeholder,
.filemanager-dark .e-search-container input::placeholder {
  color: #cbd5e1 !important;
}
.filemanager-dark .e-address input,
.filemanager-dark .e-input-group input {
  box-shadow: none !important;
}

/* ===== DIALOG STYLING ===== */
.filemanager-dark .e-dialog {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  border: 1px solid #374151 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
}
.filemanager-dark .e-dialog .e-dlg-header {
  background-color: transparent !important;
  border: none !important;
  padding: 1rem 1.25rem !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filemanager-dark .e-dialog .e-dlg-header span {
  background: transparent !important;
  color: #ffffff !important;
  font-size: 1.125rem;
  font-weight: 600;
  display: block !important;
  padding: 0.25rem 0 !important;
}
.filemanager-dark .e-dialog .e-dlg-content,
.filemanager-dark .e-dialog .e-footer-content {
  background-color: #1f2937 !important;
  color: #ffffff !important;
  padding-top: 0 !important;
}
.filemanager-dark .e-dialog input,
.filemanager-dark .e-dialog .e-input-group input {
  background-color: #111827 !important;
  color: #ffffff !important;
  border: 1px solid #4b5563 !important;
  box-shadow: none !important;
  border-radius: 4px !important;
}
.filemanager-dark .e-dialog input::placeholder {
  color: #9ca3af !important;
}
.filemanager-dark .e-dialog input:focus,
.filemanager-dark .e-dialog .e-input-group input:focus {
  outline: none !important;
  border-color: #4b5563 !important;
  box-shadow: none !important;
}
.filemanager-dark .e-input-group.e-control-wrapper.e-input-focus::before,
.filemanager-dark .e-input-group.e-control-wrapper.e-input-focus::after {
  background-color: transparent !important;
  height: 0 !important;
  border: none !important;
  box-shadow: none !important;
}
.filemanager-dark .e-dialog .e-btn.e-flat,
.filemanager-dark .e-dialog .e-primary {
  color: #60a5fa !important;
  background: transparent !important;
  font-weight: 600;
  border: none;
}

/* ===== INPUT / LABEL LEFT-PAD ALIGNMENT ===== */
label, select, input, .metadata-section, .button-row { padding-left: .25rem; }
input[type="text"].pl-4, input.pl-4, select.pl-2, .button-row.pl-1 { padding-left: 1rem !important; }

/* Fix top white area in dark mode dialogs */
.filemanager-dark .e-dialog,
.filemanager-dark .e-dialog .e-dlg-header,
.filemanager-dark .e-dialog .e-dlg-header-content {
  background-color: #1f2937 !important;
  color: #ffffff !important;
}
      `}</style>

      <FileManagerComponent
        ref={fileObj}
        style={{ backgroundColor: darkMode ? '#1f2937' : 'white' }}
        id="file-manager"
        height="375px"
        
        // only the ‘read’ URL is required for navigation
        ajaxSettings={{
          url: `${hostUrl}/api/filemanager/file-operations`,
          uploadUrl: `${hostUrl}/api/filemanager/upload`,
          downloadUrl: `${hostUrl}/api/filemanager/file-operations`,
        }}
        created={onFileManagerCreated}
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
        className={`mt-6 p-4 rounded-lg border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <label htmlFor="tags-input" className="block mb-2 text-sm font-semibold">
          Tags (comma-separated) (Enter your tags before uploading a file)
        </label>
        <input
          id="tags-input"
          type="text"
          placeholder="e.g. invoice, Q2, finance"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className={`w-full px-4 py-2 rounded-md outline-none text-sm transition-colors duration-300 ${
            darkMode
              ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600'
              : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'
          }`}
        />

        {infoMode !== 'none' && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <select
              value={infoMode}
              onChange={(e) => setInfoMode(e.target.value)}
              className={`mb-2 px-2 py-1 rounded ${
                darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            >
              <option value="view">File Information</option>
              <option value="none">Hide</option>
            </select>

            {infoMode === 'view' && (
              <>
                <p>
                  <strong>Name:</strong> {fileInfo.name}
                </p>
                <p>
                  <strong>Size:</strong> {fileInfo.size}
                </p>
                <label className="block mt-2">
                  Metadata: (Edit tags if necessary)
                  <input
                    type="text"
                    value={fileInfo.metadata}
                    onChange={(e) => setFileInfo({ ...fileInfo, metadata: e.target.value })}
                    className={`w-full mt-1 px-3 py-2 rounded-md transition-colors duration-300 ${
                      darkMode ? 'bg-gray-600 text-white border border-gray-500' : 'bg-white text-gray-900 border border-gray-300'
                    }`}
                  />
                </label>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleMetadataSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                    Save
                  </button>
                  <button
                    onClick={() => setInfoMode('none')}
                    className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
