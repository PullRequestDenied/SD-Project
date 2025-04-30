import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import ContactForm from "./components/ContactForm";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ForgotPassword from "./components/ForgotPassword";

export const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/signup", element: <Signup />},
    {path: "/signin", element: <Signin />},
    {path: "/dashboard", element: <PrivateRoute> <Dashboard /> </PrivateRoute>},
    {path: "/contact", element: <ContactForm /> },
    {path: "/privacypolicy", element: <PrivacyPolicy /> },
    {path: "/forgotpassword", element: <ForgotPassword /> },
]);