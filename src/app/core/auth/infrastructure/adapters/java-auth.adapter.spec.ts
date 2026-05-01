import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { JavaAuthAdapter } from './java-auth.adapter';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/models/user-role.model';

const mockUser: User = {
  id: 'u1',
  email: 'test@test.com',
  name: 'Test User',
  role: UserRole.USER,
  token: 'jwt-token-123',
};

describe('JavaAuthAdapter', () => {
  let adapter: JavaAuthAdapter;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JavaAuthAdapter,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    adapter = TestBed.inject(JavaAuthAdapter);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  describe('login', () => {
    it('should make POST request to /api/auth/login', () => {
      const creds = { email: 'test@test.com', password: 'pass123' };
      let result: User | undefined;

      adapter.login(creds).subscribe(u => result = u);

      const req = httpTesting.expectOne('http://localhost:9000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(creds);
      req.flush(mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should propagate HTTP errors', () => {
      const creds = { email: 'bad@test.com', password: 'wrong' };
      let error: any;

      adapter.login(creds).subscribe({ error: (e) => error = e });

      const req = httpTesting.expectOne('http://localhost:9000/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(error.status).toBe(401);
    });
  });

  describe('register', () => {
    it('should make POST request to /api/auth/register', () => {
      const creds = { name: 'New User', email: 'new@test.com', password: 'pass123' };
      let result: User | undefined;

      adapter.register(creds).subscribe(u => result = u);

      const req = httpTesting.expectOne('http://localhost:9000/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(creds);
      req.flush(mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should propagate 409 conflict errors', () => {
      const creds = { name: 'Dup', email: 'dup@test.com', password: 'pass123' };
      let error: any;

      adapter.register(creds).subscribe({ error: (e) => error = e });

      const req = httpTesting.expectOne('http://localhost:9000/api/auth/register');
      req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });

      expect(error.status).toBe(409);
    });
  });

  describe('logout', () => {
    it('should not throw', () => {
      expect(() => adapter.logout()).not.toThrow();
    });
  });
});
