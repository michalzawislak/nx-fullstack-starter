import { TestBed } from '@angular/core/testing';

import { APP_LIFECYCLE } from './lifecycle/app-lifecycle';
import { WebAppLifecycle } from './lifecycle/web-app-lifecycle';
import { NETWORK_STATUS } from './network/network-status';
import { WebNetworkStatus } from './network/web-network-status';
import { PLATFORM_INFO } from './platform-info/platform-info';
import { providePlatform } from './provide-platform';
import { KEY_VALUE_STORAGE, SECURE_STORAGE } from './storage/key-value-storage';
import { MemoryKeyValueStorage } from './storage/memory-key-value-storage';
import { WebKeyValueStorage } from './storage/web-key-value-storage';
import {
  createPlatformTestingHandles,
  providePlatformTesting,
} from './testing/platform-testing';

describe('providePlatform', () => {
  it('registers the web implementations', () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [providePlatform()] });

    // Act
    const platformInfo = TestBed.inject(PLATFORM_INFO);

    // Assert
    expect(platformInfo.platform()).toBe('web');
    expect(platformInfo.isNative()).toBe(false);
    expect(TestBed.inject(KEY_VALUE_STORAGE)).toBeInstanceOf(
      WebKeyValueStorage,
    );
    expect(TestBed.inject(SECURE_STORAGE)).toBeInstanceOf(
      MemoryKeyValueStorage,
    );
    expect(TestBed.inject(NETWORK_STATUS)).toBeInstanceOf(WebNetworkStatus);
    expect(TestBed.inject(APP_LIFECYCLE)).toBeInstanceOf(WebAppLifecycle);
  });
});

describe('providePlatformTesting', () => {
  it('exposes controllable fakes for every token', () => {
    // Arrange
    const handles = createPlatformTestingHandles();
    TestBed.configureTestingModule({
      providers: [providePlatformTesting(handles)],
    });
    const lifecycleEvents: string[] = [];
    TestBed.inject(APP_LIFECYCLE).events.subscribe((event) =>
      lifecycleEvents.push(event.type),
    );

    // Act
    handles.network.setOnline(false);
    handles.platformInfo.setPlatform('android');
    handles.lifecycle.emit({ type: 'resume' });

    // Assert
    expect(TestBed.inject(NETWORK_STATUS).isOnline()).toBe(false);
    expect(TestBed.inject(PLATFORM_INFO).platform()).toBe('android');
    expect(TestBed.inject(PLATFORM_INFO).isNative()).toBe(true);
    expect(TestBed.inject(SECURE_STORAGE)).toBe(handles.secureStorage);
    expect(lifecycleEvents).toEqual(['resume']);
  });
});
