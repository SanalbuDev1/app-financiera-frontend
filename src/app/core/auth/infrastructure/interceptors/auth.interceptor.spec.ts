import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthStateService } from '../../application/services/auth-state.service';
import { UserRole } from '../../domain/models/user-role.model';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authState: AuthStateService;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { storage = {}; },
      },
      writable: true, configurable: true,
    });
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: router },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization header when user is authenticated', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'my-jwt-token',
    });

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should NOT add Authorization header when no user is authenticated', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should NOT add Authorization header after logout', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'tok',
    });
    authState.clearCurrentUser();

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should restore token from localStorage when in-memory state is empty', () => {
    storage['currentUser'] = JSON.stringify({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'stored-token',
    });

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer stored-token');
    req.flush({});
  });

  it('should update token when backend returns a renewed Authorization header', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'old-token',
    });

    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    req.flush({}, { headers: { Authorization: 'Bearer renewed-token' } });

    expect(authState.currentUser()?.token).toBe('renewed-token');
  });

  it('should clear session and navigate to login on 401 from protected endpoint', () => {
    authState.setCurrentUser({
      id: 'u1', email: 'a@b.com', name: 'Test', role: UserRole.USER, token: 'old-token',
    });

    httpClient.get('/api/secure').subscribe({ error: () => {} });

    const req = httpTesting.expectOne('/api/secure');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authState.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
