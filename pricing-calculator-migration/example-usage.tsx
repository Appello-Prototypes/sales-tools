/**
 * Example Usage of PricingCalculator Component
 * 
 * This file shows how to integrate the PricingCalculator component
 * into your application. Use this as a reference.
 */

import PricingCalculator from "./PricingCalculator";

// Example 1: Simple Integration
export function SimplePricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Pricing Calculator
      </h1>
      <PricingCalculator />
    </div>
  );
}

// Example 2: With Custom Styling
export function StyledPricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Build your custom plan with our interactive calculator.
            </p>
          </div>
          <PricingCalculator />
        </div>
      </section>
    </main>
  );
}

// Example 3: Next.js Page Component
/*
import PricingCalculator from "@/components/PricingCalculator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Your Company",
  description: "Simple, transparent pricing for your service.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-gray-50 py-20 md:py-28 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <PricingCalculator />
        </div>
      </section>
    </main>
  );
}
*/

// Example 4: With Custom Wrapper
export function CustomWrapperExample() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <PricingCalculator />
      </div>
    </div>
  );
}

