import {
  INSTALL_MARKER_KEY,
  NativeSecureStorage,
} from './native-secure-storage';

const native = vi.hoisted(() => ({
  preferences: new Map<string, string>(),
  keychain: new Map<string, unknown>(),
  unreadableKeys: new Set<string>(),
  calls: [] as string[],
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({
      value: native.preferences.get(key) ?? null,
    }),
    set: async ({ key, value }: { key: string; value: string }) => {
      native.preferences.set(key, value);
    },
  },
}));

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  KeychainAccess: { whenUnlockedThisDeviceOnly: 1 },
  SecureStorage: {
    setSynchronize: async (sync: boolean) => {
      native.calls.push(`setSynchronize:${sync}`);
    },
    setKeyPrefix: async (prefix: string) => {
      native.calls.push(`setKeyPrefix:${prefix}`);
    },
    clear: async () => {
      native.calls.push('clear');
      native.keychain.clear();
    },
    get: async (key: string) => {
      if (native.unreadableKeys.has(key)) {
        throw new Error('invalidData');
      }
      return native.keychain.get(key) ?? null;
    },
    set: async (
      key: string,
      data: unknown,
      _convertDate: boolean,
      _sync: boolean,
      access: number,
    ) => {
      native.calls.push(`set:${key}:access=${access}`);
      native.keychain.set(key, data);
    },
    remove: async (key: string) => {
      native.unreadableKeys.delete(key);
      return native.keychain.delete(key);
    },
  },
}));

describe('NativeSecureStorage', () => {
  beforeEach(() => {
    native.preferences.clear();
    native.keychain.clear();
    native.unreadableKeys.clear();
    native.calls.length = 0;
  });

  it('stores device-only entries without iCloud synchronisation', async () => {
    // Arrange
    const storage = new NativeSecureStorage();

    // Act
    await storage.set('auth.refresh-token', 'secret');
    const stored = await storage.get('auth.refresh-token');

    // Assert
    expect(stored).toBe('secret');
    expect(native.calls).toEqual([
      'setSynchronize:false',
      'setKeyPrefix:starter.',
      'clear',
      'set:auth.refresh-token:access=1',
    ]);
  });

  it('wipes entries left in the Keychain by a previous installation', async () => {
    // Arrange
    native.keychain.set('auth.refresh-token', 'from-before-reinstall');
    const storage = new NativeSecureStorage();

    // Act
    const stored = await storage.get('auth.refresh-token');

    // Assert
    expect(stored).toBeNull();
    expect(native.preferences.get(INSTALL_MARKER_KEY)).toBe('1');
  });

  it('keeps entries when the install marker exists', async () => {
    // Arrange
    native.preferences.set(INSTALL_MARKER_KEY, '1');
    native.keychain.set('auth.refresh-token', 'kept');
    const storage = new NativeSecureStorage();

    // Act
    const stored = await storage.get('auth.refresh-token');

    // Assert
    expect(stored).toBe('kept');
    expect(native.calls).not.toContain('clear');
  });

  it('reads an unreadable or non-string entry as missing and removes it', async () => {
    // Arrange
    native.preferences.set(INSTALL_MARKER_KEY, '1');
    native.keychain.set('broken', 'ciphertext');
    native.unreadableKeys.add('broken');
    native.keychain.set('number', 42);
    const storage = new NativeSecureStorage();

    // Act
    const broken = await storage.get('broken');
    const number = await storage.get('number');

    // Assert
    expect(broken).toBeNull();
    expect(number).toBeNull();
    expect(native.keychain.has('broken')).toBe(false);
  });

  it('prepares the plugin only once', async () => {
    // Arrange
    const storage = new NativeSecureStorage();

    // Act
    await Promise.all([
      storage.get('a'),
      storage.get('b'),
      storage.remove('c'),
    ]);

    // Assert
    expect(
      native.calls.filter((call) => call.startsWith('setKeyPrefix')),
    ).toHaveLength(1);
  });
});
