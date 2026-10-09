import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import {
  createPlatformTestingHandles,
  providePlatformTesting,
} from '@starter/web/core/platform';

import { App } from './app';

function setup(isAuthenticated: boolean) {
  const platform = createPlatformTestingHandles();
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      providePlatformTesting(platform),
      {
        provide: SessionService,
        useValue: { isAuthenticated: signal(isAuthenticated) },
      },
    ],
  });
  const fixture = TestBed.createComponent(App);
  return { fixture, platform };
}

describe('App', () => {
  it('shows the shell with navigation for signed-in users', async () => {
    // Arrange
    const { fixture } = setup(true);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-shell')).not.toBeNull();
    expect(
      [...element.querySelectorAll('nav a')].map((link) =>
        link.textContent?.trim(),
      ),
    ).toEqual(['Home', 'Account']);
  });

  it('renders pages without the shell for signed-out users', async () => {
    // Arrange
    const { fixture } = setup(false);

    // Act
    await fixture.whenStable();

    // Assert
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-shell'),
    ).toBeNull();
  });

  it('shows the offline banner when the network drops (FE-16)', async () => {
    // Arrange
    const { fixture, platform } = setup(false);
    await fixture.whenStable();

    // Act
    platform.network.setOnline(false);
    await fixture.whenStable();

    // Assert
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-offline-banner')
        ?.textContent,
    ).toContain('You are offline');
  });
});
