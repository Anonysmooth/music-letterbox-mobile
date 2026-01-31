import { storage, secureStorage } from './storage';
import { User } from '../types';

// Simple local authentication service
// In a real app, this would connect to a backend API
// For now, we store users locally with hashed passwords

const USERS_KEY = '@music_letterbox_users';

interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Simple hash function for demo purposes
// In production, use proper bcrypt on the server
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36) + str.length.toString(36);
};

const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

const getStoredUsers = async (): Promise<StoredUser[]> => {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  const data = await AsyncStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredUsers = async (users: StoredUser[]): Promise<void> => {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  async register(email: string, username: string, password: string): Promise<{ user: User; token: string }> {
    const users = await getStoredUsers();

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Un compte existe déjà avec cet email');
    }

    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      username,
      passwordHash: simpleHash(password),
      createdAt: now,
    };

    users.push(newUser);
    await saveStoredUsers(users);

    const token = generateToken();
    await secureStorage.setToken(token);

    const user: User = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      createdAt: newUser.createdAt,
    };

    await storage.saveUser(user);

    return { user, token };
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const users = await getStoredUsers();

    const storedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!storedUser) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (storedUser.passwordHash !== simpleHash(password)) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const token = generateToken();
    await secureStorage.setToken(token);

    const user: User = {
      id: storedUser.id,
      email: storedUser.email,
      username: storedUser.username,
      createdAt: storedUser.createdAt,
    };

    await storage.saveUser(user);

    return { user, token };
  },

  async logout(): Promise<void> {
    await secureStorage.removeToken();
    await storage.removeUser();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = await secureStorage.getToken();
    if (!token) return null;

    const user = await storage.getUser();
    return user;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await secureStorage.getToken();
    const user = await storage.getUser();
    return !!(token && user);
  },

  async updateProfile(updates: { username?: string; email?: string }): Promise<User> {
    const currentUser = await storage.getUser();
    if (!currentUser) {
      throw new Error('Non authentifié');
    }

    const users = await getStoredUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé');
    }

    if (updates.email && updates.email !== currentUser.email) {
      if (users.some(u => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== currentUser.id)) {
        throw new Error('Cet email est déjà utilisé');
      }
      users[userIndex].email = updates.email.toLowerCase();
    }

    if (updates.username && updates.username !== currentUser.username) {
      if (users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== currentUser.id)) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      users[userIndex].username = updates.username;
    }

    await saveStoredUsers(users);

    const updatedUser: User = {
      ...currentUser,
      email: users[userIndex].email,
      username: users[userIndex].username,
    };

    await storage.saveUser(updatedUser);
    return updatedUser;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = await storage.getUser();
    if (!currentUser) {
      throw new Error('Non authentifié');
    }

    const users = await getStoredUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé');
    }

    if (users[userIndex].passwordHash !== simpleHash(currentPassword)) {
      throw new Error('Mot de passe actuel incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    users[userIndex].passwordHash = simpleHash(newPassword);
    await saveStoredUsers(users);
  },

  async deleteAccount(): Promise<void> {
    const currentUser = await storage.getUser();
    if (!currentUser) {
      throw new Error('Non authentifié');
    }

    const users = await getStoredUsers();
    const filtered = users.filter(u => u.id !== currentUser.id);
    await saveStoredUsers(filtered);

    await storage.clearAll();
  },
};
