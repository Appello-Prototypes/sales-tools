'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Building2, DollarSign, Clock, Target, ExternalLink } from 'lucide-react';
import { getDealLinkClient } from '@/lib/hubspot/hubspotLinks';

interface Deal {
  id: string;
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline: string;
  closedate?: string;
  dealtype?: string;
}

interface PipelineStats {
  pipeline: string;
  totalDeals: number;
  totalAmount: number;
  openDeals: number;
  closedWon: number;
  closedLost: number;
}

interface DealStageStats {
  stage: string;
  count: number;
  totalAmount: number;
}

export default function CRMDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats[]>([]);
  const [dealStageStats, setDealStageStats] = useState<DealStageStats[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  const [openDealsCount, setOpenDealsCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load deals, contacts, companies, and pipeline data
      // Note: HubSpot API limit is 100 per request, so we'll fetch 100 deals
      const dealsResponse = await fetch('/api/admin/hubspot/deals?limit=100');
      if (!dealsResponse.ok) {
        const errorData = await dealsResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Deals API Error:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to load deals: ${dealsResponse.status}`);
      }
      const dealsData = await dealsResponse.json();
      console.log('Deals data loaded:', { count: dealsData.deals?.length || 0, error: dealsData.error });
      
      const contactsResponse = await fetch('/api/admin/hubspot/contacts?limit=100');
      if (!contactsResponse.ok) {
        const errorData = await contactsResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Contacts API Error:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to load contacts: ${contactsResponse.status}`);
      }
      const contactsData = await contactsResponse.json();
      console.log('Contacts data loaded:', { count: contactsData.contacts?.length || 0 });
      
      const companiesResponse = await fetch('/api/admin/hubspot/companies?limit=100');
      if (!companiesResponse.ok) {
        const errorData = await companiesResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Companies API Error:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to load companies: ${companiesResponse.status}`);
      }
      const companiesData = await companiesResponse.json();
      console.log('Companies data loaded:', { count: companiesData.companies?.length || 0 });

      // Process deals data
      const dealsList = dealsData.deals || [];
      setDeals(dealsList);

      // Calculate pipeline statistics
      const pipelineMap = new Map<string, PipelineStats>();
      
      dealsList.forEach((deal: Deal) => {
        const pipeline = deal.pipeline || 'default';
        const amount = parseFloat(deal.amount || '0');
        const stage = deal.dealstage || '';
        const isClosed = stage === 'closedwon' || stage === 'closedlost';
        const isWon = stage === 'closedwon';
        const isLost = stage === 'closedlost';

        if (!pipelineMap.has(pipeline)) {
          pipelineMap.set(pipeline, {
            pipeline,
            totalDeals: 0,
            totalAmount: 0,
            openDeals: 0,
            closedWon: 0,
            closedLost: 0,
          });
        }

        const stats = pipelineMap.get(pipeline)!;
        stats.totalDeals++;
        stats.totalAmount += amount;
        
        if (!isClosed) {
          stats.openDeals++;
        } else if (isWon) {
          stats.closedWon++;
        } else if (isLost) {
          stats.closedLost++;
        }
      });

      setPipelineStats(Array.from(pipelineMap.values()));

      // Calculate deal stage statistics
      const stageMap = new Map<string, DealStageStats>();
      
      dealsList.forEach((deal: Deal) => {
        const stage = deal.dealstage || 'unknown';
        const amount = parseFloat(deal.amount || '0');

        if (!stageMap.has(stage)) {
          stageMap.set(stage, {
            stage,
            count: 0,
            totalAmount: 0,
          });
        }

        const stats = stageMap.get(stage)!;
        stats.count++;
        stats.totalAmount += amount;
      });

      setDealStageStats(Array.from(stageMap.values()).sort((a, b) => b.totalAmount - a.totalAmount));

      // Calculate totals
      const openDeals = dealsList.filter((d: Deal) => {
        const stage = d.dealstage || '';
        return stage !== 'closedwon' && stage !== 'closedlost';
      });
      
      setOpenDealsCount(openDeals.length);
      setTotalPipelineValue(
        openDeals.reduce((sum: number, d: Deal) => sum + parseFloat(d.amount || '0'), 0)
      );
      setTotalContacts(contactsData.contacts?.length || 0);
      setTotalCompanies(companiesData.companies?.length || 0);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data. Please check your HubSpot API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-muted-foreground">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">CRM Dashboard</h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-1">Sales pipeline overview and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">
                {formatCurrency(totalPipelineValue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Open Deals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">{openDealsCount}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">{totalContacts}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground mt-1">{totalCompanies}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">Pipeline Performance</h2>
          <div className="space-y-4">
            {pipelineStats.length > 0 ? (
              pipelineStats.map((stats) => (
                <div key={stats.pipeline} className="border-b dark:border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-foreground">{stats.pipeline}</h3>
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">{stats.totalDeals} deals</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-muted-foreground">Open</p>
                      <p className="font-semibold text-gray-900 dark:text-foreground">{stats.openDeals}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-muted-foreground">Won</p>
                      <p className="font-semibold text-green-600 dark:text-green-500">{stats.closedWon}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-muted-foreground">Lost</p>
                      <p className="font-semibold text-red-600 dark:text-red-500">{stats.closedLost}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-gray-900 dark:text-foreground">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-muted-foreground text-sm">No pipeline data available</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">Deal Stages</h2>
          <div className="space-y-3">
            {dealStageStats.length > 0 ? (
              dealStageStats.slice(0, 10).map((stats) => (
                <div key={stats.stage} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground">{stats.stage}</p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{stats.count} deals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-muted-foreground text-sm">No deal stage data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">Recent Deals</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Deal Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Pipeline</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Stage</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 10).map((deal) => (
                <tr key={deal.id} className="border-b dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{deal.dealname}</span>
                      <a
                        href={getDealLinkClient(deal.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title="View in HubSpot"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">{deal.pipeline}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">{deal.dealstage}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-foreground">
                    {formatCurrency(parseFloat(deal.amount || '0'))}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                    {deal.closedate ? new Date(deal.closedate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-muted-foreground text-sm">
                    No deals found. Connect HubSpot MCP tools to load data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

