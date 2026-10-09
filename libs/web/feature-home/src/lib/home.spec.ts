import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';

import { provideRouter, Router } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import { ApiClient } from '@starter/web/core/http';

import { AccountPage } from './account/account.page';
import { HomePage } from './home/home.page';

const user = {
  id: '7b0c6f0e-3c1a-4a51-9a8e-2f0f2a7c9d11',
  email: 'jane@example.com',
  createdAt: '2026-10-09T08:00:00.000Z',
};

function setup(request: () => unknown, logout = vi.fn(async () => undefined)) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ApiClient, useValue: { request: vi.fn(request) } },
      { provide: SessionService, useValue: { logout } },
    ],
  });
  return {
    logout,
    navigate: vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true),
  };
}

describe('HomePage', () => {
  it('greets the signed-in user with data from GET /v1/users/me', async () => {
    // Arrange
    setup(() => of(user));
    const fixture = TestBed.createComponent(HomePage);

    // Act
    await fixture.whenStable();

    // Assert
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'jane@example.com',
    );
  });

  it('shows an error when the profile cannot be loaded', async () => {
    // Arrange
    setup(() => throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(HomePage);

    // Act
    await fixture.whenStable();

    // Assert
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')
        ?.textContent,
    ).toContain('could not be loaded');
  });
});

describe('AccountPage', () => {
  it('signs out and returns to the login page', async () => {
    // Arrange
    const { logout, navigate } = setup(() => of(user));
    const fixture = TestBed.createComponent(AccountPage);
    await fixture.whenStable();

    // Act
    (
      (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
