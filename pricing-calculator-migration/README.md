# Pricing Calculator Migration Package

This package contains all files needed to migrate the real-time pricing calculator to another website.

## 📦 Files Included

- **PricingCalculator.tsx** - Main pricing calculator component
- **Button.tsx** - Button component dependency
- **ModuleVisuals.tsx** - Module visualization components
- **pricing-calculator.css** - CSS styles for the pricing slider
- **example-usage.tsx** - Example implementation (reference)

## 🔧 Dependencies

### Required React/Next.js Dependencies
- React 18+
- Next.js 13+ (for Image component in ModuleVisuals)
- TypeScript

### Required CSS Framework
- **Tailwind CSS** - The entire component uses Tailwind utility classes
- The component relies heavily on Tailwind's design system (colors, spacing, etc.)

### External Dependencies
- `next/image` - Used in ModuleVisuals.tsx for QR code image
- The component uses SVG icons inline (no external icon library)

## 📋 Migration Steps

### 1. Copy Files
Copy all files from this directory to your project:
- `PricingCalculator.tsx` → Your components directory
- `Button.tsx` → Your components directory (or adapt to your existing Button component)
- `ModuleVisuals.tsx` → Your components directory
- `pricing-calculator.css` → Your global CSS file or import separately

### 2. Update Imports

#### In PricingCalculator.tsx:
```typescript
// Update these imports based on your project structure:
import Button from "./Button";  // Adjust path as needed
import { getModuleVisual } from "./ModuleVisuals";  // Adjust path as needed
```

#### In ModuleVisuals.tsx:
```typescript
// If not using Next.js, replace:
import Image from "next/image";
// With your image component or standard img tag
```

### 3. CSS Integration

Add the styles from `pricing-calculator.css` to your global CSS file:

```css
/* Copy all styles from pricing-calculator.css */
```

Or import it in your main CSS file:
```css
@import './pricing-calculator.css';
```

### 4. Tailwind Configuration

Ensure your `tailwind.config` includes all necessary utilities. The component uses:
- Custom colors: `primary`, `primary-dark`
- Standard Tailwind utilities: spacing, colors, shadows, borders, etc.

If you don't have a `primary` color defined, add it to your Tailwind config:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // or your brand color
        'primary-dark': '#1e40af',
      }
    }
  }
}
```

### 5. Customize Content

#### Pricing Tiers
Edit the `PRICING_TIERS` constant in `PricingCalculator.tsx`:
```typescript
const PRICING_TIERS: PricingTier[] = [
  { min: 0, max: 10, tier: 1, serverStorage: 249.99, modulePrice: 149.99, onboarding: 7500 },
  // ... customize your tiers
];
```

#### Modules
Edit the `MODULES` array in `PricingCalculator.tsx`:
```typescript
const MODULES: ModuleInfo[] = [
  { 
    id: "core", 
    name: "CORE", 
    // ... customize module details
  },
  // ... add/remove modules
];
```

#### Pricing Constants
Update these constants in `PricingCalculator.tsx`:
- `USER_COST_BASE` - Base price per user
- `USER_COST_DISCOUNT` - User discount percentage
- `EARLY_ADOPTER_DISCOUNT` - Early adopter discount
- `NIA_DISCOUNT` - Association discount
- `ONBOARDING_DISCOUNT` - Onboarding discount
- `QUARTERLY_DISCOUNT` - Quarterly payment discount
- `ANNUAL_DISCOUNT` - Annual payment discount
- `TAX_RATE` - Tax rate (currently 13% HST for Ontario)

#### Currency Formatting
The component uses Canadian currency format. To change:
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-CA", {  // Change locale
    style: "currency",
    currency: "CAD",  // Change currency
    // ...
  }).format(amount);
};
```

### 6. Update CTA Links

Replace the demo booking link:
```typescript
// In PricingCalculator.tsx, find:
href="https://meetings.hubspot.com/shelson/appello-demo"
// Replace with your booking URL
```

### 7. Module Visuals

If you need to customize module visuals:
- Edit the visual components in `ModuleVisuals.tsx`
- Update the `getModuleVisual()` function to map your module names
- Replace QR code image path if needed:
  ```typescript
  // In EquipmentVisual component:
  src="/images/Untitled design.svg"  // Update this path
  ```

### 8. Button Component

If you already have a Button component, you can:
- Replace the Button import with your own
- Ensure your Button component supports these props:
  - `href` (string, optional)
  - `variant` ("primary" | "secondary" | "outline")
  - `size` ("sm" | "md" | "lg")
  - `className` (string, optional)
  - `children` (ReactNode)

## 🎨 Styling Customization

### Color Scheme
The component uses a color-coded system for business functions:
- Sales & Preconstruction: Blue (`blue-*`)
- Field Execution: Green (`green-*`)
- Project Delivery: Amber (`amber-*`)
- Safety & Compliance: Red (`red-*`)
- Financial Operations: Purple (`purple-*`)
- Foundational Platform: Indigo (`indigo-*`)

Update `businessFunctionColors` in `PricingCalculator.tsx` to match your brand.

### Responsive Design
The component is fully responsive:
- Mobile: Single column layout
- Tablet: 2-column module grid
- Desktop: 3-column module grid + sticky sidebar

## 🔍 Key Features

1. **Multi-Step Wizard**: 4-step configuration process
2. **Real-Time Calculations**: Updates as user changes selections
3. **Module Selection**: Toggle modules on/off with visual feedback
4. **Discount System**: Multiple discount types (Early Adopter, NIA, Payment Frequency)
5. **Tier-Based Pricing**: Pricing tiers based on user count
6. **Sticky Sidebar**: Real-time quote summary (desktop only)
7. **Copy Quote**: One-click quote copying functionality
8. **Smooth Animations**: Step transitions and hover effects

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support required
- JavaScript ES6+ required

## 🐛 Troubleshooting

### Slider Not Styled
- Ensure `pricing-calculator.css` is imported
- Check that the `pricing-slider` class is applied to the input

### Module Visuals Not Showing
- Verify `ModuleVisuals.tsx` is imported correctly
- Check image paths if using Next.js Image component
- Ensure `getModuleVisual()` function matches your module names

### Tailwind Classes Not Working
- Verify Tailwind is properly configured
- Check that all Tailwind utilities are included in your build
- Ensure `primary` color is defined in Tailwind config

### TypeScript Errors
- Ensure all type definitions are correct
- Check that React types are installed: `@types/react`
- Verify Next.js types if using Next.js Image component

## 📝 Notes

- The component is a client component (`"use client"`) - required for React hooks
- Uses `useState`, `useMemo`, and `useEffect` hooks
- Includes smooth scrolling behavior on step changes
- All calculations are done client-side
- No external API calls required

## 🔄 Future Enhancements

Potential improvements you might want to add:
- Save quotes to localStorage
- Email quote functionality
- Print quote option
- Integration with CRM/booking systems
- Analytics tracking
- A/B testing different pricing displays

## 📄 License

This code is provided as-is for migration purposes. Customize as needed for your use case.

