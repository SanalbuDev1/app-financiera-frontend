import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthStateService } from '../../application/services/auth-state.service';
import { UserRole } from '../../domain/models/user-role.model';

describe('roleGuard', () => {
  let authState: AuthStateService;
  let router: Router;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: Router,
          useValue: {
            createUrlTree: vi.fn((segments: string[]) => ({ toString: () => segments.join('/') } as unknown as UrlTree)),
          },
        },
      ],
    });
    authState = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should allow access when user has the required role', () => {
    authState.setCurrentUser({
      id: 'a1', email: 'admin@t.com', name: 'Admin', role: UserRole.ADMIN, token: 'tok',
    });

    const guard = roleGuard(UserRole.ADMIN);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user does NOT have required role', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'user@t.com', name: 'User', role: UserRole.USER, token: 'tok',
    });

    const guard = roleGuard(UserRole.ADMIN);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect when no user is logged in', () => {
    const guard = roleGuard(UserRole.ADMIN);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
