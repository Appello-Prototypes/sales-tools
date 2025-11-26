'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GeneratedLetter {
  _id: string;
  companyId: string;
  companyName: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyLocation?: string;
  recipientName?: string;
  recipientTitle?: string;
  generatedText: string;
  originalPrompt: string;
  feedback?: string;
  aiModel: string;
  status: 'draft' | 'approved' | 'sent' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export default function LetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params?.letterId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [letter, setLetter] = useState<GeneratedLetter | null>(null);
  const [editedText, setEditedText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (letterId && !loading) {
      fetchLetter();
    }
  }, [letterId, loading]);

  useEffect(() => {
    if (letter) {
      setEditedText(letter.generatedText);
    }
  }, [letter]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchLetter = async () => {
    try {
      const response = await fetch(`/api/admin/letters/${letterId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch letter');
      }
      const data = await response.json();
      setLetter(data.letter);
    } catch (error: any) {
      setError(error.message || 'Failed to load letter');
    }
  };

  const handleSave = async () => {
    if (!letter) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          generatedText: editedText,
          status: letter.status,
          recipientName: letter.recipientName,
          recipientTitle: letter.recipientTitle,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save letter');
      }
      const data = await response.json();
      setLetter(data.letter);
      alert('Letter saved successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to save letter');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!letter) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          generatedText: editedText,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      const data = await response.json();
      setLetter(data.letter);
    } catch (error: any) {
      setError(error.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for regeneration');
      return;
    }
    setRegenerating(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/letters/${letterId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate letter');
      }
      const data = await response.json();
      setEditedText(data.letter);
      setFeedback('');
      await fetchLetter(); // Refresh to get updated letter
      alert('Letter regenerated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to regenerate letter');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading letter...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!letter) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error || 'Letter not found'}</p>
              <Link href="/admin/letters">
                <Button className="mt-4">Back to All Letters</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link href="/admin/letters">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Letters
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Letter Details</h1>
            <p className="text-muted-foreground">View, edit, and manage this cold call letter</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Letter Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Letter Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Company</Label>
                    <p className="font-medium">{letter.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Select value={letter.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Recipient</Label>
                    <p className="font-medium">
                      {letter.recipientName || '—'}
                      {letter.recipientTitle && `, ${letter.recipientTitle}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">AI Model</Label>
                    <p className="font-medium">{letter.aiModel}</p>
                  </div>
                  {letter.companyLocation && (
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{letter.companyLocation}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {new Date(letter.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Letter Content */}
            <Card>
              <CardHeader>
                <CardTitle>Letter Content</CardTitle>
                <CardDescription>Edit the letter text below</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="letterText">Letter Text</Label>
                    <Textarea
                      id="letterText"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={20}
                      className="font-mono text-sm mt-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regenerate with Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Regenerate Letter</CardTitle>
                <CardDescription>Provide feedback to generate a new version</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g., Make it more formal, focus on cost savings, add urgency..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleRegenerate} disabled={regenerating || !feedback.trim()}>
                    {regenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Letter
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Original Prompt (Collapsible) */}
            <Card>
              <CardHeader>
                <CardTitle>Original AI Prompt</CardTitle>
                <CardDescription>View the prompt used to generate this letter</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                  {letter.originalPrompt}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}



