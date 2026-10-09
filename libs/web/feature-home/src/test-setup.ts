import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';

import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// jsdom has no IntersectionObserver; @defer (on viewport) needs one. Content stays deferred in tests.
class TestIntersectionObserver {
  readonly observe = (): undefined => undefined;
  readonly unobserve = (): undefined => undefined;
  readonly disconnect = (): undefined => undefined;
  readonly takeRecords = (): [] => [];
}

globalThis.IntersectionObserver ??=
  TestIntersectionObserver as unknown as typeof IntersectionObserver;

setupTestBed();
