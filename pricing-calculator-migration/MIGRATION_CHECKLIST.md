# Migration Checklist

Use this checklist to ensure a smooth migration of the pricing calculator.

## Pre-Migration

- [ ] Review all files in the migration package
- [ ] Understand the component structure and dependencies
- [ ] Identify your project's equivalent components (Button, etc.)

## File Setup

- [ ] Copy `PricingCalculator.tsx` to your components directory
- [ ] Copy `Button.tsx` to your components directory (or adapt existing Button)
- [ ] Copy `ModuleVisuals.tsx` to your components directory
- [ ] Add `pricing-calculator.css` styles to your global CSS

## Dependencies

- [ ] Verify React 18+ is installed
- [ ] Verify TypeScript is configured
- [ ] Verify Tailwind CSS is installed and configured
- [ ] Add `primary` color to Tailwind config if not present
- [ ] Install Next.js Image component (if using Next.js) or replace with standard img tag

## Code Updates

- [ ] Update import paths in `PricingCalculator.tsx`
- [ ] Update import paths in `ModuleVisuals.tsx` (if needed)
- [ ] Replace Next.js Image component (if not using Next.js)
- [ ] Update CTA/demo booking URLs
- [ ] Customize pricing tiers (`PRICING_TIERS`)
- [ ] Customize modules list (`MODULES`)
- [ ] Update pricing constants (discounts, tax rate, etc.)
- [ ] Update currency formatting (if needed)
- [ ] Customize business function colors (if needed)

## Styling

- [ ] Verify Tailwind utilities are available
- [ ] Test responsive breakpoints
- [ ] Verify slider styles are applied
- [ ] Check color scheme matches your brand
- [ ] Test dark mode compatibility (if applicable)

## Testing

- [ ] Test user slider functionality
- [ ] Test module selection/deselection
- [ ] Test discount toggles
- [ ] Test payment frequency selection
- [ ] Verify calculations are correct
- [ ] Test quote copy functionality
- [ ] Test step navigation
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test in different browsers
- [ ] Verify accessibility (keyboard navigation, screen readers)

## Integration

- [ ] Integrate into your pricing page
- [ ] Add any required page-level components (Header, Footer, etc.)
- [ ] Update routing (if needed)
- [ ] Add analytics tracking (if desired)
- [ ] Test end-to-end user flow

## Post-Migration

- [ ] Remove unused code/comments
- [ ] Update documentation
- [ ] Deploy to staging environment
- [ ] Perform QA testing
- [ ] Deploy to production

## Customization Notes

Document any customizations you make:
- Pricing structure changes: ________________
- Module changes: ________________
- Styling changes: ________________
- Feature additions: ________________

