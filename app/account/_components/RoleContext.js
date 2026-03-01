/**
 * @file Role context provider and hook.
 * Manages active role state with localStorage persistence.
 *
 * @module RoleContext
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export function RoleProvider({
  children,
  initialRole = 'guest',
  userRoles: initialUserRoles = [],
}) {
  const [activeRole, setActiveRole] = useState(initialRole);
  const [userRoles, setUserRoles] = useState(initialUserRoles);

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('activeRole');
    if (
      savedRole &&
      (initialUserRoles.length === 0 || initialUserRoles.includes(savedRole))
    ) {
      setActiveRole(savedRole);
    }
  }, [initialUserRoles]);

  // Sync userRoles when prop changes
  useEffect(() => {
    if (initialUserRoles.length > 0) {
      setUserRoles(initialUserRoles);
    }
  }, [initialUserRoles]);

  // Save role to localStorage when it changes
  const updateRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  return (
    <RoleContext.Provider
      value={{ activeRole, setActiveRole: updateRole, userRoles }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
