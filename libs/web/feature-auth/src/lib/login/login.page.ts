import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  form,
  FormField,
  FormRoot,
  validateStandardSchema,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '@starter/web/core/auth';
import {
  ButtonComponent,
  FieldControlDirective,
  TextFieldComponent,
} from '@starter/web/ui';

import {
  type LoginRequest,
  loginRequestSchema,
} from '@starter/shared/contracts';

import { authErrorMessage, safeReturnUrl } from '../shared/auth-error-message';

/** Sign-in page. Validates with the same Zod schema as the API (FE-25). */
@Component({
  selector: 'app-login-page',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    ButtonComponent,
    TextFieldComponent,
    FieldControlDirective,
  ],
  templateUrl: './login.page.html',
  styleUrl: '../shared/auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Bound from the query string by withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly submitError = signal<string | null>(null);
  protected readonly loginForm = form(
    signal<LoginRequest>({ email: '', password: '' }),
    (path) => validateStandardSchema(path, loginRequestSchema),
    {
      submission: {
        action: async (field) => {
          this.submitError.set(null);

          try {
            await this.session.login(field().value());
            await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
          } catch (error: unknown) {
            this.submitError.set(authErrorMessage(error));
          }

          return undefined;
        },
      },
    },
  );
}
