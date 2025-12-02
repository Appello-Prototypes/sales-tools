/**
 * Letter Studio - AI Letter Generation API
 * 
 * Streaming endpoint that uses the Letter Intelligence Agent to research
 * a company/contact and generate a highly personalized letter.
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedLetter, { AgentProgressLog } from '@/models/GeneratedLetter';
import {
  generateLetterWithIntelligence,
  LetterContext,
} from '@/lib/ai/agent/LetterIntelligenceAgent';
import { createStreamingResponse, formatAgentProgress, AgentProgress } from '@/lib/ai/agent';

export async function POST(request: NextRequest) {
  return createStreamingResponse(async (send) => {
    // Collect all progress logs for session data
    const progressLogs: AgentProgressLog[] = [];
    
    try {
      // Authenticate
      const user = verifyAuth(request);
      if (!user) {
        send('error', { message: 'Unauthorized' });
        return;
      }

      const authLog: AgentProgressLog = {
        type: 'thinking',
        timestamp: new Date(),
        step: 'auth',
        message: '✓ Authentication verified',
        status: 'complete',
      };
      progressLogs.push(authLog);
      send('progress', {
        step: 'auth',
        message: '✓ Authentication verified',
        status: 'complete',
      });

      // Parse request
      const body = await request.json();
      const {
        companyId,
        companyName,
        companyIndustry,
        companyDomain,
        companyLocation,
        contactName,
        contactTitle,
        contactEmail,
        letterType = 'cold_outreach',
        customInstructions,
        tone = 'professional',
        saveDraft = true,
        letterId, // Optional: if regenerating an existing letter
      } = body;

      if (!companyName) {
        send('error', { message: 'Company name is required' });
        return;
      }

      const setupLog: AgentProgressLog = {
        type: 'thinking',
        timestamp: new Date(),
        step: 'setup',
        message: `🎯 Preparing to research ${companyName}...`,
        status: 'info',
        data: { companyName, letterType, tone },
      };
      progressLogs.push(setupLog);
      send('progress', {
        step: 'setup',
        message: `🎯 Preparing to research ${companyName}...`,
        status: 'info',
        data: { companyName, letterType, tone },
      });

      // Build context
      const context: LetterContext = {
        companyId,
        companyName,
        companyIndustry,
        companyDomain,
        companyLocation,
        contactName,
        contactTitle,
        contactEmail,
        letterType,
        customInstructions,
        tone,
      };

      const agentStartLog: AgentProgressLog = {
        type: 'thinking',
        timestamp: new Date(),
        step: 'agent-start',
        message: '🤖 Starting Letter Intelligence Agent...',
        status: 'loading',
        data: {
          description: 'The AI agent will research the company, find relevant insights, and craft a personalized letter. Watch the full process below.',
        },
      };
      progressLogs.push(agentStartLog);
      send('progress', {
        step: 'agent-start',
        message: '🤖 Starting Letter Intelligence Agent...',
        status: 'loading',
        data: {
          description: 'The AI agent will research the company, find relevant insights, and craft a personalized letter. Watch the full process below.',
        },
      });

      // Run the Letter Intelligence Agent and capture all progress
      const result = await generateLetterWithIntelligence(context, (progress: AgentProgress) => {
        // Convert AgentProgress to AgentProgressLog format
        const log: AgentProgressLog = {
          type: progress.type,
          timestamp: progress.timestamp,
          step: progress.data?.step || progress.data?.message?.substring(0, 50),
          message: progress.data?.message,
          status: progress.data?.status as any,
          data: {
            tool: progress.data?.tool,
            input: progress.data?.input,
            result: progress.data?.result,
            duration: progress.data?.duration,
            ...progress.data,
          },
        };
        progressLogs.push(log);
        send('progress', formatAgentProgress(progress));
      });

      if (!result.success || !result.output) {
        send('error', {
          message: result.error || 'Failed to generate letter',
          stats: result.stats,
        });
        return;
      }

      // Handle case where letter is returned as an object with {subject, body}
      let letterContent: string;
      let letterSubject: string | undefined;

      if (typeof result.output.letter === 'object' && result.output.letter !== null) {
        const letterObj = result.output.letter as { subject?: string; body?: string };
        letterContent = letterObj.body || JSON.stringify(result.output.letter);
        letterSubject = letterObj.subject || result.output.subject;
      } else {
        letterContent = result.output.letter;
        letterSubject = result.output.subject;
      }

      const completeLog: AgentProgressLog = {
        type: 'complete',
        timestamp: new Date(),
        step: 'generation-complete',
        message: '✅ Letter generated successfully!',
        status: 'complete',
        data: result.stats,
      };
      progressLogs.push(completeLog);
      send('progress', {
        step: 'generation-complete',
        message: '✅ Letter generated successfully!',
        status: 'complete',
        data: result.stats,
      });

      // Save to database if requested
      let savedLetter = null;
      if (saveDraft) {
        try {
          await connectDB();

          const userId = user.userId || 'system';
          const now = new Date();

          // Prepare draft data
          const draftData = {
            version: 1,
            generatedText: letterContent,
            subject: letterSubject,
            createdAt: now,
            createdBy: userId,
          };

          // Check if we're updating an existing letter or creating new
          if (letterId) {
            // Update existing letter with new draft
            const existingLetter: any = await (GeneratedLetter as any).findById(letterId);
            if (existingLetter) {
              const currentVersion = (existingLetter.currentDraftVersion || 0) + 1;
              const drafts = existingLetter.drafts || [];
              
              savedLetter = await (GeneratedLetter as any).findByIdAndUpdate(
                letterId,
                {
                  generatedText: letterContent,
                  subject: letterSubject,
                  tone,
                  customInstructions,
                  'agentSession.progressLogs': progressLogs,
                  'agentSession.researchSummary': result.output.researchSummary,
                  'agentSession.personalizationPoints': result.output.personalizationPoints,
                  'agentSession.suggestedFollowUp': result.output.suggestedFollowUp,
                  'agentSession.confidence': result.output.confidence,
                  'agentSession.stats': result.stats,
                  'agentSession.promptConfig': result.promptConfig,
                  $push: { drafts: { ...draftData, version: currentVersion } },
                  currentDraftVersion: currentVersion,
                  updatedBy: userId,
                  updatedAt: now,
                },
                { new: true }
              );
            }
          }

          // Create new letter if not updating
          if (!savedLetter) {
            savedLetter = await GeneratedLetter.create({
              companyId,
              companyName,
              companyDomain,
              companyIndustry,
              companyLocation,
              recipientName: contactName,
              recipientTitle: contactTitle,
              recipientEmail: contactEmail,
              letterType: letterType,
              tone,
              customInstructions,
              generatedText: letterContent,
              subject: letterSubject,
              agentSession: {
                progressLogs,
                researchSummary: result.output.researchSummary,
                personalizationPoints: result.output.personalizationPoints,
                suggestedFollowUp: result.output.suggestedFollowUp,
                confidence: result.output.confidence,
                stats: result.stats,
                promptConfig: result.promptConfig,
              },
              drafts: [draftData],
              currentDraftVersion: 1,
              originalPrompt: JSON.stringify({
                context,
                researchSummary: result.output.researchSummary,
              }),
              aiModel: 'claude-sonnet-4-5-20250929',
              status: 'draft',
              createdBy: userId,
              updatedBy: userId,
            });
          }

          const savedLog: AgentProgressLog = {
            type: 'complete',
            timestamp: new Date(),
            step: 'saved',
            message: '💾 Draft saved to database',
            status: 'complete',
            data: { letterId: savedLetter._id },
          };
          progressLogs.push(savedLog);
          send('progress', {
            step: 'saved',
            message: '💾 Draft saved to database',
            status: 'complete',
            data: { letterId: savedLetter._id },
          });
        } catch (dbError: any) {
          console.error('Failed to save letter draft:', dbError);
          // Don't fail the whole request if save fails
          send('progress', {
            step: 'save-warning',
            message: '⚠️ Could not save draft (letter still generated)',
            status: 'warning',
          });
        }
      }

      // Send complete response
      send('complete', {
        letter: letterContent,
        subject: letterSubject,
        researchSummary: result.output.researchSummary,
        personalizationPoints: result.output.personalizationPoints,
        suggestedFollowUp: result.output.suggestedFollowUp,
        confidence: result.output.confidence,
        stats: result.stats,
        savedLetterId: savedLetter?._id?.toString(),
        context: {
          companyName,
          contactName,
          letterType,
          tone,
        },
      });

    } catch (error: any) {
      console.error('Letter generation error:', error);
      send('error', { message: error.message || 'Internal server error' });
    }
  });
}

