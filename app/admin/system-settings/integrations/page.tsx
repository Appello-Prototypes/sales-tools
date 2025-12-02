'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Loader2,
  Play,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: 'ai' | 'crm' | 'mcp' | 'database' | 'communication' | 'other';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  configured: boolean;
  lastChecked?: string;
  details?: {
    endpoint?: string;
    apiKeyPresent?: boolean;
    error?: string;
    [key: string]: any;
  };
}

interface IntegrationSummary {
  total: number;
  connected: number;
  disconnected: number;
  errors: number;
}

interface TestResult {
  integrationId: string;
  success: boolean;
  message: string;
  details: any;
  timestamp: string;
}

const categoryLabels = {
  ai: 'AI',
  crm: 'CRM',
  mcp: 'MCP',
  database: 'Database',
  communication: 'Communication',
  other: 'Other',
};

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [summary, setSummary] = useState<IntegrationSummary>({
    total: 0,
    connected: 0,
    disconnected: 0,
    errors: 0,
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/integrations/status');
      if (!response.ok) {
        throw new Error('Failed to load integrations');
      }
      const data = await response.json();
      setIntegrations(data.integrations || []);
      setSummary(data.summary || { total: 0, connected: 0, disconnected: 0, errors: 0 });
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshIntegrations = async () => {
    setRefreshing(true);
    await loadIntegrations();
    setRefreshing(false);
  };

  const testIntegration = async (integrationId: string) => {
    setTesting(prev => ({ ...prev, [integrationId]: true }));
    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });
      const result: TestResult = await response.json();
      setTestResults(prev => ({ ...prev, [integrationId]: result }));
      
      // Refresh integrations after test
      setTimeout(() => {
        loadIntegrations();
      }, 500);
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: {
          integrationId,
          success: false,
          message: `Test failed: ${error.message}`,
          details: {},
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setTesting(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getConfigStatus = (integration: Integration) => {
    const details = integration.details || {};
    
    if (details.apiKeyPresent !== undefined) {
      return details.apiKeyPresent ? 'API Key ✓' : 'API Key ✗';
    }
    
    if (details.clientIdPresent !== undefined && details.clientSecretPresent !== undefined) {
      const both = details.clientIdPresent && details.clientSecretPresent;
      return both ? 'OAuth ✓' : 'OAuth ✗';
    }
    
    if (integration.id === 'mongodb') {
      return details.endpoint === 'Configured' ? 'URI ✓' : 'URI ✗';
    }
    
    if (integration.id === 'atlas') {
      return integration.configured ? 'MCP Config ✓' : 'MCP Config ✗';
    }
    
    return integration.configured ? 'Configured ✓' : 'Not Configured ✗';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Integrations</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">Manage and monitor your service integrations</p>
        </div>
        <Button
          onClick={refreshIntegrations}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{summary.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Connected</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-500">{summary.connected}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Disconnected</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.disconnected}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-500">{summary.errors}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
        </Card>
      </div>

      {/* Integrations Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Integration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Configuration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Endpoint</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Last Checked</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => {
                const isTesting = testing[integration.id];
                const testResult = testResults[integration.id];
                const details = integration.details || {};
                
                return (
                  <tr key={integration.id} className="border-b dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-foreground">{integration.name}</div>
                      {testResult && (
                        <div className={`text-xs mt-1 ${
                          testResult.success ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                        }`}>
                          {testResult.message}
                        </div>
                      )}
                      {details.error && (
                        <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                          Error: {details.error}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-muted-foreground">
                        {categoryLabels[integration.category]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className={`text-xs px-2 py-1 rounded border font-medium ${getStatusBadge(integration.status)}`}>
                          {integration.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm ${
                        integration.configured ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                      }`}>
                        {getConfigStatus(integration)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {details.endpoint ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-muted-foreground font-mono">
                            {details.endpoint.length > 40 
                              ? `${details.endpoint.substring(0, 40)}...` 
                              : details.endpoint}
                          </span>
                          {details.endpoint.startsWith('http') && (
                            <a
                              href={details.endpoint}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {integration.lastChecked ? (
                        <span className="text-sm text-gray-600 dark:text-muted-foreground">
                          {new Date(integration.lastChecked).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-muted-foreground">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegration(integration.id)}
                          disabled={isTesting || integration.status === 'testing'}
                          className="flex items-center gap-1"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              Test
                            </>
                          )}
                        </Button>
                        {integration.configured && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Could open a settings modal or navigate to config
                              alert(`Configure ${integration.name} in your .env.local file`);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Test Results Details */}
      {Object.keys(testResults).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">Recent Test Results</h2>
          <div className="space-y-3">
            {Object.values(testResults).map((result) => {
              const integration = integrations.find(i => i.id === result.integrationId);
              return (
                <div
                  key={result.integrationId}
                  className={`p-3 rounded border ${
                    result.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-foreground">
                        {integration?.name || result.integrationId}
                      </span>
                      <span className={`ml-2 text-sm ${
                        result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {result.message}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {Object.keys(result.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 dark:text-muted-foreground cursor-pointer">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-white dark:bg-muted p-2 rounded overflow-auto text-gray-900 dark:text-foreground">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
