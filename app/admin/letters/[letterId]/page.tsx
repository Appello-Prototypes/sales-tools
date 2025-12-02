'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { 
  Loader2, 
  Save, 
  RefreshCw, 
  ArrowLeft, 
  Copy, 
  Check, 
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  User,
  MapPin,
  Calendar,
  Cpu,
  History,
  Target,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import { AgentActivityLog, type ActivityLogEntry } from '@/components/ai/AgentActivityLog';

interface AgentProgressLog {
  type: string;
  timestamp: string | Date;
  step?: string;
  message?: string;
  status?: string;
  data?: any;
}

interface ResearchSummary {
  companyInsights?: string[];
  industryContext?: string[];
  similarCustomers?: string[];
  painPoints?: string[];
  opportunities?: string[];
  customerStatus?: 'existing_customer' | 'prospect' | 'unknown';
  priorInteractions?: {
    found: boolean;
    interactions: Array<{
      date: string;
      type: string;
      summary: string;
      participants?: string[];
    }>;
    summary: string;
  };
}

interface LetterDraft {
  version: number;
  generatedText: string;
  subject?: string;
  createdAt: string | Date;
  createdBy: string;
  editedBy?: string;
  editedAt?: string | Date;
  notes?: string;
}

interface AgentSession {
  progressLogs?: AgentProgressLog[];
  researchSummary?: ResearchSummary;
  personalizationPoints?: string[];
  suggestedFollowUp?: string;
  confidence?: number;
  stats?: {
    iterations: number;
    toolCalls: number;
  };
  promptConfig?: {
    letterType: string;
    tone: string;
    version: number;
  };
}

interface GeneratedLetter {
  _id: string;
  companyId?: string;
  companyName: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyLocation?: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientEmail?: string;
  letterType: string;
  tone?: string;
  customInstructions?: string;
  generatedText: string;
  subject?: string;
  agentSession?: AgentSession;
  drafts?: LetterDraft[];
  currentDraftVersion?: number;
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
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showSession, setShowSession] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectedDraftVersion, setSelectedDraftVersion] = useState<number | null>(null);

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
      setSuccessMessage('Letter saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save letter');
      setTimeout(() => setError(''), 5000);
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
      setSuccessMessage('Letter regenerated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to regenerate letter');
      setTimeout(() => setError(''), 5000);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCopyFormatted = async () => {
    const formatted = formatLetterForExport(editedText);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setError('Failed to copy formatted letter');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatLetterForExport = (text: string): string => {
    // Parse the letter text into sections
    const lines = text.split('\n');
    let formatted = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Detect subject line
      if (line.startsWith('Subject:') || line.startsWith('**Subject:**')) {
        formatted += line.replace(/^\*\*Subject:\*\*|^Subject:/, '').trim() + '\n\n';
        continue;
      }
      
      // Detect salutation
      if (line.match(/^[A-Z][a-z]+,\s*$/) || line.includes(',')) {
        formatted += line + '\n\n';
        continue;
      }
      
      // Regular paragraphs
      formatted += line + '\n';
      
      // Add spacing after paragraphs
      if (i < lines.length - 1 && lines[i + 1]?.trim() && !lines[i + 1].trim().match(/^[A-Z][a-z]+,\s*$/)) {
        formatted += '\n';
      }
    }
    
    return formatted.trim();
  };

  const parseLetterSections = (text: string) => {
    const sections: Record<string, string> = {
      subject: '',
      salutation: '',
      body: '',
      closing: '',
      signature: ''
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'body';
    let bodyLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Subject:') || trimmed.startsWith('**Subject:**')) {
        sections.subject = trimmed.replace(/^\*\*Subject:\*\*|^Subject:/, '').trim();
        continue;
      }
      
      if (trimmed.match(/^[A-Z][a-z]+,\s*$/) && !sections.salutation) {
        sections.salutation = trimmed;
        continue;
      }
      
      if (trimmed.match(/^(Best regards|Sincerely|Regards|Thank you),?\s*$/i)) {
        if (bodyLines.length > 0) {
          sections.body = bodyLines.join('\n\n');
          bodyLines = [];
        }
        sections.closing = trimmed;
        currentSection = 'closing';
        continue;
      }
      
      if (currentSection === 'closing' || trimmed.includes('[Your Name]') || trimmed.includes('[Your Title]')) {
        sections.signature = (sections.signature + '\n' + trimmed).trim();
        continue;
      }
      
      if (currentSection === 'body') {
        bodyLines.push(trimmed);
      }
    }

    if (bodyLines.length > 0 && !sections.body) {
      sections.body = bodyLines.join('\n\n');
    }

    return sections;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading letter...</p>
        </div>
      </div>
    );
  }

  if (!letter) {
    return (
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
    );
  }

  const wordCount = editedText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editedText.length;
  const letterSections = parseLetterSections(editedText);

  return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link href="/admin/letters">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Letters
              </Button>
            </Link>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Letter Details</h1>
                <p className="text-muted-foreground">View, edit, and manage this cold call letter</p>
              </div>
              <Badge className={`${getStatusColor(letter.status)} border`}>
                {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
              </Badge>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 animate-in slide-in-from-top-2">
              <CardContent className="pt-6">
                <p className="text-red-800 font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Card className="mb-6 border-green-200 bg-green-50 animate-in slide-in-from-top-2">
              <CardContent className="pt-6">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Letter Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Letter Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-muted-foreground text-xs">Company</Label>
                      <p className="font-semibold text-sm mt-1">{letter.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-muted-foreground text-xs">Recipient</Label>
                      <p className="font-semibold text-sm mt-1">
                        {letter.recipientName || '—'}
                        {letter.recipientTitle && (
                          <span className="text-muted-foreground font-normal">, {letter.recipientTitle}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {letter.companyLocation && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <Label className="text-muted-foreground text-xs">Location</Label>
                        <p className="font-semibold text-sm mt-1">{letter.companyLocation}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Cpu className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-muted-foreground text-xs">AI Model</Label>
                      <p className="font-semibold text-sm mt-1">{letter.aiModel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-muted-foreground text-xs">Created</Label>
                      <p className="font-semibold text-sm mt-1">
                        {new Date(letter.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2 block">Status</Label>
                    <Select value={letter.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-full">
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
              </CardContent>
            </Card>

            {/* Letter Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Letter Content</CardTitle>
                    <CardDescription>Edit the letter text below</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyFormatted}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview Mode */}
                  {showPreview && (
                    <div className="bg-white border rounded-lg p-6 shadow-sm mb-4">
                      <div className="prose prose-sm max-w-none">
                        {letterSections.subject && (
                          <div className="mb-4">
                            <p className="font-semibold text-gray-900 mb-2">Subject:</p>
                            <p className="text-gray-700">{letterSections.subject}</p>
                          </div>
                        )}
                        {letterSections.salutation && (
                          <p className="text-gray-900 mb-4">{letterSections.salutation}</p>
                        )}
                        {letterSections.body && (
                          <div className="mb-4">
                            {letterSections.body.split('\n\n').map((para, idx) => (
                              <p key={idx} className="text-gray-700 mb-4 leading-relaxed">
                                {para}
                              </p>
                            ))}
                          </div>
                        )}
                        {letterSections.closing && (
                          <p className="text-gray-900 mb-4">{letterSections.closing}</p>
                        )}
                        {letterSections.signature && (
                          <div className="text-gray-700 space-y-1">
                            {letterSections.signature.split('\n').map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="letterText">Letter Text</Label>
                      <div className="text-xs text-muted-foreground">
                        {wordCount} words • {charCount} characters
                      </div>
                    </div>
                    <Textarea
                      id="letterText"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="Enter letter content..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
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

            {/* Agent Session & Historical Context */}
            {letter.agentSession && (
              <>
                {/* Agent Session Logs */}
                {letter.agentSession.progressLogs && letter.agentSession.progressLogs.length > 0 && (
                  <Card>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setShowSession(!showSession)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Agent Session History
                        </CardTitle>
                        {showSession ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      <CardDescription>
                        View the complete agent activity log from letter generation
                      </CardDescription>
                    </CardHeader>
                    {showSession && (
                      <CardContent>
                        <AgentActivityLog
                          logs={letter.agentSession.progressLogs.map(log => ({
                            step: log.step || log.type,
                            message: log.message || '',
                            status: (log.status as any) || 'info',
                            data: log.data,
                            timestamp: new Date(log.timestamp),
                          }))}
                          isLoading={false}
                          title="Letter Intelligence Agent"
                          subtitle="Complete generation process"
                          maxHeight="500px"
                        />
                        {letter.agentSession.stats && (
                          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
                            <span>🔍 {letter.agentSession.stats.toolCalls || 0} research queries</span>
                            <span>🔄 {letter.agentSession.stats.iterations || 0} iterations</span>
                            {letter.agentSession.confidence && (
                              <span>✨ {Math.round(letter.agentSession.confidence * 100)}% confidence</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Research Summary */}
                {letter.agentSession.researchSummary && (
                  <Card>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setShowResearch(!showResearch)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Research Insights
                        </CardTitle>
                        {showResearch ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      <CardDescription>
                        Research findings used to personalize this letter
                      </CardDescription>
                    </CardHeader>
                    {showResearch && letter.agentSession.researchSummary && (
                      <CardContent className="space-y-4">
                        {/* Prior Interactions */}
                        {letter.agentSession.researchSummary.priorInteractions && (
                          <div className={`p-3 rounded-lg border ${
                            letter.agentSession.researchSummary.priorInteractions.found 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              {letter.agentSession.researchSummary.priorInteractions.found ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-green-800">Verified Prior Interactions</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-yellow-800">No Prior Interactions Found</span>
                                </>
                              )}
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                              {letter.agentSession.researchSummary.priorInteractions.summary}
                            </p>
                            {letter.agentSession.researchSummary.priorInteractions.interactions?.length > 0 && (
                              <ul className="space-y-2 mt-2">
                                {letter.agentSession.researchSummary.priorInteractions.interactions.map((interaction, i) => (
                                  <li key={i} className="text-sm bg-white p-2 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {interaction.type}
                                      </Badge>
                                      <span className="text-xs text-gray-500">{interaction.date}</span>
                                    </div>
                                    <p className="text-gray-700">{interaction.summary}</p>
                                    {interaction.participants && interaction.participants.length > 0 && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Participants: {interaction.participants.join(', ')}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Company Insights */}
                        {letter.agentSession.researchSummary.companyInsights && letter.agentSession.researchSummary.companyInsights.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              Company Insights
                            </h4>
                            <ul className="space-y-1">
                              {letter.agentSession.researchSummary.companyInsights.map((insight, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Similar Customers */}
                        {letter.agentSession.researchSummary.similarCustomers && letter.agentSession.researchSummary.similarCustomers.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4 text-green-600" />
                              Similar Customers
                            </h4>
                            <ul className="space-y-1">
                              {letter.agentSession.researchSummary.similarCustomers.map((customer, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  {customer}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Pain Points */}
                        {letter.agentSession.researchSummary.painPoints && letter.agentSession.researchSummary.painPoints.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              Identified Pain Points
                            </h4>
                            <ul className="space-y-1">
                              {letter.agentSession.researchSummary.painPoints.map((pain, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-amber-600 mt-1">•</span>
                                  {pain}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Opportunities */}
                        {letter.agentSession.researchSummary.opportunities && letter.agentSession.researchSummary.opportunities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-emerald-600" />
                              Opportunities
                            </h4>
                            <ul className="space-y-1">
                              {letter.agentSession.researchSummary.opportunities.map((opp, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-emerald-600 mt-1">•</span>
                                  {opp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Personalization Points */}
                        {letter.agentSession.personalizationPoints && letter.agentSession.personalizationPoints.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              Personalization Points Used
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {letter.agentSession.personalizationPoints.map((point, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Historical Drafts */}
                {letter.drafts && letter.drafts.length > 1 && (
                  <Card>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setShowDrafts(!showDrafts)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Draft History ({letter.drafts.length} versions)
                        </CardTitle>
                        {showDrafts ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                      <CardDescription>
                        View all previous versions of this letter
                      </CardDescription>
                    </CardHeader>
                    {showDrafts && (
                      <CardContent>
                        <div className="space-y-3">
                          {letter.drafts
                            .sort((a, b) => b.version - a.version)
                            .map((draft) => (
                              <div
                                key={draft.version}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedDraftVersion === draft.version
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  setSelectedDraftVersion(draft.version);
                                  setEditedText(draft.generatedText);
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={draft.version === letter.currentDraftVersion ? 'default' : 'outline'}>
                                      Version {draft.version}
                                      {draft.version === letter.currentDraftVersion && ' (Current)'}
                                    </Badge>
                                    {draft.version === letter.currentDraftVersion && (
                                      <Badge variant="secondary" className="text-xs">Active</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(draft.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                {draft.subject && (
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Subject: {draft.subject}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {draft.generatedText.substring(0, 150)}...
                                </p>
                                {draft.notes && (
                                  <p className="text-xs text-gray-400 mt-2 italic">
                                    Note: {draft.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* Regenerate with Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Regenerate Letter
                </CardTitle>
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
                    <p className="text-xs text-muted-foreground mt-2">
                      Provide specific feedback about what you'd like to change in the letter.
                    </p>
                  </div>
                  <Button 
                    onClick={handleRegenerate} 
                    disabled={regenerating || !feedback.trim()}
                    className="w-full sm:w-auto"
                  >
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
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Original AI Prompt
                    </CardTitle>
                    <CardDescription>View the prompt used to generate this letter</CardDescription>
                  </div>
                  {showPrompt ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showPrompt && (
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono text-gray-800">
                      {letter.originalPrompt}
                    </pre>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(letter.originalPrompt);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
  );
}



