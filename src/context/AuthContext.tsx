'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ExpertProfile, StudentProfile } from '@/types';
import { INITIAL_USERS, INITIAL_EXPERT_PROFILES, INITIAL_STUDENT_PROFILES } from '@/data/seedData';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  expertProfile: ExpertProfile | null;
  studentProfile: StudentProfile | null;
  allUsers: User[];
  isPendingApproval: boolean;
  switchUser: (userId: string) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>('usr_stu_1'); // Default to Student Rohan
  const [expertProfiles, setExpertProfiles] = useState<ExpertProfile[]>(INITIAL_EXPERT_PROFILES);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(INITIAL_STUDENT_PROFILES);

  // Load saved preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('demo_current_user_id');
      if (saved) {
        setCurrentUserId(saved);
      }
    } catch {
      // Ignore in SSR
    }
    refreshUserData();
  }, []);

  const refreshUserData = async () => {
    try {
      const [resUsers, resExperts] = await Promise.all([
        fetch('/api/auth/users'),
        fetch('/api/experts'),
      ]);
      const dataUsers = await resUsers.json();
      const dataExperts = await resExperts.json();
      if (dataUsers.success) setAllUsers(dataUsers.users);
      if (dataExperts.success) setExpertProfiles(dataExperts.experts);
    } catch (err) {
      console.warn('API refresh silent fallback to initial data', err);
    }
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    try {
      localStorage.setItem('demo_current_user_id', userId);
    } catch {}
  };

  const currentUser: User =
    (allUsers && allUsers.length > 0
      ? allUsers.find((u) => u.id === currentUserId) || allUsers[0]
      : null) ||
    INITIAL_USERS.find((u) => u.id === currentUserId) ||
    INITIAL_USERS[0];
  const currentRole: UserRole = currentUser?.role || 'STUDENT';

  const expertProfile =
    currentRole === 'EXPERT'
      ? expertProfiles.find((p) => p.userId === currentUser?.id) || null
      : null;

  const studentProfile =
    currentRole === 'STUDENT'
      ? studentProfiles.find((p) => p.userId === currentUser?.id) || null
      : null;

  const isPendingApproval = expertProfile?.approvalStatus === 'PENDING';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        expertProfile,
        studentProfile,
        allUsers,
        isPendingApproval,
        switchUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
