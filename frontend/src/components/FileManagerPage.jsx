import React, {useState} from 'react'
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
  const { session} = UserAuth();
  const token = session?.access_token || '';
  const hostUrl = 'http://localhost:5000';
  const handleBeforeSend = (args) => {
    args.ajaxSettings.beforeSend = (ajaxArgs) => {
      ajaxArgs.httpRequest.setRequestHeader("Authorization", `${token}`);

      ajaxArgs.httpRequest.setRequestHeader("X-Folder-Id", currentFolderId);
      ajaxArgs.httpRequest.setRequestHeader("X-File-Id", currentFileId);



    };
  };
  const onFileSelect = (args) => {
    if (!args.fileDetails.folderId) {
      setCurrentFileId(args.fileDetails.fileId);
      setCurrentFolderId(null);
      console.log('Selected file ID:', args.fileDetails.fileId);
    }
    else {
      setCurrentFolderId(args.fileDetails.folderId);
      setCurrentFileId(null);
      console.log('Selected folder ID:', args.fileDetails.folderId);
    }
  };

  return (
    <div className="control-section">
      <FileManagerComponent
        id="file-manager"
        height="375px"
        // only the ‘read’ URL is required for navigation
        ajaxSettings={{
              url:       `${hostUrl}/api/filemanager/file-operations`,
              uploadUrl: `${hostUrl}/api/filemanager/upload`,
        }}
        beforeSend={handleBeforeSend}
        fileSelect={onFileSelect}
        
      >

        {/* inject just the navigation tree and details‐view */}
        <Inject services={[ NavigationPane, DetailsView         , Toolbar,        // ← here
          ContextMenu   ]} />
      </FileManagerComponent>
    </div>
  );
}
