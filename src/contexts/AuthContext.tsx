import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { sendLoginNotification } from '../lib/email';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  signUp: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      // Create auth user if they don't exist
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          data: {
            name,
            role
          }
        }
      }); 

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user returned after signup');

      // Create user profile
      const { error: profileError } = await supabase.from('users').upsert([
        { id: authData.user.id, email, name, role }
      ]);

      if (profileError) throw profileError;

      // Login immediately after signup
      return await login(email, password);

    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Authentication failed - no user returned');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user profile: ${userError.message}`);
      }

      // Send login notification
      await sendLoginNotification(userData.email, userData.name, userData.role);

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};