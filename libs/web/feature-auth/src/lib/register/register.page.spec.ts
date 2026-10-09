import { TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import { ApiRequestError } from '@starter/web/core/http';

import { RegisterPage } from './register.page';

function setup(register: () => Promise<void>) {
  const session = { register: vi.fn(register) };
  TestBed.configureTestingModule({
    imports: [RegisterPage],
    providers: [
      provideRouter([]),
      { provide: SessionService, useValue: session },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigateByUrl')
    .mockResolvedValue(true);
  const fixture = TestBed.createComponent(RegisterPage);
  const element = fixture.nativeElement as HTMLElement;
  const fill = (email: string, password: string): void => {
    for (const [selector, value] of [
      ['input[type="email"]', email],
      ['input[type="password"]', password],
    ] as const) {
      const input = element.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  };
  const submit = async (): Promise<void> => {
    (element.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  };
  return { fixture, element, session, navigate, fill, submit };
}

describe('RegisterPage', () => {
  it('enforces the password rule from the shared contract', async () => {
    // Arrange
    const { fixture, element, session, fill, submit } = setup(
      async () => undefined,
    );
    await fixture.whenStable();

    // Act
    fill('jane@example.com', 'short');
    await submit();

    // Assert
    expect(session.register).not.toHaveBeenCalled();
    expect(element.textContent).toContain('At least 8 characters.');
    expect(
      element
        .querySelector('input[type="password"]')
        ?.getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('creates the account and goes home', async () => {
    // Arrange
    const { fixture, session, navigate, fill, submit } = setup(
      async () => undefined,
    );
    await fixture.whenStable();

    // Act
    fill('jane@example.com', 'correct-horse');
    await submit();

    // Assert
    expect(session.register).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('explains EMAIL_TAKEN', async () => {
    // Arrange
    const failure = new ApiRequestError({
      statusCode: 409,
      errorCode: 'EMAIL_TAKEN',
      message: 'raw',
    });
    const { fixture, element, fill, submit } = setup(async () =>
      Promise.reject(failure),
    );
    await fixture.whenStable();

    // Act
    fill('jane@example.com', 'correct-horse');
    await submit();

    // Assert
    expect(element.querySelector('.form-error')?.textContent).toContain(
      'already exists',
    );
  });
});
