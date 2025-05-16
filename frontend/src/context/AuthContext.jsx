import { createContext, useEffect, useState, useContext } from "react";
import {supabase} from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);

    //SignUp
    const signUpNewUser = async (email, password, username) => {
        const {data , error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: username,
                }
            }
        });
        if (error) {
            console.error("Error signing up:", error.message);
            return{success: false, error};
        }
        return {success: true, data};
    };

    //SignIn
    const signInUser = async (email, password) => {
        try {
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) {
                console.error("Error signing in:", error.message);
                return{success: false, error};
            }
            return {success: true, data};
        } catch (err) {
            console.error("An error occured:", err.message);
        }
    };

    //Get Session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);//done loading
        });

        supabase.auth.onAuthStateChange((_event, session) => {
             setSession(session);
         });
    },[]);

    //SignOut
    const signOut = async () => {
        const {error} = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error);
        }
        setSession(undefined);
    };

    //Password Reset Request
    const requestReset = async (email) => {
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:5173/resetpassword',
        });
        return {success: true};
    };

    //Change Password
    const changePassword = async (password) => {

        const {data , error} =  await supabase.auth.updateUser({ password: password });
        if (error) {
            return {success: false, error};
        }
        return {success: true,data};
    };

    //Change Password
    const updateUsernameAndEmail = async (username, email) => {
        const {data , error} = await supabase.auth.updateUser({ 
            email: email, 
            data: { display_name: username }});
            if (error) {
                return {success: false, error};
            }
        return {success: true, data};
    };

    //Signin with github
    const signInWithGithub = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
        })
        if (error) {
            console.error("Error signing in with GitHub:", error.message);
            return {success: false, error};
        }
        return {success: true, data};
    }

    return (
        <AuthContext.Provider value={{ session,loading, signUpNewUser, signOut, signInUser, requestReset, changePassword, updateUsernameAndEmail, signInWithGithub }}>
            {children}
        </AuthContext.Provider>
    );
}

export const UserAuth = () => {
    return useContext(AuthContext);
}