import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { CompanyProfile } from '../types';

export interface UserProfile extends CompanyProfile {
    uid: string;
    role?: string;
    onboardingComplete: boolean;
    createdAt: number;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const createUserProfile = async (uid: string, email: string, name?: string): Promise<UserProfile> => {
    const newProfile: UserProfile = {
        uid,
        email,
        name: name || '',
        location: '',
        industry: 'Technology',
        role: '',
        onboardingComplete: false,
        createdAt: Date.now()
    };

    try {
        await setDoc(doc(db, 'users', uid), newProfile);
        return newProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};
