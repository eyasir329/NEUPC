'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export function RoleProvider({ children, initialRole = 'guest' }) {
  const [activeRole, setActiveRole] = useState(initialRole);

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('activeRole');
    if (savedRole) {
      setActiveRole(savedRole);
    }
  }, []);

  // Save role to localStorage when it changes
  const updateRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole: updateRole }}>
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
