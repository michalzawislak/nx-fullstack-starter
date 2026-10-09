import { NativeKeyValueStorage } from './native-key-value-storage';

const preferences = vi.hoisted(() => new Map<string, string>());

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({
      value: preferences.get(key) ?? null,
    }),
    set: async ({ key, value }: { key: string; value: string }) => {
      preferences.set(key, value);
    },
    remove: async ({ key }: { key: string }) => {
      preferences.delete(key);
    },
  },
}));

describe('NativeKeyValueStorage', () => {
  beforeEach(() => preferences.clear());

  it('stores, reads and removes values through Preferences', async () => {
    // Arrange
    const storage = new NativeKeyValueStorage();

    // Act
    await storage.set('theme', 'dark');
    const stored = await storage.get('theme');
    await storage.remove('theme');

    // Assert
    expect(stored).toBe('dark');
    expect(await storage.get('theme')).toBeNull();
  });
});
