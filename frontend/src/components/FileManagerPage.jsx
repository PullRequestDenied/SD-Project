import * as React from 'react';
import { UserAuth } from '../context/AuthContext';
import {
  FileManagerComponent,
  Inject,
  NavigationPane,
  DetailsView
} from '@syncfusion/ej2-react-filemanager';

export default function FileManagerPage() {
  const { session} = UserAuth();
  const token = session?.access_token || '';
  const hostUrl = 'http://localhost:5000';
  const handleBeforeSend = (args) => {
    args.ajaxSettings.beforeSend = (ajaxArgs) => {
      ajaxArgs.httpRequest.setRequestHeader("Authorization", `Bearer ${token}`);
    };
  };

  return (
    <div className="control-section">
      <FileManagerComponent
        id="file-manager"
        height="375px"
        // only the ‘read’ URL is required for navigation
        ajaxSettings={{
              url:         `${hostUrl}/api/filemanager/`,
              uploadUrl: `${hostUrl}/api/filemanager/upload`,
              headers:     { "authorization": `Bearer ${token}` },
        }}
        fields={{filterPath: 'filterPath'}}
        beforeSend={handleBeforeSend}
        
      >

        {/* inject just the navigation tree and details‐view */}
        <Inject services={[ NavigationPane, DetailsView ]} />
      </FileManagerComponent>
    </div>
  );
}
