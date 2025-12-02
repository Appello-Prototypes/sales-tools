"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface ModuleVisualProps {
  className?: string;
}

// 1. CRM, Sales & Estimation - Detailed construction estimate with blueprint aesthetic
export function CRMSalesVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-blue-50 via-blue-100 to-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Construction blueprint pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(59 130 246) 2px, rgb(59 130 246) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgb(59 130 246) 2px, rgb(59 130 246) 4px)' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Detailed estimate document */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-blue-300 relative">
          {/* Blueprint grid lines */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgb(59 130 246) 1px, transparent 1px), linear-gradient(90deg, rgb(59 130 246) 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
          
          {/* Header with company info */}
          <div className="relative z-10 border-b-2 border-blue-400 pb-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold text-gray-900">ESTIMATE #EST-2024-089</div>
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium">Project: Insulation - Hospital Wing</div>
            <div className="text-xs text-gray-500">Client: General Hospital</div>
          </div>
          
          {/* Detailed line items */}
          <div className="relative z-10 space-y-1.5 mb-2">
            <div className="flex justify-between items-start text-xs">
              <div>
                <div className="text-gray-900 font-semibold">Labor</div>
                <div className="text-gray-500">120 hrs @ $80/hr</div>
              </div>
              <div className="font-bold text-gray-900">$9,600</div>
            </div>
            <div className="flex justify-between items-start text-xs">
              <div>
                <div className="text-gray-900 font-semibold">Materials</div>
                <div className="text-gray-500">R-19 Batts, Vapor Barrier</div>
              </div>
              <div className="font-bold text-gray-900">$4,200</div>
            </div>
            <div className="flex justify-between items-start text-xs">
              <div>
                <div className="text-gray-900 font-semibold">Equipment</div>
                <div className="text-gray-500">Spray rig rental</div>
              </div>
              <div className="font-bold text-gray-900">$850</div>
            </div>
          </div>
          
          {/* Total with markup */}
          <div className="relative z-10 pt-2 border-t-2 border-blue-400">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-gray-900">TOTAL ESTIMATE</span>
              <span className="text-base font-bold text-blue-600">$14,650</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Valid for 30 days</div>
          </div>
        </div>
        
        {/* Blueprint roll badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded shadow-lg p-1.5 border-2 border-blue-300">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
        </div>
        
        {/* Quote status indicator */}
        <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md">
          QUOTE READY
        </div>
      </div>
    </div>
  );
}

// 2. Scheduling & Dispatch - Enhanced job site schedule with crew details
export function SchedulingVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Construction site pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(34 197 94) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced job site schedule board */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-green-300">
          {/* Header with date */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-200">
            <div>
              <div className="text-xs font-bold text-gray-900">CREW SCHEDULE</div>
              <div className="text-xs text-gray-500">Today, Dec 15</div>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">3</span>
            </div>
          </div>
          
          {/* Detailed job assignments */}
          <div className="space-y-1.5">
            <div className="bg-green-50 rounded p-2 border-l-3 border-green-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Site A - Hospital</div>
                  <div className="text-xs text-gray-600">Crew 1: 4 workers</div>
                  <div className="text-xs text-gray-500">7:00 AM - 3:30 PM</div>
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded p-2 border-l-3 border-green-600">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Site B - Office</div>
                  <div className="text-xs text-gray-600">Crew 2: 3 workers</div>
                  <div className="text-xs text-gray-500">8:00 AM - 4:00 PM</div>
                </div>
                <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded p-2 border-l-3 border-green-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Site C - Factory</div>
                  <div className="text-xs text-gray-600">Crew 3: 5 workers</div>
                  <div className="text-xs text-gray-500">6:00 AM - 2:30 PM</div>
                </div>
                <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hard hat badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg p-1.5 border-2 border-green-300">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M12,3C6.5,3 2,7.5 2,13C2,18.5 6.5,23 12,23C17.5,23 22,18.5 22,13C22,7.5 17.5,3 12,3M12,5C16.4,5 20,8.6 20,13C20,17.4 16.4,21 12,21C7.6,21 4,17.4 4,13C4,8.6 7.6,5 12,5M12,7C8.7,7 6,9.7 6,13C6,16.3 8.7,19 12,19C15.3,19 18,16.3 18,13C18,9.7 15.3,7 12,7M12,9C14.2,9 16,10.8 16,13C16,15.2 14.2,17 12,17C9.8,17 8,15.2 8,13C8,10.8 9.8,9 12,9M12,11C10.9,11 10,11.9 10,13C10,14.1 10.9,15 12,15C13.1,15 14,14.1 14,13C14,11.9 13.1,11 12,11Z"/>
            </svg>
          </div>
        </div>
        
        {/* Active crews badge */}
        <div className="absolute -bottom-1 -left-1 bg-green-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md">
          3 CREWS ACTIVE
        </div>
      </div>
    </div>
  );
}

// 3. Timesheets & Workforce Admin - Enhanced field timesheet with union details
export function TimesheetsVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-green-50 via-emerald-100 to-green-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Construction site grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgb(34 197 94) 1px, transparent 1px), linear-gradient(90deg, rgb(34 197 94) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced field timesheet card */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-green-300 mb-2">
          {/* Header with GPS and worker info */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-200">
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-900">FIELD TIMESHEET</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">GPS Verified</span>
              </div>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/>
              </svg>
            </div>
          </div>
          
          {/* Worker info */}
          <div className="mb-2 pb-2 border-b border-green-100">
            <div className="text-xs font-semibold text-gray-900">John Smith</div>
            <div className="text-xs text-gray-500">Site: Hospital Wing</div>
          </div>
          
          {/* Time entries */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-green-50 rounded p-1.5">
              <div>
                <div className="text-xs font-semibold text-gray-900">Clock In</div>
                <div className="text-xs text-gray-600">7:00 AM</div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between bg-green-50 rounded p-1.5">
              <div>
                <div className="text-xs font-semibold text-gray-900">Clock Out</div>
                <div className="text-xs text-gray-600">3:30 PM</div>
              </div>
              <div className="text-xs font-bold text-green-600">8.5h</div>
            </div>
          </div>
        </div>
        
        {/* Union payroll badge */}
        <div className="bg-white rounded-lg shadow-md p-2 border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-900">Union Payroll Ready</div>
              <div className="text-xs text-gray-500">Local 95 - Auto Calculated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Equipment & Asset Management - Enhanced equipment card with maintenance
export function EquipmentVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-green-50 via-teal-100 to-cyan-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Industrial pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(20 184 166) 1px, transparent 0)', backgroundSize: '22px 22px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced equipment tag */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-green-300 mb-2">
          {/* QR Code - Using actual QR code SVG */}
          <div className="bg-white p-2 rounded border border-gray-300 mb-2 flex items-center justify-center">
            <div className="relative w-full h-full min-h-[80px] flex items-center justify-center">
              <Image
                src="/images/Untitled design.svg"
                alt="Equipment QR Code"
                width={100}
                height={100}
                className="object-contain"
                style={{ maxWidth: '100px', maxHeight: '100px' }}
              />
            </div>
          </div>
          
          {/* Equipment details */}
          <div className="text-center mb-2">
            <div className="text-xs font-bold text-gray-900">EQUIPMENT #EQ-1234</div>
            <div className="text-xs text-gray-600 font-medium">Spray Rig - Insulation</div>
            <div className="text-xs text-gray-500">Model: SR-2020</div>
          </div>
          
          {/* Status and location */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Active</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">Site A</span>
          </div>
        </div>
        
        {/* Maintenance indicator */}
        <div className="bg-white rounded-lg shadow-md p-2 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">Last Service</div>
            <div className="text-xs font-semibold text-gray-900">Dec 1, 2024</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div className="bg-green-500 h-1 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        
        {/* Tool icons */}
        <div className="absolute -top-2 -left-2 flex gap-1">
          <div className="bg-white rounded shadow-md p-1 border border-green-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600 fill-current">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Job Financials & Cost Control - Enhanced construction job cost report
export function JobFinancialsVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Construction site pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(245 158 11) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced job cost report */}
        <div className="bg-white rounded-lg shadow-xl p-4 border-2 border-amber-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-amber-400">
            <div>
              <div className="text-xs font-bold text-gray-900">JOB COST REPORT</div>
              <div className="text-xs text-gray-500">Hospital Wing Project</div>
            </div>
            <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">$</span>
            </div>
          </div>
          
          {/* Detailed cost breakdown */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 font-semibold">Labor</div>
                <div className="text-xs text-gray-500">320 hrs @ $80/hr</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$45,200</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 font-semibold">Materials</div>
                <div className="text-xs text-gray-500">Insulation, Vapor Barrier</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$28,500</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 font-semibold">Equipment</div>
                <div className="text-xs text-gray-500">Rental & Fuel</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$5,300</div>
            </div>
          </div>
          
          {/* Budget vs Actual */}
          <div className="pt-2 border-t border-gray-200 space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">Budget</div>
              <div className="text-xs font-bold text-green-600">$125K</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">Actual</div>
              <div className="text-xs font-bold text-amber-600">$98K</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full shadow-sm" style={{ width: '78%' }}></div>
          </div>
          
          {/* Profit margin */}
          <div className="text-center pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">Profit Margin</div>
            <div className="text-lg font-bold text-green-600">22%</div>
            <div className="text-xs text-green-600 font-medium">Under Budget ✓</div>
          </div>
        </div>
        
        {/* Calculator badge */}
        <div className="absolute -bottom-2 -right-2 bg-white rounded-full shadow-lg p-2 border-2 border-amber-300">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <path d="M7,2A2,2 0 0,0 5,4V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V4A2,2 0 0,0 17,2H7M7,4H17V20H7V4M8,5V7H16V5H8M8,8V10H16V8H8M8,11V13H13V11H8Z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Project Management - Enhanced construction project board
export function ProjectManagementVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Blueprint pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(245 158 11) 2px, rgb(245 158 11) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgb(245 158 11) 2px, rgb(245 158 11) 4px)' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced project board */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-amber-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200">
            <div>
              <div className="text-xs font-bold text-gray-900">PROJECT BOARD</div>
              <div className="text-xs text-gray-500">3 Active Projects</div>
            </div>
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </div>
          </div>
          
          {/* Enhanced project cards */}
          <div className="space-y-1.5">
            <div className="bg-amber-50 rounded p-2 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Hospital Wing</div>
                  <div className="text-xs text-gray-600">3 jobs active • $125K budget</div>
                </div>
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">H</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded p-2 border-l-4 border-amber-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Office Complex</div>
                  <div className="text-xs text-gray-600">5 jobs active • $98K budget</div>
                </div>
                <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">O</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded p-2 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-900">Factory Retrofit</div>
                  <div className="text-xs text-gray-600">2 jobs active • $45K budget</div>
                </div>
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Blueprint badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded shadow-lg p-1.5 border-2 border-amber-300">
          <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Purchase Order & Inventory Management - Enhanced construction PO
export function PurchaseOrderVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-amber-50 via-orange-100 to-amber-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Industrial pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(245 158 11) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced Purchase Order */}
        <div className="bg-white rounded-lg shadow-xl p-4 border-2 border-amber-300">
          {/* Header */}
          <div className="border-b-2 border-amber-400 pb-2 mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold text-gray-900">PURCHASE ORDER</div>
              <div className="w-6 h-6 bg-amber-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PO</span>
              </div>
            </div>
            <div className="text-xs text-gray-600">#PO-12345</div>
            <div className="text-xs text-gray-500">Project: Hospital Wing</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-600 font-medium">Pending Approval</span>
            </div>
          </div>
          
          {/* Material items with details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-amber-50 rounded p-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-900">Insulation Material</div>
                <div className="text-xs text-gray-600">R-19 Batts (500 sq ft)</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$2,450</div>
            </div>
            <div className="flex items-center justify-between bg-amber-50 rounded p-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-900">Vapor Barrier</div>
                <div className="text-xs text-gray-600">Polyethylene (300 sq ft)</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$850</div>
            </div>
          </div>
          
          {/* Total */}
          <div className="mt-3 pt-2 border-t-2 border-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">TOTAL</span>
              <span className="text-sm font-bold text-amber-600">$3,300</span>
            </div>
          </div>
        </div>
        
        {/* Materials badge */}
        <div className="absolute -bottom-2 -right-2 bg-white rounded-lg shadow-lg p-2 border-2 border-amber-300">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. Safety & Forms - Enhanced construction safety form
export function SafetyVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-red-50 via-pink-100 to-rose-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Safety pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(239 68 68) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Hard hat icon */}
        <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-full shadow-xl flex items-center justify-center relative ring-4 ring-red-200">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
              <path d="M12,3C6.5,3 2,7.5 2,13C2,18.5 6.5,23 12,23C17.5,23 22,18.5 22,13C22,7.5 17.5,3 12,3M12,5C16.4,5 20,8.6 20,13C20,17.4 16.4,21 12,21C7.6,21 4,17.4 4,13C4,8.6 7.6,5 12,5M12,7C8.7,7 6,9.7 6,13C6,16.3 8.7,19 12,19C15.3,19 18,16.3 18,13C18,9.7 15.3,7 12,7M12,9C14.2,9 16,10.8 16,13C16,15.2 14.2,17 12,17C9.8,17 8,15.2 8,13C8,10.8 9.8,9 12,9M12,11C10.9,11 10,11.9 10,13C10,14.1 10.9,15 12,15C13.1,15 14,14.1 14,13C14,11.9 13.1,11 12,11Z"/>
            </svg>
          </div>
        </div>
        
        {/* Enhanced safety form */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-red-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-red-200">
            <div>
              <div className="text-xs font-bold text-gray-900">SAFETY FORM</div>
              <div className="text-xs text-gray-500">Site Inspection</div>
            </div>
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          
          {/* Form fields */}
          <div className="space-y-1.5 mb-2">
            <div className="h-1.5 bg-red-100 rounded"></div>
            <div className="h-1.5 bg-red-100 rounded w-4/5"></div>
            <div className="h-1.5 bg-red-100 rounded w-full"></div>
            <div className="h-1.5 bg-red-100 rounded w-3/4"></div>
            <div className="h-1.5 bg-red-100 rounded w-5/6"></div>
          </div>
          
          {/* Compliance checkboxes */}
          <div className="pt-2 border-t border-red-200 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 rounded bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="text-xs font-semibold text-gray-900">WHMIS Compliant</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 rounded bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="text-xs font-semibold text-gray-900">OSHA Compliant</div>
            </div>
          </div>
        </div>
        
        {/* Safety badge */}
        <div className="absolute -top-2 -left-2 bg-white rounded-full shadow-lg p-1.5 border-2 border-red-300">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. Training & Compliance - Enhanced construction training certificate
export function TrainingVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-red-50 via-rose-100 to-pink-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Certificate pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(239 68 68) 1px, transparent 0)', backgroundSize: '22px 22px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced training certificate */}
        <div className="bg-white rounded-lg shadow-xl p-4 border-4 border-red-400 relative">
          {/* Decorative corners */}
          <div className="absolute top-2 left-2 w-3 h-3 border-2 border-red-500"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-2 border-red-500"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-2 border-red-500"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-2 border-red-500"></div>
          
          {/* Certificate content */}
          <div className="text-center py-2 relative z-10">
            <div className="text-xs font-bold text-red-600 mb-1">CERTIFICATE</div>
            <div className="text-xs text-gray-700 mb-1">of Training Completion</div>
            <div className="h-0.5 bg-red-300 w-3/4 mx-auto mb-2"></div>
            <div className="text-xs text-gray-900 font-semibold mb-1">WHMIS / OSHA</div>
            <div className="text-xs text-gray-600">John Smith</div>
            <div className="text-xs text-gray-500 mt-1">Issued: Jan 2024</div>
            <div className="text-xs text-red-600 font-medium">Expires: Dec 2024</div>
          </div>
        </div>
        
        {/* Enhanced progress card */}
        <div className="bg-white rounded-lg shadow-md p-2.5 mt-3 border border-red-300">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-semibold text-gray-700">Training Progress</div>
            <div className="text-xs font-bold text-red-600">85%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-400 h-full rounded-full shadow-sm" style={{ width: '85%' }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">3 of 4 modules complete</div>
        </div>
        
        {/* Book badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded-lg shadow-lg p-1.5 border-2 border-red-300">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2M18 20H6V4H8V12L10.5 9.75L13 12V4H18V20Z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 10. Progress Billing & Invoicing - Enhanced AIA-style invoice
export function BillingVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-purple-50 via-indigo-100 to-violet-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Invoice pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(147 51 234) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced AIA-style invoice */}
        <div className="bg-white rounded-lg shadow-xl p-4 border-2 border-purple-300">
          {/* Header */}
          <div className="border-b-2 border-purple-400 pb-2 mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold text-gray-900">PROGRESS INVOICE</div>
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
            </div>
            <div className="text-xs text-gray-600">#INV-2024-001</div>
            <div className="text-xs text-gray-500">AIA G702/G703 Format</div>
            <div className="text-xs text-gray-500">Project: Hospital Wing</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Paid</span>
            </div>
          </div>
          
          {/* Invoice items with details */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-start bg-purple-50 rounded p-2">
              <div className="flex-1">
                <div className="text-xs text-gray-700 font-semibold">Labor Hours</div>
                <div className="text-xs text-gray-500">40 hrs @ $65/hr</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$2,600</div>
            </div>
            <div className="flex justify-between items-start bg-purple-50 rounded p-2">
              <div className="flex-1">
                <div className="text-xs text-gray-700 font-semibold">Materials</div>
                <div className="text-xs text-gray-500">Insulation & Vapor Barrier</div>
              </div>
              <div className="text-xs font-bold text-gray-900">$1,250</div>
            </div>
          </div>
          
          {/* Total */}
          <div className="pt-2 border-t-2 border-purple-400">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">TOTAL</span>
              <span className="text-base font-bold text-purple-600">$3,850</span>
            </div>
          </div>
        </div>
        
        {/* Payment badge */}
        <div className="absolute -bottom-2 -right-2 bg-white rounded-full shadow-lg p-2 border-2 border-purple-300">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">$</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 11. Reporting & Dashboards - Enhanced construction business dashboard
export function ReportingVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-purple-50 via-violet-100 to-purple-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Dashboard pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(147 51 234) 1px, transparent 0)', backgroundSize: '18px 18px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced dashboard grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Labor hours chart */}
          <div className="bg-white rounded-lg shadow-md p-2 border border-purple-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Labor</div>
            <div className="flex items-end justify-center gap-1 h-10">
              <div className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t shadow-sm" style={{ height: '50%' }}></div>
              <div className="flex-1 bg-gradient-to-t from-purple-600 to-purple-500 rounded-t shadow-sm" style={{ height: '70%' }}></div>
              <div className="flex-1 bg-gradient-to-t from-purple-700 to-purple-600 rounded-t shadow-sm" style={{ height: '100%' }}></div>
            </div>
          </div>
          
          {/* Material costs chart */}
          <div className="bg-white rounded-lg shadow-md p-2 border border-purple-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Materials</div>
            <div className="flex items-end justify-center gap-1 h-10">
              <div className="flex-1 bg-gradient-to-t from-purple-600 to-purple-500 rounded-t" style={{ height: '100%' }}></div>
              <div className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t" style={{ height: '60%' }}></div>
            </div>
          </div>
          
          {/* Revenue metric */}
          <div className="bg-white rounded-lg shadow-md p-2.5 col-span-2 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Total Revenue</div>
                <div className="text-sm font-bold text-purple-600">$125K</div>
                <div className="text-xs text-green-600 font-medium">↑ 12% vs last month</div>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600 fill-current">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analytics badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded-lg shadow-lg p-1.5 border-2 border-purple-300">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// 12. Human Resources - Enhanced construction crew management
export function HumanResourcesVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Crew pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(147 51 234) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Enhanced crew avatars with hard hats */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white relative">
            <span className="text-white text-sm font-bold relative z-10">A</span>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-purple-700 rounded-t-full"></div>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-xl ring-2 ring-white -mt-2 relative">
            <span className="text-white text-sm font-bold relative z-10">B</span>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-5 bg-purple-800 rounded-t-full"></div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white relative">
            <span className="text-white text-sm font-bold relative z-10">C</span>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-purple-700 rounded-t-full"></div>
          </div>
        </div>
        
        {/* Enhanced employee card */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">JD</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-900">John Doe</div>
              <div className="text-xs text-gray-500">Field Supervisor</div>
              <div className="text-xs text-gray-400">Local 95</div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          
          {/* Enhanced status bars */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-12">Active</span>
              <div className="flex-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-12">Certified</span>
              <div className="flex-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-300 to-purple-400 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* HR badge */}
        <div className="absolute -top-2 -left-2 bg-white rounded-lg shadow-lg p-1.5 border-2 border-purple-300">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// CORE - Foundational Platform - Platform architecture visualization
export function CoreVisual({ className = "" }: ModuleVisualProps) {
  return (
    <div className={`w-full h-full bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 p-6 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      {/* Platform network pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(99 102 241) 1px, transparent 0)', backgroundSize: '28px 28px' }}></div>
      </div>
      
      <div className="relative w-full max-w-[200px] z-10">
        {/* Central platform hub */}
        <div className="relative mb-4">
          {/* Connection lines radiating outward */}
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            {/* Top connections */}
            <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            <line x1="50%" y1="50%" x2="75%" y2="20%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            {/* Side connections */}
            <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            <line x1="50%" y1="50%" x2="15%" y2="50%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            {/* Bottom connections */}
            <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
            <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="rgb(99 102 241)" strokeWidth="1.5" opacity="0.3" />
          </svg>
          
          {/* Central CORE hub */}
          <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white">
            <div className="text-white font-bold text-lg">CORE</div>
            {/* Pulsing sync indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          
          {/* Module nodes around hub */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
          <div className="absolute top-1/4 right-0 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-green-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
          <div className="absolute top-1/4 left-0 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-amber-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
          <div className="absolute bottom-1/4 right-0 translate-y-1/2 translate-x-1/2 w-6 h-6 bg-red-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
          <div className="absolute bottom-1/4 left-0 translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-purple-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 bg-teal-500 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded"></div>
          </div>
        </div>
        
        {/* Platform features card */}
        <div className="bg-white rounded-lg shadow-xl p-3 border-2 border-indigo-300 relative">
          {/* Platform status header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-gray-900">PLATFORM ONLINE</span>
            </div>
            <div className="text-xs text-gray-500">v2.4.1</div>
          </div>
          
          {/* User management section */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-indigo-600 fill-current">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-900">Users & Roles</span>
            </div>
            <div className="flex items-center gap-1 ml-5">
              <div className="w-4 h-4 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">A</div>
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">B</div>
              <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">C</div>
              <div className="text-xs text-gray-500 ml-1">+12</div>
            </div>
          </div>
          
          {/* Sync status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-green-600 fill-current">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              </svg>
              <span className="text-xs text-gray-600">Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          </div>
          
          {/* Platform access indicators */}
          <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-indigo-600 fill-current">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span className="text-xs text-gray-600">Desktop</span>
            </div>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-indigo-600 fill-current">
                <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
              </svg>
              <span className="text-xs text-gray-600">Mobile</span>
            </div>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-indigo-600 fill-current">
                <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
              </svg>
              <span className="text-xs text-gray-600">API</span>
            </div>
          </div>
        </div>
        
        {/* Integration badge */}
        <div className="absolute -top-2 -right-2 bg-white rounded-lg shadow-lg p-1.5 border-2 border-indigo-300">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        {/* Connected modules indicator */}
        <div className="absolute -bottom-1 -left-1 bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md">
          12 MODULES CONNECTED
        </div>
      </div>
    </div>
  );
}

// Mapping function to get the correct visual component
export function getModuleVisual(moduleTitle: string): React.ComponentType<ModuleVisualProps> {
  switch (moduleTitle) {
    case "CRM, Sales & Estimation":
      return CRMSalesVisual;
    case "Scheduling & Dispatch":
      return SchedulingVisual;
    case "Timesheets & Workforce Admin":
      return TimesheetsVisual;
    case "Equipment & Asset Management":
      return EquipmentVisual;
    case "Job Financials & Cost Control":
      return JobFinancialsVisual;
    case "Project Management":
      return ProjectManagementVisual;
    case "Purchase Order & Inventory Management":
      return PurchaseOrderVisual;
    case "Safety & Forms":
      return SafetyVisual;
    case "Training & Compliance":
      return TrainingVisual;
    case "Progress Billing & Invoicing":
      return BillingVisual;
    case "Reporting & Dashboards":
      return ReportingVisual;
    case "Human Resources":
      return HumanResourcesVisual;
    case "CORE":
    case "The Foundational Platform":
      return CoreVisual;
    default:
      return CRMSalesVisual; // fallback
  }
}
