import React from 'react'
import { useDarkMode } from '../context/DarkModeContext';
import { UserAuth } from '../context/AuthContext';
import IdentityCardComponent from './IdentityCardComponent';

const IdentitiesComponent = () => {
     const { darkMode, toggleDarkMode } = useDarkMode();
     const {session} = UserAuth();

     const [identities, setIdentities] = React.useState([]);
     const [hasIdentity, setHasIdentity] = React.useState(false);

    
    React.useEffect(() => {
        const getIdentities = () => {
            setIdentities(session?.user?.identities);
        }
        getIdentities();
        identities.length > 0 ? setHasIdentity(true) : setHasIdentity(false);

        if(!hasIdentity){
            setIdentities([{
                provider: "No linked accounts",
                id: "No linked accounts",
                user_id: "No linked accounts",
                access_token: "No linked accounts",
                created_at: "No linked accounts",
                updated_at: "No linked accounts"
            }])
        }
    }, [identities]);

  return (
    <section className='justify-center transition-colors mt-6'>
        <div className={`w-xl px-6 py-12 rounded-md transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
                  darkMode
                  ? 'bg-gray-800 border-gray-700 '
                  : 'bg-white border-gray-200 '
                }`}>
            <h2 className="text-2xl font-bold mb-6 text-center">Linked Accounts</h2>
            <div className="space-y-4">
                {identities.map((identity) => (
                <IdentityCardComponent key= {identity.id} identity={identity} />
                ))}
            </div>
            
        </div>

    </section>
  )
}

export default IdentitiesComponent