import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { LoginComponent } from './login.component';
import { LoginUseCase } from '../../core/auth/application/use-cases/login.use-case';
import { UserRole } from '../../core/auth/domain/models/user-role.model';
import { of, throwError } from 'rxjs';
import { User } from '../../core/auth/domain/models/user.model';

const mockUser: User = { id: 'u1', email: 'test@t.com', name: 'Test', role: UserRole.USER, token: 'tok' };
const mockAdmin: User = { id: 'a1', email: 'admin@t.com', name: 'Admin', role: UserRole.ADMIN, token: 'tok' };

describe('LoginComponent', () => {
  let component: LoginComponent;
  let loginUseCase: any;
  let router: any;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    loginUseCase = { execute: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(loginUseCase.execute).not.toHaveBeenCalled();
  });

  it('should mark form as touched on invalid submit', () => {
    component.onSubmit();
    expect(component.loginForm.get('email')?.touched).toBe(true);
    expect(component.loginForm.get('password')?.touched).toBe(true);
  });

  it('should call loginUseCase with form values', () => {
    loginUseCase.execute.mockReturnValue(of(mockUser));
    component.loginForm.setValue({ email: 'test@t.com', password: 'pass123' });

    component.onSubmit();

    expect(loginUseCase.execute).toHaveBeenCalledWith({ email: 'test@t.com', password: 'pass123' });
  });

  it('should navigate to /dashboard for USER role', () => {
    loginUseCase.execute.mockReturnValue(of(mockUser));
    component.loginForm.setValue({ email: 'test@t.com', password: 'pass123' });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /admin for ADMIN role', () => {
    loginUseCase.execute.mockReturnValue(of(mockAdmin));
    component.loginForm.setValue({ email: 'admin@t.com', password: 'admin123' });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should set errorMessage on login failure', () => {
    loginUseCase.execute.mockReturnValue(throwError(() => new Error('Invalid credentials')));
    component.loginForm.setValue({ email: 'bad@t.com', password: 'wrong1' });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.isLoading()).toBe(false);
  });

  it('should set isLoading during login', () => {
    loginUseCase.execute.mockReturnValue(of(mockUser));
    component.loginForm.setValue({ email: 'test@t.com', password: 'pass123' });

    component.onSubmit();

    // After completion, loading should be false
    expect(component.isLoading()).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
  });

  describe('form validation', () => {
    it('should require email', () => {
      component.loginForm.patchValue({ email: '', password: 'pass123' });
      expect(component.loginForm.get('email')?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      component.loginForm.patchValue({ email: 'not-an-email', password: 'pass123' });
      expect(component.loginForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should require password with min length 6', () => {
      component.loginForm.patchValue({ email: 'a@b.com', password: '12345' });
      expect(component.loginForm.get('password')?.hasError('minlength')).toBe(true);
    });
  });
});
