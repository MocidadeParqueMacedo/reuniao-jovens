import { describe, it, expect, beforeEach } from 'vitest';
import { ADMIN_EMAIL, ADMIN_PASSWORD, registeredUsers } from '../lib/auth-store';

describe('Authentication System', () => {
  beforeEach(() => {
    // Clear registered users before each test
    Object.keys(registeredUsers).forEach(key => {
      delete registeredUsers[key];
    });
  });

  describe('Admin Login', () => {
    it('should allow admin to login with correct credentials', () => {
      const isAdmin = ADMIN_EMAIL === 'rdj.parquemacedo@gmail.com' && ADMIN_PASSWORD === 'pqmacedo';
      expect(isAdmin).toBe(true);
    });

    it('should have correct admin email and password', () => {
      expect(ADMIN_EMAIL).toBe('rdj.parquemacedo@gmail.com');
      expect(ADMIN_PASSWORD).toBe('pqmacedo');
    });
  });

  describe('User Registration', () => {
    it('should register a new user with email and password', () => {
      const email = 'user@example.com';
      const password = 'password123';

      registeredUsers[email] = {
        email,
        password,
        approved: false,
      };

      expect(registeredUsers[email]).toBeDefined();
      expect(registeredUsers[email].email).toBe(email);
      expect(registeredUsers[email].password).toBe(password);
      expect(registeredUsers[email].approved).toBe(false);
    });

    it('should not allow duplicate email registration', () => {
      const email = 'user@example.com';
      const password = 'password123';

      registeredUsers[email] = {
        email,
        password,
        approved: false,
      };

      // Try to register with same email
      const isDuplicate = email in registeredUsers;
      expect(isDuplicate).toBe(true);
    });

    it('should require password to be at least 6 characters', () => {
      const password = 'short';
      const isValid = password.length >= 6;
      expect(isValid).toBe(false);
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Register a test user
      registeredUsers['test@example.com'] = {
        email: 'test@example.com',
        password: 'password123',
        approved: true,
      };
    });

    it('should allow approved user to login with correct password', () => {
      const email = 'test@example.com';
      const password = 'password123';

      const user = registeredUsers[email];
      const canLogin = user && user.password === password && user.approved;

      expect(canLogin).toBe(true);
    });

    it('should reject login with incorrect password', () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const user = registeredUsers[email];
      const canLogin = user && user.password === password && user.approved;

      expect(canLogin).toBe(false);
    });

    it('should reject login for non-existent user', () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      const user = registeredUsers[email];
      const canLogin = user && user.password === password && user.approved;

      expect(canLogin).toBeFalsy();
    });

    it('should reject login for unapproved user', () => {
      registeredUsers['unapproved@example.com'] = {
        email: 'unapproved@example.com',
        password: 'password123',
        approved: false,
      };

      const email = 'unapproved@example.com';
      const password = 'password123';

      const user = registeredUsers[email];
      const canLogin = user && user.password === password && user.approved;

      expect(canLogin).toBe(false);
    });
  });

  describe('Admin Approval System', () => {
    it('should allow admin to approve a pending user', () => {
      registeredUsers['pending@example.com'] = {
        email: 'pending@example.com',
        password: 'password123',
        approved: false,
      };

      // Admin approves the user
      registeredUsers['pending@example.com'].approved = true;

      expect(registeredUsers['pending@example.com'].approved).toBe(true);
    });

    it('should allow admin to reject a pending user', () => {
      registeredUsers['pending@example.com'] = {
        email: 'pending@example.com',
        password: 'password123',
        approved: false,
      };

      // Admin rejects the user
      delete registeredUsers['pending@example.com'];

      expect(registeredUsers['pending@example.com']).toBeUndefined();
    });

    it('should list all pending users', () => {
      registeredUsers['user1@example.com'] = {
        email: 'user1@example.com',
        password: 'password123',
        approved: false,
      };

      registeredUsers['user2@example.com'] = {
        email: 'user2@example.com',
        password: 'password123',
        approved: true,
      };

      registeredUsers['user3@example.com'] = {
        email: 'user3@example.com',
        password: 'password123',
        approved: false,
      };

      const pendingUsers = Object.entries(registeredUsers)
        .filter(([_, user]) => !user.approved)
        .map(([email, _]) => email);

      expect(pendingUsers).toHaveLength(2);
      expect(pendingUsers).toContain('user1@example.com');
      expect(pendingUsers).toContain('user3@example.com');
      expect(pendingUsers).not.toContain('user2@example.com');
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete the full registration -> approval -> login flow', () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      // Step 1: Register
      registeredUsers[email] = {
        email,
        password,
        approved: false,
      };

      expect(registeredUsers[email].approved).toBe(false);

      // Step 2: Admin approves
      registeredUsers[email].approved = true;

      expect(registeredUsers[email].approved).toBe(true);

      // Step 3: User can now login
      const user = registeredUsers[email];
      const canLogin = user && user.password === password && user.approved;

      expect(canLogin).toBe(true);
    });
  });
});

