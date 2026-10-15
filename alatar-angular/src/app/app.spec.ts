import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { SocialSidebarComponent } from './components/social-sidebar/social-sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { App } from './app';

@Component({ selector: 'app-social-sidebar', template: '' })
class SocialSidebarStub {}
@Component({ selector: 'app-footer', template: '' })
class FooterStub {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).overrideComponent(App, {
      remove: { imports: [SocialSidebarComponent, FooterComponent] },
      add: { imports: [SocialSidebarStub, FooterStub] },
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
