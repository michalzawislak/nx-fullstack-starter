import { TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import { ApiRequestError } from '@starter/web/core/http';

import { LoginPage } from './login.page';

function setup(login: () => Promise<void>) {
  const session = { login: vi.fn(login) };
  TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      provideRouter([]),
      { provide: SessionService, useValue: session },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigateByUrl')
    .mockResolvedValue(true);
  const fixture = TestBed.createComponent(LoginPage);
  const element = fixture.nativeElement as HTMLElement;
  const type = (selector: string, value: string): void => {
    const input = element.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = async (): Promise<void> => {
    (element.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  };
  return { fixture, element, session, navigate, type, submit };
}

describe('LoginPage', () => {
  it('does not call the API and shows schema errors for invalid input (FE-25)', async () => {
    // Arrange
    const { fixture, element, session, submit } = setup(async () => undefined);
    await fixture.whenStable();

    // Act
    await submit();

    // Assert
    expect(session.login).not.toHaveBeenCalled();
    expect(element.querySelectorAll('[aria-invalid="true"]').length).toBe(2);
  });

  it('signs in and goes to a safe return URL', async () => {
    // Arrange
    const { fixture, session, navigate, type, submit } = setup(
      async () => undefined,
    );
    fixture.componentRef.setInput('returnUrl', '/account');
    await fixture.whenStable();

    // Act
    type('input[type="email"]', 'jane@example.com');
    type('input[type="password"]', 'correct-horse');
    await submit();

    // Assert
    expect(session.login).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'correct-horse',
    });
    expect(navigate).toHaveBeenCalledWith('/account');
  });

  it('shows a message chosen by errorCode when the credentials are wrong', async () => {
    // Arrange
    const failure = new ApiRequestError({
      statusCode: 401,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'raw',
    });
    const { fixture, element, type, submit, navigate } = setup(async () =>
      Promise.reject(failure),
    );
    await fixture.whenStable();

    // Act
    type('input[type="email"]', 'jane@example.com');
    type('input[type="password"]', 'wrong');
    await submit();

    // Assert
    expect(element.querySelector('.form-error')?.textContent).toContain(
      'Incorrect email or password.',
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
