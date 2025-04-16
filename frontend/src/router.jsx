import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import UploadTest from "./components/UploadTest";

export const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/signup", element: <Signup />},
    {path: "/signin", element: <Signin />},
    {path: "/dashboard", element: <PrivateRoute> <Dashboard /> </PrivateRoute>},
    { path: "/upload-test", element: <PrivateRoute><UploadTest /></PrivateRoute> }, // <- must be here
]);