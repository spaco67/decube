import { supabase } from './supabase';

export async function signUp(email: string, password: string, name: string, role: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role,
        }
      ]);

    if (profileError) throw profileError;
  }

  return authData;
}