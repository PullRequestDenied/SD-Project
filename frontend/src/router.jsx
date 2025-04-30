import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
<<<<<<< HEAD
import UploadTest from "./components/UploadTest";
=======
import ContactForm from "./components/ContactForm";
import PrivacyPolicy from "./components/PrivacyPolicy";
>>>>>>> main

export const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/signup", element: <Signup />},
    {path: "/signin", element: <Signin />},
    {path: "/dashboard", element: <PrivateRoute> <Dashboard /> </PrivateRoute>},
<<<<<<< HEAD
    { path: "/upload-test", element: <PrivateRoute><UploadTest /></PrivateRoute> }, // <- must be here
=======
    {path: "/contact", element: <ContactForm /> },
    {path: "/privacypolicy", element: <PrivacyPolicy /> },
>>>>>>> main
]);