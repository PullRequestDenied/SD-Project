import { createContext, useEffect, useState, useContext } from "react";
import {supabase} from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);

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

    return (
        <AuthContext.Provider value={{ session, signUpNewUser, signOut, signInUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const UserAuth = () => {
    return useContext(AuthContext);
}