import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthStateService } from '../../application/services/auth-state.service';
import { UserRole } from '../../domain/models/user-role.model';

const mockLocalStorage = {
  getItem: () => null as string | null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

describe('authGuard', () => {
  let authState: AuthStateService;
  let router: Router;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
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

  it('should allow access when user is authenticated', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'tok',
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /login when user is NOT authenticated', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).not.toBe(true);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

describe('authGuard (SSR)', () => {
  it('should allow access during SSR', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: Router,
          useValue: { createUrlTree: vi.fn() },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
  });
});
