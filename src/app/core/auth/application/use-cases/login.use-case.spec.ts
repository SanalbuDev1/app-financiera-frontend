import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginUseCase } from './login.use-case';
import { AuthStateService } from '../services/auth-state.service';
import { AUTH_PORT } from '../../infrastructure/tokens/auth.token';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/models/user-role.model';

const mockUser: User = {
  id: 'u1',
  email: 'test@test.com',
  name: 'Test',
  role: UserRole.USER,
  token: 'jwt-123',
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let authPort: any;
  let authState: AuthStateService;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    const authPortSpy = {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginUseCase,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AUTH_PORT, useValue: authPortSpy },
        AuthStateService,
      ],
    });

    useCase = TestBed.inject(LoginUseCase);
    authPort = TestBed.inject(AUTH_PORT) as any;
    authState = TestBed.inject(AuthStateService);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call authPort.login with credentials', () => {
    authPort.login.mockReturnValue(of(mockUser));
    const creds = { email: 'test@test.com', password: 'pass123' };

    useCase.execute(creds).subscribe();

    expect(authPort.login).toHaveBeenCalledWith(creds);
  });

  it('should update auth state on successful login', () => {
    authPort.login.mockReturnValue(of(mockUser));
    const spy = vi.spyOn(authState, 'setCurrentUser');

    useCase.execute({ email: 'test@test.com', password: 'pass123' }).subscribe();

    expect(spy).toHaveBeenCalledWith(mockUser);
  });

  it('should return the user on success', () => {
    authPort.login.mockReturnValue(of(mockUser));
    let result: User | undefined;

    useCase.execute({ email: 'test@test.com', password: 'pass123' }).subscribe(u => result = u);

    expect(result).toEqual(mockUser);
  });

  it('should propagate errors from the port', () => {
    authPort.login.mockReturnValue(throwError(() => new Error('Invalid credentials')));
    let error: Error | undefined;

    useCase.execute({ email: 'bad@test.com', password: 'wrong' }).subscribe({
      error: (e) => error = e,
    });

    expect(error?.message).toBe('Invalid credentials');
  });

  it('should NOT update auth state on error', () => {
    authPort.login.mockReturnValue(throwError(() => new Error('fail')));
    const spy = vi.spyOn(authState, 'setCurrentUser');

    useCase.execute({ email: 'bad@test.com', password: 'wrong' }).subscribe({ error: () => {} });

    expect(spy).not.toHaveBeenCalled();
  });
});
