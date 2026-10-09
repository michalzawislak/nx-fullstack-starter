import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { currentUserResource } from '../current-user';

/** Example screen after sign-in. Replace with the first real screen of the app. */
@Component({
  selector: 'app-home-page',
  imports: [DatePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly user = currentUserResource();
}
