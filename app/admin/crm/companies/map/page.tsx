'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Search, 
  MapPin, 
  List, 
  Loader2, 
  Phone, 
  Globe, 
  Users, 
  X,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { getCompanyLinkClient } from '@/lib/hubspot/hubspotLinks';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDoV5IGKfkPBdh7Emwm5k6D4rDkDuHkAHU';

interface Deal {
  id: string;
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline: string;
  closedate?: string;
  dealtype?: string;
  isClosed: boolean;
  isWon: boolean;
  isLost: boolean;
}

interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  employees?: string;
  lat?: number;
  lng?: number;
  geocodedAt?: string;
  geocodeError?: boolean;
  deals?: Deal[];
}

interface GeocodedCompany extends Company {
  lat: number;
  lng: number;
  geocodeError?: boolean;
}

interface Pipeline {
  id: string;
  label: string;
  stages: { id: string; label: string }[];
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function CompaniesMapPage() {
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [geocodedCompanies, setGeocodedCompanies] = useState<GeocodedCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<GeocodedCompany | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ current: 0, total: 0 });
  
  // Pipeline & Stage filters
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineLabels, setPipelineLabels] = useState<Record<string, string>>({});
  const [stageLabels, setStageLabels] = useState<Record<string, string>>({});
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Load Google Maps Script
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup
    };
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
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#1a1a2e' }, { lightness: -80 }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#8892b0' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#2d3561' }, { lightness: 10 }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#2d3561' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1a1a2e' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#3a4074' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0f0f1a' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#1f1f3d' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#1a2e1a' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2d2d4d' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [mapLoaded]);

  // Load pipelines
  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const response = await fetch('/api/admin/hubspot/pipelines');
      const data = await response.json();
      
      if (data.pipelineData) {
        const formattedPipelines: Pipeline[] = data.pipelineData.map((p: any) => ({
          id: p.id,
          label: p.label || p.id,
          stages: (p.stages || []).map((s: any) => ({
            id: s.id,
            label: s.label || s.id,
          })),
        }));
        setPipelines(formattedPipelines);
      }
      
      if (data.pipelines) {
        setPipelineLabels(data.pipelines);
      }
      
      if (data.stages) {
        setStageLabels(data.stages);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  // Load companies
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      // Use with-deals API to get companies with their associated deals
      const response = await fetch('/api/admin/hubspot/companies/with-deals');
      const data = await response.json();
      
      const companiesList = data.companies || [];
      setCompanies(companiesList);
      
      // Extract unique industries
      const uniqueIndustries = Array.from(
        new Set(
          companiesList
            .map((c: Company) => c.industry)
            .filter((ind: string | undefined) => ind && ind.trim() !== '')
        )
      ).sort() as string[];
      setIndustries(uniqueIndustries);
      
      // Geocode companies with addresses
      if (mapLoaded) {
        await geocodeCompanies(companiesList);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save geocoded data to database
  const saveGeocodedData = async (companies: { id: string; lat: number; lng: number; geocodeError?: boolean }[]) => {
    try {
      await fetch('/api/admin/hubspot/companies/geocode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies }),
      });
    } catch (error) {
      console.warn('Failed to save geocoded data:', error);
    }
  };

  const geocodeAddress = async (company: Company): Promise<GeocodedCompany | null> => {
    // If company already has valid geocoded data, use it
    if (company.lat && company.lng && !company.geocodeError) {
      return { ...company, lat: company.lat, lng: company.lng };
    }
    
    const addressParts = [company.address, company.city, company.state, company.zip].filter(Boolean);
    if (addressParts.length === 0) return null;
    
    const fullAddress = addressParts.join(', ');
    
    // Check cache first
    if (geocodeCacheRef.current.has(fullAddress)) {
      const cached = geocodeCacheRef.current.get(fullAddress)!;
      return { ...company, lat: cached.lat, lng: cached.lng };
    }
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(status));
          }
        });
      });
      
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      
      // Cache the result
      geocodeCacheRef.current.set(fullAddress, { lat, lng });
      
      return { ...company, lat, lng, needsSave: true } as GeocodedCompany & { needsSave: boolean };
    } catch (error) {
      console.warn(`Failed to geocode ${company.name}:`, error);
      return { ...company, lat: 0, lng: 0, geocodeError: true, needsSave: true } as GeocodedCompany & { needsSave: boolean };
    }
  };

  const geocodeCompanies = async (companiesList: Company[], forceRefresh = false) => {
    setGeocoding(true);
    
    // Separate companies that already have geocode data vs those that need geocoding
    const alreadyGeocoded: GeocodedCompany[] = [];
    const needsGeocoding: Company[] = [];
    
    companiesList.forEach(company => {
      const hasAddress = company.address || company.city || company.state || company.zip;
      
      if (!forceRefresh && company.lat && company.lng && !company.geocodeError) {
        // Already has valid geocode data
        alreadyGeocoded.push({ ...company, lat: company.lat, lng: company.lng });
      } else if (hasAddress) {
        // Needs geocoding
        needsGeocoding.push(company);
      }
    });
    
    setGeocodeProgress({ current: alreadyGeocoded.length, total: alreadyGeocoded.length + needsGeocoding.length });
    
    const geocoded: GeocodedCompany[] = [...alreadyGeocoded];
    const newlyGeocoded: { id: string; lat: number; lng: number; geocodeError?: boolean }[] = [];
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < needsGeocoding.length; i += batchSize) {
      const batch = needsGeocoding.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(geocodeAddress));
      
      results.forEach(result => {
        if (result) {
          if (!result.geocodeError) {
            geocoded.push(result);
          }
          // Track newly geocoded for saving to DB
          if ((result as any).needsSave) {
            newlyGeocoded.push({
              id: result.id,
              lat: result.lat,
              lng: result.lng,
              geocodeError: result.geocodeError,
            });
          }
        }
      });
      
      setGeocodeProgress({ 
        current: alreadyGeocoded.length + Math.min(i + batchSize, needsGeocoding.length), 
        total: alreadyGeocoded.length + needsGeocoding.length 
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < needsGeocoding.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Save newly geocoded data to database in background
    if (newlyGeocoded.length > 0) {
      saveGeocodedData(newlyGeocoded);
    }
    
    setGeocodedCompanies(geocoded);
    setGeocoding(false);
    
    // Update markers
    updateMarkers(geocoded);
  };

  const updateMarkers = useCallback((companies: GeocodedCompany[]) => {
    if (!googleMapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;
    
    companies.forEach(company => {
      if (company.lat === 0 && company.lng === 0) return;
      
      // Create custom marker with gradient
      const marker = new window.google.maps.Marker({
        position: { lat: company.lat, lng: company.lng },
        map: googleMapRef.current,
        title: company.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#8b5cf6',
          fillOpacity: 0.9,
          strokeColor: '#a78bfa',
          strokeWeight: 2,
          scale: 8,
        },
      });
      
      marker.addListener('click', () => {
        setSelectedCompany(company);
        
        const content = `
          <div style="
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            min-width: 250px;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${company.name}</h3>
            ${company.industry ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #a5b4fc;">${company.industry}</p>` : ''}
            ${company.address ? `<p style="margin: 8px 0 4px 0; font-size: 13px; color: #c4b5fd;">${company.address}</p>` : ''}
            ${company.city || company.state ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #c4b5fd;">${[company.city, company.state, company.zip].filter(Boolean).join(', ')}</p>` : ''}
            ${company.phone ? `<p style="margin: 8px 0 0 0; font-size: 13px;"><a href="tel:${company.phone}" style="color: #818cf8;">${company.phone}</a></p>` : ''}
          </div>
        `;
        
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(googleMapRef.current, marker);
      });
      
      markersRef.current.push(marker);
      bounds.extend({ lat: company.lat, lng: company.lng });
      hasValidBounds = true;
    });
    
    if (hasValidBounds) {
      googleMapRef.current.fitBounds(bounds);
      // Don't zoom in too much
      const listener = googleMapRef.current.addListener('idle', () => {
        if (googleMapRef.current.getZoom() > 15) {
          googleMapRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, []);

  // Re-geocode when map becomes available
  useEffect(() => {
    if (mapLoaded && companies.length > 0 && geocodedCompanies.length === 0) {
      geocodeCompanies(companies);
    }
  }, [mapLoaded, companies]);

  // Get stages for selected pipeline
  const availableStages = selectedPipeline === 'all' 
    ? [] 
    : pipelines.find(p => p.id === selectedPipeline)?.stages || [];

  // Filter companies based on search, industry, pipeline, and stage
  const filteredCompanies = geocodedCompanies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    
    // Pipeline and stage filtering
    let matchesPipelineStage = true;
    if (selectedPipeline !== 'all' || selectedStage !== 'all') {
      const companyDeals = company.deals || [];
      if (companyDeals.length === 0) {
        matchesPipelineStage = false;
      } else {
        matchesPipelineStage = companyDeals.some(deal => {
          const matchesPipeline = selectedPipeline === 'all' || deal.pipeline === selectedPipeline;
          const matchesStage = selectedStage === 'all' || deal.dealstage === selectedStage;
          return matchesPipeline && matchesStage;
        });
      }
    }
    
    return matchesSearch && matchesIndustry && matchesPipelineStage;
  });

  // Update markers when filters change
  useEffect(() => {
    if (mapLoaded && filteredCompanies.length > 0) {
      updateMarkers(filteredCompanies);
    }
  }, [filteredCompanies, mapLoaded, updateMarkers]);

  const handleReGeocode = () => {
    geocodeCompanies(companies, true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm/companies">
            <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-100">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Companies
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <MapPin className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Company Locations Map</h1>
              <p className="text-sm text-purple-300">
                {filteredCompanies.length} of {geocodedCompanies.length} companies with mapped locations
                {selectedPipeline !== 'all' && (
                  <span className="ml-2 text-purple-400">
                    • Filtered by: {pipelines.find(p => p.id === selectedPipeline)?.label || selectedPipeline}
                    {selectedStage !== 'all' && ` / ${availableStages.find(s => s.id === selectedStage)?.label || selectedStage}`}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Search companies by name, city, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 bg-slate-800/50 border-purple-500/30 text-white placeholder:text-purple-300/50"
            />
          </div>
          
          {/* Industry Filter */}
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-purple-500/30 text-white">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-500/30">
              <SelectItem value="all" className="text-white hover:bg-purple-500/20">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry} className="text-white hover:bg-purple-500/20">
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Pipeline Filter */}
          <Select 
            value={selectedPipeline} 
            onValueChange={(value) => {
              setSelectedPipeline(value);
              setSelectedStage('all'); // Reset stage when pipeline changes
            }}
          >
            <SelectTrigger className="w-44 bg-slate-800/50 border-purple-500/30 text-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <SelectValue placeholder="All Pipelines" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-500/30">
              <SelectItem value="all" className="text-white hover:bg-purple-500/20">All Pipelines</SelectItem>
              {pipelines.map(pipeline => (
                <SelectItem key={pipeline.id} value={pipeline.id} className="text-white hover:bg-purple-500/20">
                  {pipeline.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Stage Filter - Only show when pipeline is selected */}
          {selectedPipeline !== 'all' && availableStages.length > 0 && (
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-44 bg-slate-800/50 border-purple-500/30 text-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <SelectValue placeholder="All Stages" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-purple-500/30">
                <SelectItem value="all" className="text-white hover:bg-purple-500/20">All Stages</SelectItem>
                {availableStages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id} className="text-white hover:bg-purple-500/20">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Re-geocode Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReGeocode}
            disabled={geocoding}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${geocoding ? 'animate-spin' : ''}`} />
            Re-geocode All
          </Button>
          
          {/* List View Link */}
          <Link href="/admin/crm/companies">
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Loading Overlay */}
        {(loading || geocoding) && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <Card className="bg-slate-800/90 border-purple-500/30 p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <MapPin className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {loading ? 'Loading companies...' : 'Processing locations...'}
                  </p>
                  {geocoding && geocodeProgress.total > 0 && (
                    <>
                      <p className="text-purple-300 text-sm mt-1">
                        {geocodeProgress.current} of {geocodeProgress.total} locations
                      </p>
                      <p className="text-purple-400/60 text-xs mt-1">
                        Using cached data when available
                      </p>
                    </>
                  )}
                </div>
                {geocoding && geocodeProgress.total > 0 && (
                  <div className="w-64 h-2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${(geocodeProgress.current / geocodeProgress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
        
        {/* Selected Company Panel */}
        {selectedCompany && (
          <div className="absolute top-4 right-4 w-80">
            <Card className="bg-slate-800/95 border-purple-500/30 p-4 backdrop-blur">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white">{selectedCompany.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompany(null)}
                  className="h-6 w-6 p-0 text-purple-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedCompany.industry && (
                <p className="text-purple-300 text-sm mb-3">{selectedCompany.industry}</p>
              )}
              
              <div className="space-y-2 text-sm">
                {(selectedCompany.address || selectedCompany.city) && (
                  <div className="flex items-start gap-2 text-purple-200">
                    <MapPin className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {selectedCompany.address && <p>{selectedCompany.address}</p>}
                      <p>{[selectedCompany.city, selectedCompany.state, selectedCompany.zip].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                )}
                
                {selectedCompany.phone && (
                  <div className="flex items-center gap-2 text-purple-200">
                    <Phone className="h-4 w-4 text-purple-400" />
                    <a href={`tel:${selectedCompany.phone}`} className="hover:text-purple-100">
                      {selectedCompany.phone}
                    </a>
                  </div>
                )}
                
                {selectedCompany.website && (
                  <div className="flex items-center gap-2 text-purple-200">
                    <Globe className="h-4 w-4 text-purple-400" />
                    <a 
                      href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-100 truncate"
                    >
                      {selectedCompany.website}
                    </a>
                  </div>
                )}
                
                {selectedCompany.employees && (
                  <div className="flex items-center gap-2 text-purple-200">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>{selectedCompany.employees} employees</span>
                  </div>
                )}
              </div>
              
              {/* Deals Section */}
              {selectedCompany.deals && selectedCompany.deals.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Deals ({selectedCompany.deals.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedCompany.deals.slice(0, 5).map(deal => (
                      <div 
                        key={deal.id} 
                        className="text-xs bg-purple-900/30 rounded p-2"
                      >
                        <div className="font-medium text-white truncate">{deal.dealname}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-purple-300">
                            {pipelineLabels[deal.pipeline] || deal.pipeline}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            deal.isWon ? 'bg-green-500/20 text-green-300' :
                            deal.isLost ? 'bg-red-500/20 text-red-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {stageLabels[`${deal.pipeline}:${deal.dealstage}`] || deal.dealstage}
                          </span>
                        </div>
                        {deal.amount && deal.amount !== '0' && (
                          <div className="text-green-400 mt-1">
                            ${parseFloat(deal.amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedCompany.deals.length > 5 && (
                      <p className="text-xs text-purple-400 text-center">
                        +{selectedCompany.deals.length - 5} more deals
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-purple-500/20 flex gap-2">
                <Link href={`/admin/crm/companies?search=${encodeURIComponent(selectedCompany.name)}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
                    View Details
                  </Button>
                </Link>
                <a 
                  href={getCompanyLinkClient(selectedCompany.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    HubSpot
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        )}
        
        {/* No Results Message */}
        {!loading && !geocoding && filteredCompanies.length === 0 && geocodedCompanies.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Card className="bg-slate-800/95 border-purple-500/30 p-6 text-center pointer-events-auto">
              <AlertCircle className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-medium mb-1">No companies match your filters</h3>
              <p className="text-purple-300 text-sm">Try adjusting your search or industry filter</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

