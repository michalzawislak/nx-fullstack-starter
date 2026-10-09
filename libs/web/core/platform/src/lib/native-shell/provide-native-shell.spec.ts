import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import {
  createPlatformTestingHandles,
  type PlatformTestingHandles,
  providePlatformTesting,
} from '../testing/platform-testing';
import { provideNativeShell } from './provide-native-shell';

@Component({ template: '' })
class BlankPage {}

describe('provideNativeShell', () => {
  let platform: PlatformTestingHandles;
  let router: Router;
  let minimizeSpy: ReturnType<typeof vi.fn<() => Promise<void>>>;

  const setUp = async (rootPaths?: readonly string[]): Promise<void> => {
    platform = createPlatformTestingHandles();
    minimizeSpy = vi.fn(async () => undefined);
    Object.assign(platform.lifecycle, { minimize: minimizeSpy });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'login', component: BlankPage },
          { path: 'account', component: BlankPage },
          { path: 'account/settings', component: BlankPage },
        ]),
        providePlatformTesting(platform),
        provideNativeShell(rootPaths ? { rootPaths } : {}),
      ],
    });
    // The first inject runs the app initializers, as bootstrapping would.
    router = TestBed.inject(Router);
  };

  it('goes back in history on a nested screen (MOB-5)', async () => {
    // Arrange
    await setUp();
    const location = TestBed.inject(Location);
    const backSpy = vi.spyOn(location, 'back');
    await router.navigateByUrl('/account?tab=1');

    // Act
    platform.lifecycle.emit({ type: 'back-button', canGoBack: true });

    // Assert
    expect(backSpy).toHaveBeenCalledOnce();
    expect(minimizeSpy).not.toHaveBeenCalled();
  });

  it('minimises on a root screen or with no history (MOB-5)', async () => {
    // Arrange
    await setUp();
    await router.navigateByUrl('/login');

    // Act
    platform.lifecycle.emit({ type: 'back-button', canGoBack: true });
    await router.navigateByUrl('/account');
    platform.lifecycle.emit({ type: 'back-button', canGoBack: false });

    // Assert
    expect(minimizeSpy).toHaveBeenCalledTimes(2);
  });

  it('accepts custom root screens', async () => {
    // Arrange
    await setUp(['/account']);
    await router.navigateByUrl('/account');

    // Act
    platform.lifecycle.emit({ type: 'back-button', canGoBack: true });

    // Assert
    expect(minimizeSpy).toHaveBeenCalledOnce();
  });

  it('navigates to the path of a deep link (MOB-7)', async () => {
    // Arrange
    await setUp();

    // Act
    platform.lifecycle.emit({
      type: 'url-open',
      path: '/account/settings?x=1',
    });
    await new Promise((resolve) => setTimeout(resolve));

    // Assert
    expect(router.url).toBe('/account/settings?x=1');
  });

  it('styles the status bar, watches the keyboard and hides the splash after the first render (MOB-8, MOB-9)', async () => {
    // Arrange
    await setUp();

    const splashHiddenBeforeRender = platform.systemUi.splashScreenHideCount;

    // Act
    TestBed.tick();

    // Assert
    expect(platform.systemUi.statusBarStyleCount).toBe(1);
    expect(platform.systemUi.isKeepingFocusedFieldVisible).toBe(true);
    expect(splashHiddenBeforeRender).toBe(0);
    expect(platform.systemUi.splashScreenHideCount).toBe(1);
  });
});
