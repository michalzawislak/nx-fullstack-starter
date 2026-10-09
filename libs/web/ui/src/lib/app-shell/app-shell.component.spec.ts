import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  it('renders the app name and a labelled navigation with one link per item', async () => {
    // Arrange
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('appName', 'Starter');
    fixture.componentRef.setInput('navItems', [
      { label: 'Home', path: '/', exact: true },
      { label: 'Account', path: '/account' },
    ]);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-name')?.textContent).toBe('Starter');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Main',
    );
    expect(
      [...element.querySelectorAll('nav a')].map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/', '/account']);
    expect(element.querySelector('main')).not.toBeNull();
  });
});
