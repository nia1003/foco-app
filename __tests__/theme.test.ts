import { Colors, Radius, Spacing } from '@/constants/theme';

describe('theme tokens', () => {
  it('keeps Phase 0 radius values aligned with the UI checklist', () => {
    expect(Radius.full).toBe(9999);
    expect(Radius['2xl']).toBe(24);
    expect(Radius.lg).toBe(16);
  });

  it('keeps Phase 0 spacing values aligned with the UI checklist', () => {
    expect(Spacing.md).toBe(8);
    expect(Spacing.sm).toBe(6);
  });

  it('uses the current Liquid Glass palette aliases', () => {
    expect(Colors.primary).toBe('#1a1622');
    expect(Colors.primaryBlue).toBe('#203F9A');
    expect(Colors.background).toBe('#EFE8E0');
  });
});
