import { supabase } from './supabase';

// Get user by email
export async function getGuest(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  // No error if user doesn't exist
  if (error) {
    console.error('Error fetching user:', error.message);
    throw new Error('User could not be loaded');
  }
  return data;
}

// Create new user
export async function createGuest(newGuest) {
  const { data, error } = await supabase
    .from('users')
    .insert([newGuest])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error.message);
    throw new Error('User could not be created');
  }

  return data;
}

// Update user information
export async function updateGuest(email, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user:', error.message);
    throw new Error('User could not be updated');
  }

  return data;
}

// Get user roles by email
export async function getUserRoles(email) {
  try {
    // First, get the user_id from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.warn('Error fetching user for roles:', userError.message);
      // Return guest role if user fetch fails (user might not be in DB yet)
      return ['guest'];
    }

    if (!userData) {
      // User doesn't exist, return guest role by default
      return ['guest'];
    }

    // Get user roles by joining user_roles with roles table
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userData.id);

    if (rolesError) {
      console.warn('Error fetching user roles:', rolesError.message);
      // Return guest role if roles fetch fails
      return ['guest'];
    }

    // Extract role names from the nested structure
    const roleNames = rolesData.map((item) => item.roles?.name).filter(Boolean);

    // If no roles found, return guest as default
    return roleNames.length > 0 ? roleNames : ['guest'];
  } catch (error) {
    console.error('Unexpected error in getUserRoles:', error);
    // Fallback to guest role on any unexpected error
    return ['guest'];
  }
}
