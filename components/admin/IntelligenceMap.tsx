'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Loader2,
  DollarSign,
  TrendingUp,
  Building2,
  ExternalLink,
  Gauge,
  Flame,
  Target,
  FileText,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCompanyLinkClient, getDealLinkClient } from '@/lib/hubspot/hubspotLinks';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDoV5IGKfkPBdh7Emwm5k6D4rDkDuHkAHU';

interface MapDealData {
  jobId: string;
  entityName: string;
  entityId: string;
  entityType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  lat: number;
  lng: number;
  companyName: string;
  companyId: string;
  address?: string;
  city?: string;
  state?: string;
  amount?: string;
  amountFormatted?: string;
  dealstage?: string;
  stageLabel?: string;
  pipeline?: string;
  dealScore?: {
    totalScore: number;
    percentage: number;
    grade: string;
    priority: string;
    healthIndicator: string;
  };
}

declare global {
  interface Window {
    google: any;
    initIntelligenceMap: () => void;
  }
}

// Priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Hot': return { fill: '#ef4444', stroke: '#fca5a5', glow: 'rgba(239, 68, 68, 0.4)' };
    case 'Warm': return { fill: '#f97316', stroke: '#fdba74', glow: 'rgba(249, 115, 22, 0.4)' };
    case 'Cool': return { fill: '#3b82f6', stroke: '#93c5fd', glow: 'rgba(59, 130, 246, 0.4)' };
    case 'Cold':
    default: return { fill: '#6b7280', stroke: '#9ca3af', glow: 'rgba(107, 114, 128, 0.3)' };
  }
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A+':
    case 'A': return 'text-emerald-400';
    case 'B+':
    case 'B': return 'text-blue-400';
    case 'C+':
    case 'C': return 'text-amber-400';
    case 'D': return 'text-orange-400';
    case 'F': return 'text-red-400';
    default: return 'text-slate-400';
  }
};

interface IntelligenceMapProps {
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function IntelligenceMap({ 
  className = '', 
  isExpanded = false,
  onToggleExpand 
}: IntelligenceMapProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [deals, setDeals] = useState<MapDealData[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<MapDealData | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map once script is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.6532, lng: -79.3832 }, // Toronto center
      zoom: 10,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ color: '#0f172a' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#0f172a' }, { lightness: -80 }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#64748b' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1e293b' }, { lightness: 10 }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#1e293b' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#0f172a' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#334155' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#020617' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#1e293b' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#0d1f1a' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#1e293b' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.LEFT_BOTTOM,
      },
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [mapLoaded]);

  // Fetch deals data
  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/intelligence/map');
      const data = await response.json();
      
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Error loading intelligence map data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  // Update markers when deals change
  const updateMarkers = useCallback((dealsData: MapDealData[]) => {
    if (!googleMapRef.current || !window.google) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (dealsData.length === 0) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;
    
    dealsData.forEach(deal => {
      if (!deal.lat || !deal.lng) return;
      
      const priorityColors = getPriorityColor(deal.dealScore?.priority || 'Cold');
      const amount = parseFloat(deal.amount || '0');
      
      // Scale marker size based on deal amount (min 10, max 24)
      const baseSize = 10;
      const maxSize = 24;
      const scale = Math.min(baseSize + Math.log10(Math.max(amount, 1)) * 2, maxSize);
      
      const marker = new window.google.maps.Marker({
        position: { lat: deal.lat, lng: deal.lng },
        map: googleMapRef.current,
        title: deal.entityName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: priorityColors.fill,
          fillOpacity: 0.9,
          strokeColor: priorityColors.stroke,
          strokeWeight: 2,
          scale: scale,
        },
      });
      
      marker.addListener('click', () => {
        setSelectedDeal(deal);
        
        const gradeColorClass = getGradeColor(deal.dealScore?.grade || 'N/A');
        
        const content = `
          <div style="
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            min-width: 280px;
            font-family: system-ui, -apple-system, sans-serif;
            border: 1px solid ${priorityColors.stroke};
            box-shadow: 0 0 20px ${priorityColors.glow};
          ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #f8fafc;">${deal.entityName}</h3>
              ${deal.dealScore ? `
                <div style="display: flex; align-items: center; gap: 6px; background: ${priorityColors.fill}20; padding: 4px 8px; border-radius: 6px;">
                  <span style="font-weight: 700; font-size: 18px; color: ${priorityColors.fill};">${deal.dealScore.grade}</span>
                  <span style="font-size: 12px; color: #94a3b8;">(${deal.dealScore.totalScore})</span>
                </div>
              ` : ''}
            </div>
            
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              ${deal.amountFormatted ? `
                <div style="background: #10b98120; padding: 8px 12px; border-radius: 8px; flex: 1;">
                  <div style="font-size: 10px; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">Amount</div>
                  <div style="font-size: 18px; font-weight: 600; color: #10b981;">${deal.amountFormatted}</div>
                </div>
              ` : ''}
              ${deal.dealScore?.priority ? `
                <div style="background: ${priorityColors.fill}20; padding: 8px 12px; border-radius: 8px; flex: 1;">
                  <div style="font-size: 10px; color: ${priorityColors.fill}; text-transform: uppercase; letter-spacing: 0.5px;">Priority</div>
                  <div style="font-size: 18px; font-weight: 600; color: ${priorityColors.fill};">${deal.dealScore.priority}</div>
                </div>
              ` : ''}
            </div>
            
            <div style="border-top: 1px solid #334155; padding-top: 12px;">
              <div style="display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 13px;">
                <span>📍</span>
                <span>${deal.companyName}</span>
              </div>
              ${deal.city || deal.state ? `
                <div style="color: #64748b; font-size: 12px; margin-top: 4px; padding-left: 22px;">
                  ${[deal.city, deal.state].filter(Boolean).join(', ')}
                </div>
              ` : ''}
              ${deal.stageLabel ? `
                <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: #334155; border-radius: 6px; font-size: 12px; color: #e2e8f0;">
                  ${deal.stageLabel}
                </div>
              ` : ''}
            </div>
          </div>
        `;
        
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(googleMapRef.current, marker);
      });
      
      markersRef.current.push(marker);
      bounds.extend({ lat: deal.lat, lng: deal.lng });
      hasValidBounds = true;
    });
    
    if (hasValidBounds) {
      googleMapRef.current.fitBounds(bounds);
      const listener = googleMapRef.current.addListener('idle', () => {
        if (googleMapRef.current.getZoom() > 14) {
          googleMapRef.current.setZoom(14);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && deals.length > 0) {
      updateMarkers(deals);
    }
  }, [mapLoaded, deals, updateMarkers]);

  // Recenter map when expanded
  useEffect(() => {
    if (googleMapRef.current && deals.length > 0 && isExpanded) {
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
        updateMarkers(deals);
      }, 100);
    }
  }, [isExpanded, deals, updateMarkers]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card className={`bg-slate-900/50 border-slate-700/50 p-6 ${className}`}>
        <div className="text-center text-slate-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Google Maps API key not configured</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
            <MapPin className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Deal Flow Map</h3>
            <p className="text-xs text-slate-400">
              {deals.length} deals with mapped locations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDeals}
            disabled={loading}
            className="text-slate-400 hover:text-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="text-slate-400 hover:text-slate-100"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative" style={{ height: isExpanded ? 'calc(100vh - 300px)' : '400px' }}>
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                <MapPin className="absolute inset-0 m-auto h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-slate-300 text-sm">Loading deal locations...</p>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!loading && deals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400">No deals with location data</p>
              <p className="text-slate-500 text-sm mt-1">Run intelligence reports on deals to see them on the map</p>
            </div>
          </div>
        )}
        
        {/* Selected Deal Panel */}
        {selectedDeal && (
          <div className="absolute top-4 right-4 w-80 z-10">
            <Card className="bg-slate-800/95 border-slate-600/50 backdrop-blur-sm">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold text-slate-100 line-clamp-1">
                      {selectedDeal.entityName}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDeal(null)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {selectedDeal.amountFormatted && (
                    <div className="bg-emerald-500/10 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-emerald-400 text-xs mb-1">
                        <DollarSign className="h-3 w-3" />
                        Amount
                      </div>
                      <div className="text-lg font-semibold text-emerald-300">
                        {selectedDeal.amountFormatted}
                      </div>
                    </div>
                  )}
                  {selectedDeal.dealScore && (
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                        <Gauge className="h-3 w-3" />
                        Deal Score
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${getGradeColor(selectedDeal.dealScore.grade)}`}>
                          {selectedDeal.dealScore.grade}
                        </span>
                        <span className="text-sm text-slate-400">
                          ({selectedDeal.dealScore.totalScore})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Priority & Stage */}
                <div className="flex items-center gap-2 mb-4">
                  {selectedDeal.dealScore?.priority && (
                    <div 
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${getPriorityColor(selectedDeal.dealScore.priority).fill}20`,
                        color: getPriorityColor(selectedDeal.dealScore.priority).fill 
                      }}
                    >
                      {selectedDeal.dealScore.priority === 'Hot' && <Flame className="h-3 w-3" />}
                      {selectedDeal.dealScore.priority !== 'Hot' && <Target className="h-3 w-3" />}
                      {selectedDeal.dealScore.priority}
                    </div>
                  )}
                  {selectedDeal.stageLabel && (
                    <div className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-300">
                      {selectedDeal.stageLabel}
                    </div>
                  )}
                </div>
                
                {/* Company Info */}
                <div className="border-t border-slate-700/50 pt-3 mb-4">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {selectedDeal.companyName}
                  </div>
                  {(selectedDeal.city || selectedDeal.state) && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 ml-6">
                      {[selectedDeal.city, selectedDeal.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => router.push(`/admin/intelligence/${selectedDeal.jobId}`)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Report
                  </Button>
                  <a
                    href={getDealLinkClient(selectedDeal.entityId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      HubSpot
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="bg-slate-800/90 border-slate-700/50 backdrop-blur-sm p-3">
            <div className="text-xs font-medium text-slate-300 mb-2">Priority Level</div>
            <div className="space-y-1.5">
              {[
                { label: 'Hot', color: '#ef4444' },
                { label: 'Warm', color: '#f97316' },
                { label: 'Cool', color: '#3b82f6' },
                { label: 'Cold', color: '#6b7280' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
              Marker size = Deal amount
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}

