import { CompanyProfile } from "../types";

const STORAGE_KEY = 'recruitai_profile';

export const saveProfile = (profile: CompanyProfile): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const getProfile = (): CompanyProfile | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as CompanyProfile;
  } catch (e) {
    console.error("Failed to parse profile", e);
    return null;
  }
};

export const clearProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};