'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </motion.div>
              </div>
            </motion.div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Assessment Complete! 🎉
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your AI-powered personalized report is being generated
            </CardDescription>
            
            {/* AI Processing Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200"
            >
              <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-medium text-purple-900">
                Powered by Claude Sonnet 4.5 AI
              </span>
            </motion.div>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              We've received your responses and will use them to tailor your demo experience.
            </p>
            <p className="text-muted-foreground">
              Our team will review your assessment and reach out shortly to schedule your personalized demo.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              What happens next?
            </h3>
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Your Personalized Report</p>
                  <p className="text-sm text-muted-foreground">
                    View your AI-generated ROI analysis, pain point breakdown, and personalized recommendations
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Schedule Your Demo</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will contact you within 24 hours to schedule your personalized demo
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">See Appello in Action</p>
                  <p className="text-sm text-muted-foreground">
                    During the demo, we'll focus on your top priorities and show you exactly how Appello solves your challenges
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-r from-primary/10 via-purple-50 to-blue-50 border-2 border-primary/30 rounded-lg p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                <h3 className="font-bold text-xl">Your AI-Powered Report is Ready!</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                See your personalized analysis including:
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Pain point analysis with cost breakdowns</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>ROI projections based on your specific situation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Industry benchmarks and peer comparisons</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Personalized recommendations and next steps</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-lg py-6" size="lg">
                <Link href={submissionId ? `/assessment/report/${submissionId}` : '#'}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  View My Personalized Report
                </Link>
              </Button>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="mailto:corey@useappello.com">Contact Us</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

