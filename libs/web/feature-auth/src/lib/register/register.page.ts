import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
  PASSWORD_MIN_LENGTH,
  type RegisterRequest,
  registerRequestSchema,
} from '@starter/shared/contracts';

import { authErrorMessage } from '../shared/auth-error-message';

/** Registration page. Validates with the same Zod schema as the API (FE-25). */
@Component({
  selector: 'app-register-page',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    ButtonComponent,
    TextFieldComponent,
    FieldControlDirective,
  ],
  templateUrl: './register.page.html',
  styleUrl: '../shared/auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly passwordHint = `At least ${PASSWORD_MIN_LENGTH} characters.`;
  protected readonly submitError = signal<string | null>(null);
  protected readonly registerForm = form(
    signal<RegisterRequest>({ email: '', password: '' }),
    (path) => validateStandardSchema(path, registerRequestSchema),
    {
      submission: {
        action: async (field) => {
          this.submitError.set(null);

          try {
            await this.session.register(field().value());
            await this.router.navigateByUrl('/');
          } catch (error: unknown) {
            this.submitError.set(authErrorMessage(error));
          }

          return undefined;
        },
      },
    },
  );
}
