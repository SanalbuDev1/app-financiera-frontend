import { getCategoryIcon, CATEGORY_ICONS, TransactionCategory } from './transaction.model';

describe('Transaction Model', () => {
  describe('CATEGORY_ICONS', () => {
    it('should have icons for all 12 categories', () => {
      const categories: TransactionCategory[] = [
        'food', 'transport', 'entertainment', 'health', 'education',
        'shopping', 'bills', 'salary', 'freelance', 'investment', 'savings', 'other',
      ];
      expect(Object.keys(CATEGORY_ICONS)).toHaveLength(12);
      for (const cat of categories) {
        expect(CATEGORY_ICONS[cat]).toBeDefined();
      }
    });
  });

  describe('getCategoryIcon', () => {
    it('should return correct icon for known categories', () => {
      expect(getCategoryIcon('food')).toBe('🍽️');
      expect(getCategoryIcon('salary')).toBe('💰');
      expect(getCategoryIcon('bills')).toBe('🧾');
    });

    it('should return fallback icon for unknown category', () => {
      expect(getCategoryIcon('unknown' as TransactionCategory)).toBe('📦');
    });
  });
});
