import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { IntelligenceHubContent } from './_components/IntelligenceHubContent';

function LoadingSkeleton() {
  return (
    <div className="p-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-500 mb-4" />
          <p className="text-slate-400">Loading Intelligence Hub...</p>
              </div>
                          </div>
                        </div>
                      );
}

export default function IntelligenceHubPage() {
                      return (
    <Suspense fallback={<LoadingSkeleton />}>
      <IntelligenceHubContent />
    </Suspense>
  );
}
