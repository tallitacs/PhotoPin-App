// src/data/models/user/client/User.ts

export interface UserPreferences {
  autoClusterEnabled: boolean;
  clusterDistance: number;
  clusterTimeWindow: number;
  defaultPrivacy: 'private' | 'shared' | 'public';
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  autoBackup: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePhotoUrl?: string;
  accountCreated: Date;
  lastLogin: Date;
  storageUsage: number;
  photoCount: number;
  albumCount: number;
  clusterCount: number;
  accountTier: 'free' | 'premium' | 'pro';
  preferences: UserPreferences;
}

export class UserModel {
  static toFirestore(user: User): any {
    return {
      email: user.email,
      displayName: user.displayName,
      profilePhotoUrl: user.profilePhotoUrl,
      accountCreated: user.accountCreated,
      lastLogin: user.lastLogin,
      storageUsage: user.storageUsage,
      photoCount: user.photoCount,
      albumCount: user.albumCount,
      clusterCount: user.clusterCount,
      accountTier: user.accountTier,
      preferences: user.preferences
    };
  }

  static createDefaultPreferences(): UserPreferences {
    return {
      autoClusterEnabled: true,
      clusterDistance: 50,
      clusterTimeWindow: 24,
      defaultPrivacy: 'private',
      theme: 'light',
      emailNotifications: true,
      autoBackup: false
    };
  }

  static createNewUser(email: string, displayName: string): User {
    return {
      id: '', // Will be set by Firebase
      email,
      displayName,
      accountCreated: new Date(),
      lastLogin: new Date(),
      storageUsage: 0,
      photoCount: 0,
      albumCount: 0,
      clusterCount: 0,
      accountTier: 'free',
      preferences: this.createDefaultPreferences()
    };
  }
}