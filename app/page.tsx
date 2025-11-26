import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-[#0046AD]">
              Appello Pre-Demo Assessment
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us tailor your demo to focus on what matters most to your business.
              Take 5-7 minutes to complete this assessment.
            </p>
          </div>

          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Why complete this assessment?</CardTitle>
              <CardDescription>
                Your answers help us provide a more valuable demo experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-left space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Tailor the demonstration to your specific needs</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Skip features that don't apply to you</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Dive deep into solving your biggest operational challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-primary">✓</span>
                  <span>Come prepared with relevant customer stories from your industry</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="pt-8">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/assessment">Start Assessment</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Looking forward to showing you how Appello can transform your operations!
          </p>
        </div>
      </div>
    </div>
  );
}
