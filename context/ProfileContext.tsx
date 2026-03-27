import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profile, ChatPreferences, INITIAL_PROFILE, INITIAL_CHAT_PREFERENCES } from '../types';

interface ProfileContextType {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  chatPreferences: ChatPreferences;
  setChatPreferences: React.Dispatch<React.SetStateAction<ChatPreferences>>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [chatPreferences, setChatPreferences] = useState<ChatPreferences>(INITIAL_CHAT_PREFERENCES);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, chatPreferences, setChatPreferences }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
