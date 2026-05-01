import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RegisterUseCase } from './register.use-case';
import { AuthStateService } from '../services/auth-state.service';
import { AUTH_PORT } from '../../infrastructure/tokens/auth.token';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/models/user-role.model';

const mockUser: User = {
  id: 'u2',
  email: 'new@test.com',
  name: 'New User',
  role: UserRole.USER,
  token: 'jwt-new-123',
};

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
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
        RegisterUseCase,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AUTH_PORT, useValue: authPortSpy },
        AuthStateService,
      ],
    });

    useCase = TestBed.inject(RegisterUseCase);
    authPort = TestBed.inject(AUTH_PORT);
    authState = TestBed.inject(AuthStateService);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call authPort.register with credentials', () => {
    authPort.register.mockReturnValue(of(mockUser));
    const creds = { name: 'New User', email: 'new@test.com', password: 'pass123' };

    useCase.execute(creds).subscribe();

    expect(authPort.register).toHaveBeenCalledWith(creds);
  });

  it('should update auth state on successful register', () => {
    authPort.register.mockReturnValue(of(mockUser));
    const spy = vi.spyOn(authState, 'setCurrentUser');

    useCase.execute({ name: 'New', email: 'new@test.com', password: 'pass123' }).subscribe();

    expect(spy).toHaveBeenCalledWith(mockUser);
  });

  it('should return the user on success', () => {
    authPort.register.mockReturnValue(of(mockUser));
    let result: User | undefined;

    useCase.execute({ name: 'New', email: 'new@test.com', password: 'pass123' }).subscribe(u => result = u);

    expect(result).toEqual(mockUser);
  });

  it('should propagate errors (e.g. email already exists)', () => {
    authPort.register.mockReturnValue(throwError(() => new Error('Email already exists')));
    let error: Error | undefined;

    useCase.execute({ name: 'Dup', email: 'dup@test.com', password: 'pass123' }).subscribe({
      error: (e) => error = e,
    });

    expect(error?.message).toBe('Email already exists');
  });

  it('should NOT update auth state on error', () => {
    authPort.register.mockReturnValue(throwError(() => new Error('fail')));
    const spy = vi.spyOn(authState, 'setCurrentUser');

    useCase.execute({ name: 'X', email: 'x@x.com', password: 'p' }).subscribe({ error: () => {} });

    expect(spy).not.toHaveBeenCalled();
  });
});
