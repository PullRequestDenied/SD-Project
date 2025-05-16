import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { DarkModeProvider } from './context/DarkModeContext.jsx'
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY);

createRoot(document.getElementById('root')).render(
<StrictMode>
  <DarkModeProvider>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  </DarkModeProvider>
</StrictMode>
);
