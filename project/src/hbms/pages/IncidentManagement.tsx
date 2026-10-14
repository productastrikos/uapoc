import React, { useState } from 'react';
import { Search, Plus, SlidersHorizontal, X, UploadCloud } from 'lucide-react';
import SubsystemMapPanel from '../components/SubsystemMapPanel';

const IncidentManagement: React.FC = () => {
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showLinkedIncident, setShowLinkedIncident] = useState(false);

  return (
    <div className="h-full flex flex-col text-sim-200">
      <div className="px-6 py-4 border-b border-sim-800 bg-primary-800/70 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-sim-200">Incident Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-sim-700 rounded-md text-sm font-medium hover:bg-primary-700/50">
            <SlidersHorizontal className="w-4 h-4" />
            Configure Table View
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-sim-700 rounded-md text-sm font-medium hover:bg-primary-700/50">
            View Self
          </button>
          <button 
            onClick={() => setShowCreateIncident(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Incident
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-sim-800 bg-primary-800/70 flex flex-wrap gap-4 items-center ">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sim-600" />
          <input 
            type="text" 
            placeholder="Search Incident" 
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-primary-900/60 text-sim-200 placeholder-sim-500 border border-sim-700 rounded-md focus:outline-none focus:ring-1 focus:ring-simteal-500"
          />
        </div>
        <select className="w-40 px-3 py-1.5 text-sm bg-primary-900/60 text-sim-200 border border-sim-700 rounded-md focus:outline-none focus:ring-1 focus:ring-simteal-500">
          <option>Status: All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Closed</option>
        </select>
        <select className="w-40 px-3 py-1.5 text-sm bg-primary-900/60 text-sim-200 border border-sim-700 rounded-md focus:outline-none focus:ring-1 focus:ring-simteal-500">
          <option>Priority: All</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
         <div className="bg-primary-800/70 border border-sim-800 rounded-lg  overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-sim-950 border-b border-sim-800 text-xs font-semibold text-sim-400 uppercase">
                <tr>
                  <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-sim-700 accent-simteal-500" /></th>
                  <th className="px-4 py-3">Incident Category</th>
                  <th className="px-4 py-3">Sub System</th>
                  <th className="px-4 py-3">Device Alias</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SOP Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sim-900">
                <tr className="hover:bg-primary-700/50 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-sim-700 accent-simteal-500" /></td>
                  <td className="px-4 py-3 font-medium text-sim-200">Intrusion</td>
                  <td className="px-4 py-3 text-sim-400">SMART SECURITY</td>
                  <td className="px-4 py-3 text-sim-400">Cam-Zone-A</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[length:calc(10px*var(--fs))] rounded border border-red-200">HIGH</span></td>
                  <td className="px-4 py-3 text-sim-400">Security Response Protocol</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">In Progress</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setShowLinkedIncident(true)} className="text-simteal-400 hover:underline text-xs font-medium">Update</button>
                  </td>
                </tr>
                {/* Empty State Mock */}
                {/* <tr><td colSpan={8} className="px-4 py-12 text-center text-sim-600">No Incidents Found</td></tr> */}
              </tbody>
            </table>
         </div>
      </div>

      {/* Slide-out Create Incident */}
      {showCreateIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-sim-100/20 backdrop-blur-sm">
          <div className="w-[500px] bg-primary-800/70 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-sim-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-sim-200">Create Incident</h2>
              <button onClick={() => setShowCreateIncident(false)} className="text-sim-600 hover:text-sim-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Sub System Name <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Zone <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Area <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Location <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Incident Category <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Incident Priority <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-sim-500 mb-1 border-b border-sim-800 pb-1">Incident Description <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-sim-700 mb-1 border-b border-sim-800 pb-1">Additional Information</label>
                  <input type="text" className="w-full text-sm py-1 outline-none text-sim-300 bg-transparent [&>option]:bg-primary-800" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-sim-500 mb-2">Evidence Upload</label>
                <div className="border-2 border-dashed border-sim-700 rounded-lg p-8 flex flex-col items-center justify-center text-sim-500 hover:bg-primary-700/50 hover:border-simteal-600 cursor-pointer transition-colors">
                  <UploadCloud className="w-8 h-8 mb-2 text-sim-600" />
                  <p className="text-sm">Drop your image/video here or <span className="text-simteal-400 font-medium">Browse</span></p>
                  <p className="text-xs text-sim-600 mt-1">Supported formats: png, jpg, pdf, xlsx</p>
                </div>
              </div>

              <div className="h-48 rounded-md overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                <SubsystemMapPanel subsystem="bhs" />
              </div>
            </div>
            <div className="p-4 border-t border-sim-800 bg-sim-950 flex justify-end gap-2">
                <button onClick={() => setShowCreateIncident(false)} className="px-4 py-2 text-sm font-medium hover:bg-sim-900 rounded">Cancel</button>
                <button className="px-4 py-2 bg-simteal-400 hover:bg-simteal-300 text-white rounded text-sm font-medium">Create Incident</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Linked Incident / Collaboration */}
      {showLinkedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-sim-100/20 backdrop-blur-sm">
          <div className="w-[600px] bg-primary-800/70 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-sim-800 flex justify-between items-center bg-sim-950">
              <h2 className="text-lg font-bold text-sim-200">Incident Collaboration</h2>
              <button onClick={() => setShowLinkedIncident(false)} className="text-sim-600 hover:text-sim-400"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="h-[200px] relative overflow-hidden">
                 <SubsystemMapPanel subsystem="bhs" />
               </div>

               <div className="p-6">
                 <h3 className="text-sm font-semibold text-sim-300 mb-3 bg-simteal-950/50 py-1.5 px-3 rounded border border-simteal-900">Linked Incident</h3>
                 <div className="border border-sim-800 rounded-lg overflow-hidden bg-primary-800/70 mb-6">
                   <table className="w-full text-sm">
                     <thead className="bg-sim-950 text-sim-500 text-xs text-left border-b border-sim-800">
                       <tr>
                         <th className="px-4 py-2 font-medium">Incident Name</th>
                         <th className="px-4 py-2 font-medium">Created on</th>
                         <th className="px-4 py-2 font-medium">Created by</th>
                       </tr>
                     </thead>
                     <tbody className="text-sim-300">
                       <tr>
                         <td className="px-4 py-3">INC20260417-4759053998</td>
                         <td className="px-4 py-3">Apr 17, 2026, 1:19:40 PM</td>
                         <td className="px-4 py-3 font-medium">anjali</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>

                 <div className="space-y-4 border-t border-sim-800 pt-6">
                   <div>
                     <label className="block text-sm font-medium text-simteal-400 mb-1">Add Comment <span className="text-sim-600 font-normal">(optional)</span></label>
                     <textarea 
                       className="w-full bg-primary-900/60 text-sim-200 placeholder-sim-500 border border-sim-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-simteal-500"
                       rows={3}
                       placeholder="Type your update here..."
                     ></textarea>
                     <p className="text-xs text-sim-600 mt-1 text-right">Max. 100 characters are allowed</p>
                   </div>

                   <div className="border-2 border-dashed border-sim-700 rounded-lg p-6 flex flex-col items-center justify-center text-sim-500 hover:bg-primary-700/50 cursor-pointer">
                     <p className="text-sm mb-1">Drop your file here or <span className="text-simteal-400 font-medium">Browse</span> (This field is optional)</p>
                     <p className="text-xs text-sim-600">Supported File Formats: png/jpeg/jpg/pdf/xlsx/docx</p>
                     <p className="text-xs font-semibold text-sim-400 mt-2 bg-sim-800 px-2 py-0.5 rounded">No File Selected</p>
                   </div>

                   <div className="flex justify-end gap-2 pt-4">
                     <button onClick={() => setShowLinkedIncident(false)} className="px-4 py-2 border border-sim-700 text-sm font-medium hover:bg-primary-700/50 rounded">Cancel</button>
                     <button className="px-4 py-2 bg-sim-800 text-sim-500 rounded text-sm font-medium cursor-not-allowed">Submit</button>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
