import React, { useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import {
  FileManagerComponent,
  Inject,
  NavigationPane,
  DetailsView,
  Toolbar,
  ContextMenu
} from '@syncfusion/ej2-react-filemanager';

if (import.meta.hot) {
  import.meta.hot.decline();
}

export default function FileManagerPage() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const { session } = UserAuth();
  const { darkMode } = useDarkMode();

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

  const onFileSelect = (args) => {
    if (!args.fileDetails.folderId) {
      setCurrentFileId(args.fileDetails.fileId);
      setCurrentFolderId(null);
    } else {
      setCurrentFolderId(args.fileDetails.folderId);
      setCurrentFileId(null);
    }
  };

  return (
    <div className={`p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <style>{`
        /* === BASE DARK MODE === */
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

        /* === TREEVIEW CLEANUP === */
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

        .filemanager-dark .e-treeview .e-node-focus .e-text-content,
        .filemanager-dark .e-treeview .e-active .e-text-content,
        .filemanager-dark .e-treeview .e-hover .e-text-content {
          color: #ffffff !important;
        }

        /* === FILE PANEL LIST & TILE VIEW === */
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

        .filemanager-dark .e-fe-hover .e-list-text,
        .filemanager-dark .e-active .e-list-text {
          color: #ffffff !important;
        }

        /* === LIGHT MODE FILE ROW HOVER === */
        .filemanager-light .e-grid .e-row:hover {
          background-color: #f3f4f6 !important;
        }

        /* === SEARCH BAR (TOP RIGHT) === */
        .filemanager-dark .e-search-container {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 6px !important;
          padding: 2px 6px !important;
        }

        .filemanager-dark .e-search-container input[type="text"] {
          background-color: transparent !important;
          color: #ffffff !important;
          border: none !important;
          font-size: 14px !important;
        }

        .filemanager-dark .e-search-container .e-icons {
          color: #9ca3af !important;
        }

        .filemanager-dark .e-search-container input[type="text"]::placeholder {
          color: #9ca3af !important;
        }

        .filemanager-light .e-search-container {
          border-radius: 6px !important;
          border: 1px solid #d1d5db !important;
          background-color: #ffffff !important;
          padding: 2px 6px !important;
        }

        .filemanager-light .e-search-container input[type="text"] {
          color: #111827 !important;
          background-color: transparent !important;
          border: none !important;
        }

        .filemanager-light .e-search-container .e-icons {
          color: #6b7280 !important;
        }

        .filemanager-light .e-search-container input[type="text"]::placeholder {
          color: #6b7280 !important;
        }
      `}</style>

      <div className={`rounded-lg overflow-hidden shadow ring-1 ${darkMode ? 'ring-gray-700' : 'ring-gray-200'}`}>
        <FileManagerComponent
          id="file-manager"
          height="400px"
          cssClass={darkMode ? 'e-dark filemanager-dark' : 'filemanager-light'}
          ajaxSettings={{
            url: `${hostUrl}/api/filemanager/file-operations`,
            uploadUrl: `${hostUrl}/api/filemanager/upload`,
          }}
          beforeSend={handleBeforeSend}
          fileSelect={onFileSelect}
        >
          <Inject services={[NavigationPane, DetailsView, Toolbar, ContextMenu]} />
        </FileManagerComponent>
      </div>

      <div className={`mt-6 p-4 rounded-lg border transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <label
          htmlFor="tags-input"
          className={`block mb-2 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          Tags (comma-separated)
        </label>
        <input
          id="tags-input"
          type="text"
          placeholder="e.g. invoice, Q2, finance"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          className={`w-full px-4 py-2 rounded-md outline-none text-sm transition-colors duration-300
            ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600'
                       : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
        />
      </div>
    </div>
  );
}
