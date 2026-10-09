import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MemoryKeyValueStorage } from './memory-key-value-storage';
import { WebKeyValueStorage } from './web-key-value-storage';

describe('MemoryKeyValueStorage', () => {
  it('stores, reads and removes values', async () => {
    // Arrange
    const storage = new MemoryKeyValueStorage();

    // Act
    await storage.set('theme', 'dark');
    const stored = await storage.get('theme');
    await storage.remove('theme');

    // Assert
    expect(stored).toBe('dark');
    expect(await storage.get('theme')).toBeNull();
  });
});

describe('WebKeyValueStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('persists values in localStorage', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [WebKeyValueStorage] });
    const storage = TestBed.inject(WebKeyValueStorage);

    // Act
    await storage.set('locale', 'pl');

    // Assert
    expect(
      TestBed.inject(DOCUMENT).defaultView?.localStorage.getItem('locale'),
    ).toBe('pl');
    expect(await storage.get('locale')).toBe('pl');
    await storage.remove('locale');
    expect(await storage.get('locale')).toBeNull();
  });

  it('degrades to "nothing stored" when localStorage throws', async () => {
    // Arrange
    const throwingStorage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    TestBed.configureTestingModule({
      providers: [
        WebKeyValueStorage,
        {
          provide: DOCUMENT,
          useValue: { defaultView: { localStorage: throwingStorage } },
        },
      ],
    });
    const storage = TestBed.inject(WebKeyValueStorage);

    // Act & Assert
    await expect(storage.set('key', 'value')).resolves.toBeUndefined();
    await expect(storage.get('key')).resolves.toBeNull();
    await expect(storage.remove('key')).resolves.toBeUndefined();
  });
});
