import { User } from '../models/User';
import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { SEED_USERS } from '../seed/seedData';
import { DEV_USERS } from '../../auth/devAuthProvider';

const USERS_STORAGE_KEY = 'users';

export class UserRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<User[]> {
    const existing = await this.storage.getItem<User[]>(USERS_STORAGE_KEY);
    if (existing !== null && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(USERS_STORAGE_KEY, SEED_USERS);
    return SEED_USERS;
  }

  async getUsers(): Promise<User[]> {
    return this.ensureInitialized();
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.ensureInitialized();
    return users.find((u) => u.id === id) || null;
  }

  async updateUserAssignments(userId: string, assignedMineIds: string[]): Promise<User> {
    const users = await this.ensureInitialized();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const updatedUser: User = {
      ...users[index],
      assignedMineIds,
    };

    users[index] = updatedUser;
    await this.storage.setItem(USERS_STORAGE_KEY, users);

    // Sync with in-memory DEV_USERS so quickSwitchRole and current session pick it up immediately
    const devRecord = Object.values(DEV_USERS).find(
      (d) => d.user.id === userId || d.user.email.toLowerCase() === updatedUser.email.toLowerCase()
    );
    if (devRecord) {
      devRecord.user.mineIds = [...assignedMineIds];
    }

    return updatedUser;
  }

  async resetUsers(): Promise<void> {
    await this.storage.setItem(USERS_STORAGE_KEY, SEED_USERS);
    // Reset in-memory DEV_USERS
    SEED_USERS.forEach((su) => {
      const dev = Object.values(DEV_USERS).find((d) => d.user.id === su.id);
      if (dev) {
        dev.user.mineIds = [...su.assignedMineIds];
      }
    });
  }
}

export const userRepository = new UserRepository();
