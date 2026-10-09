import { TestBed } from '@angular/core/testing';

import { NativeNetworkStatus } from './native-network-status';

const network = vi.hoisted(() => ({
  connected: false,
  listener: null as ((status: { connected: boolean }) => void) | null,
  removeCount: 0,
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: async () => ({ connected: network.connected }),
    addListener: async (
      _event: string,
      listener: (status: { connected: boolean }) => void,
    ) => {
      network.listener = listener;
      return {
        remove: async () => {
          network.removeCount += 1;
        },
      };
    },
  },
}));

describe('NativeNetworkStatus', () => {
  beforeEach(() => {
    network.connected = false;
    network.listener = null;
    network.removeCount = 0;
  });

  it('reads the initial status and follows changes', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [NativeNetworkStatus] });
    const status = TestBed.inject(NativeNetworkStatus);
    const beforeNativeAnswer = status.isOnline();

    // Act
    await Promise.resolve();
    const afterNativeAnswer = status.isOnline();
    network.listener?.({ connected: true });

    // Assert
    expect(beforeNativeAnswer).toBe(true);
    expect(afterNativeAnswer).toBe(false);
    expect(status.isOnline()).toBe(true);
  });

  it('removes the native listener when the injector is destroyed', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [NativeNetworkStatus] });
    TestBed.inject(NativeNetworkStatus);

    // Act
    TestBed.resetTestingModule();
    await Promise.resolve();
    await Promise.resolve();

    // Assert
    expect(network.removeCount).toBe(1);
  });
});
