import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../services/firebase.js';
import { databaseService } from '../services/databaseService.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const profile = await databaseService.getBusinessProfile();
      setBusinessProfile(profile);
      setLoading(false);
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
        } else {
          setCurrentUser({
            uid: 'crochet_owner_admin',
            email: 'admin@crochet-business-manager.firebaseapp.com',
            displayName: 'Rutuja (Owner)',
          });
        }
        await loadProfile();
      });
      return unsubscribe;
    } else {
      // Local/Demo Mode: Default mock owner
      setCurrentUser({
        uid: 'demo_owner_wooly',
        email: 'rutuja@woolybloom.com',
        displayName: 'Rutuja (Owner)',
      });
      loadProfile();
    }
  }, []);

  const login = async (email, password) => {
    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    }
    // Local mode login
    const user = { uid: 'demo_owner_wooly', email, displayName: email.split('@')[0] };
    setCurrentUser(user);
    return user;
  };

  const signup = async (email, password, ownerName, businessName) => {
    let user;
    if (isFirebaseConfigured && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      user = res.user;
    } else {
      user = { uid: `user_${Date.now()}`, email, displayName: ownerName };
      setCurrentUser(user);
    }

    if (businessName || ownerName) {
      const updated = await databaseService.updateBusinessProfile({
        name: businessName || 'Wooly Bloom',
        ownerName: ownerName || 'Owner',
        email,
        setupComplete: false,
      });
      setBusinessProfile(updated);
    }
    return user;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    setCurrentUser(null);
  };

  const completeSetup = async (setupData) => {
    const updated = await databaseService.updateBusinessProfile({
      ...setupData,
      setupComplete: true,
    });
    setBusinessProfile(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        businessProfile,
        setBusinessProfile,
        loading,
        login,
        signup,
        logout,
        completeSetup,
        isDemoMode: !isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
