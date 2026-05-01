import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { RegisterComponent } from './register.component';
import { RegisterUseCase } from '../../core/auth/application/use-cases/register.use-case';
import { of, throwError } from 'rxjs';
import { User } from '../../core/auth/domain/models/user.model';
import { UserRole } from '../../core/auth/domain/models/user-role.model';

const mockUser: User = { id: 'u1', email: 'new@t.com', name: 'New', role: UserRole.USER, token: 'tok' };

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let registerUseCase: any;
  let router: any;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    registerUseCase = { execute: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: RegisterUseCase, useValue: registerUseCase },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.registerForm.get('name')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(registerUseCase.execute).not.toHaveBeenCalled();
  });

  it('should call registerUseCase with correct data on valid submit', () => {
    registerUseCase.execute.mockReturnValue(of(mockUser));
    component.registerForm.setValue({
      name: 'New User', email: 'new@t.com', password: 'pass123', confirmPassword: 'pass123',
    });

    component.onSubmit();

    expect(registerUseCase.execute).toHaveBeenCalledWith({
      name: 'New User', email: 'new@t.com', password: 'pass123',
    });
  });

  it('should navigate to /dashboard on success', () => {
    registerUseCase.execute.mockReturnValue(of(mockUser));
    component.registerForm.setValue({
      name: 'New', email: 'new@t.com', password: 'pass123', confirmPassword: 'pass123',
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set errorMessage on failure', () => {
    registerUseCase.execute.mockReturnValue(throwError(() => new Error('Email already exists')));
    component.registerForm.setValue({
      name: 'Dup', email: 'dup@t.com', password: 'pass123', confirmPassword: 'pass123',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Email already exists');
    expect(component.isLoading()).toBe(false);
  });

  describe('form validation', () => {
    it('should require name with min length 2', () => {
      component.registerForm.patchValue({ name: 'X' });
      expect(component.registerForm.get('name')?.hasError('minlength')).toBe(true);
    });

    it('should require valid email', () => {
      component.registerForm.patchValue({ email: 'invalid' });
      expect(component.registerForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should require password with min length 6', () => {
      component.registerForm.patchValue({ password: '12345' });
      expect(component.registerForm.get('password')?.hasError('minlength')).toBe(true);
    });

    it('should validate password match (cross-field validator)', () => {
      component.registerForm.setValue({
        name: 'Test', email: 'a@b.com', password: 'pass123', confirmPassword: 'different',
      });
      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should be valid when passwords match', () => {
      component.registerForm.setValue({
        name: 'Test', email: 'a@b.com', password: 'pass123', confirmPassword: 'pass123',
      });
      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
      expect(component.registerForm.valid).toBe(true);
    });
  });

  describe('password visibility toggles', () => {
    it('should toggle showPassword', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePassword();
      expect(component.showPassword()).toBe(true);
    });

    it('should toggle showConfirmPassword', () => {
      expect(component.showConfirmPassword()).toBe(false);
      component.toggleConfirmPassword();
      expect(component.showConfirmPassword()).toBe(true);
    });
  });
});
