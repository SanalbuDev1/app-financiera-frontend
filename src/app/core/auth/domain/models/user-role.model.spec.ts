import { UserRole } from './user-role.model';

describe('UserRole', () => {
  it('should have ADMIN value', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
  });

  it('should have USER value', () => {
    expect(UserRole.USER).toBe('USER');
  });

  it('should only have two roles', () => {
    const values = Object.values(UserRole);
    expect(values).toHaveLength(2);
    expect(values).toContain('ADMIN');
    expect(values).toContain('USER');
  });
});
