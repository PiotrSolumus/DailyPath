import { vi } from "vitest";

/**
 * Mock Supabase client for testing
 * Use this in tests that need to mock Supabase interactions
 */
export const createMockSupabaseClient = () => {
  return {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: null },
        unsubscribe: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  };
};

export const mockSupabaseClient = createMockSupabaseClient();
