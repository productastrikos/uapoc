import React, { useState } from 'react';
import { Search, Plus, SlidersHorizontal, X, UploadCloud } from 'lucide-react';
import SubsystemMapPanel from '../components/SubsystemMapPanel';

const IncidentManagement: React.FC = () => {
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showLinkedIncident, setShowLinkedIncident] = useState(false);

  return (
    <div className="h-full flex flex-col text-text-primary bg-primary-900">
      <div className="px-6 py-4 border-b border-primary-600/40 bg-primary-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Incident Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <SlidersHorizontal className="w-4 h-4" />
            Configure Table View
          </button>
          <button className="btn btn-secondary">
            View Self
          </button>
          <button
            onClick={() => setShowCreateIncident(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Incident
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-primary-600/30 bg-primary-800/60 flex flex-wrap gap-4 items-center ">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search Incident"
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-primary-800 text-text-primary placeholder-text-muted border border-primary-600 rounded-md outline-none focus:border-accent-blue transition-colors"
          />
        </div>
        <select className="w-40 px-3 py-1.5 text-sm bg-primary-800 text-text-primary border border-primary-600 rounded-md outline-none focus:border-accent-blue transition-colors">
          <option>Status: All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Closed</option>
        </select>
        <select className="w-40 px-3 py-1.5 text-sm bg-primary-800 text-text-primary border border-primary-600 rounded-md outline-none focus:border-accent-blue transition-colors">
          <option>Priority: All</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
         <div className="bg-primary-800/60 border border-primary-600/40 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary-800 border-b border-primary-600/40 text-xs font-semibold text-text-secondary uppercase">
                <tr>
                  <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-primary-600 accent-accent-blue" /></th>
                  <th className="px-4 py-3">Incident Category</th>
                  <th className="px-4 py-3">Sub System</th>
                  <th className="px-4 py-3">Device Alias</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SOP Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-700/60">
                <tr className="hover:bg-primary-700/40 transition-colors">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-primary-600 accent-accent-blue" /></td>
                  <td className="px-4 py-3 font-medium text-text-primary">Intrusion</td>
                  <td className="px-4 py-3 text-text-secondary">SMART SECURITY</td>
                  <td className="px-4 py-3 text-text-secondary">Cam-Zone-A</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-status-error/10 text-red-300 font-bold text-[length:calc(10px*var(--fs))] rounded border border-status-error/30">HIGH</span></td>
                  <td className="px-4 py-3 text-text-secondary">Security Response Protocol</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-status-warning/10 text-amber-300 border border-status-warning/30">In Progress</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setShowLinkedIncident(true)} className="text-accent-blue hover:underline text-xs font-medium">Update</button>
                  </td>
                </tr>
                {/* Empty State Mock */}
                {/* <tr><td colSpan={8} className="px-4 py-12 text-center text-text-muted">No Incidents Found</td></tr> */}
              </tbody>
            </table>
         </div>
      </div>

      {/* Slide-out Create Incident */}
      {showCreateIncident && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateIncident(false)} />
          <div className="relative w-[500px] modal-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-primary-600/40 flex justify-between items-center bg-primary-800">
              <h2 className="text-lg font-bold text-white">Create Incident</h2>
              <button onClick={() => setShowCreateIncident(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Sub System Name <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Zone <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Area <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Location <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Incident Category <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Incident Priority <span className="text-red-500">*</span></label>
                  <select className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800"><option></option></select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Incident Description <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1 border-b border-primary-600 pb-1">Additional Information</label>
                  <input type="text" className="w-full text-sm py-1 outline-none text-text-secondary bg-transparent [&>option]:bg-primary-800" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs text-text-muted mb-2">Evidence Upload</label>
                <div className="border-2 border-dashed border-primary-600 rounded-lg p-8 flex flex-col items-center justify-center text-text-muted hover:bg-primary-700/50 hover:border-accent-blue/60 cursor-pointer transition-colors">
                  <UploadCloud className="w-8 h-8 mb-2 text-text-muted" />
                  <p className="text-sm">Drop your image/video here or <span className="text-accent-blue font-medium">Browse</span></p>
                  <p className="text-xs text-text-muted mt-1">Supported formats: png, jpg, pdf, xlsx</p>
                </div>
              </div>

              <div className="h-48 rounded-md overflow-hidden relative border border-primary-600/40">
                <SubsystemMapPanel subsystem="bhs" />
              </div>
            </div>
            <div className="p-4 border-t border-primary-600/40 bg-primary-800 flex justify-end gap-2">
                <button onClick={() => setShowCreateIncident(false)} className="btn btn-secondary">Cancel</button>
                <button className="btn btn-primary">Create Incident</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Linked Incident / Collaboration */}
      {showLinkedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowLinkedIncident(false)} />
          <div className="relative w-[600px] modal-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-primary-600 flex justify-between items-center bg-primary-900">
              <h2 className="text-lg font-bold text-text-primary">Incident Collaboration</h2>
              <button onClick={() => setShowLinkedIncident(false)} className="text-text-muted hover:text-text-secondary"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="h-[200px] relative overflow-hidden">
                 <SubsystemMapPanel subsystem="bhs" />
               </div>

               <div className="p-6">
                 <h3 className="text-sm font-semibold text-text-secondary mb-3 bg-accent-blue/10 py-1.5 px-3 rounded border border-accent-blue/30">Linked Incident</h3>
                 <div className="border border-primary-600 rounded-lg overflow-hidden bg-primary-800/70 mb-6">
                   <table className="w-full text-sm">
                     <thead className="bg-primary-900 text-text-muted text-xs text-left border-b border-primary-600">
                       <tr>
                         <th className="px-4 py-2 font-medium">Incident Name</th>
                         <th className="px-4 py-2 font-medium">Created on</th>
                         <th className="px-4 py-2 font-medium">Created by</th>
                       </tr>
                     </thead>
                     <tbody className="text-text-secondary">
                       <tr>
                         <td className="px-4 py-3">INC20260417-4759053998</td>
                         <td className="px-4 py-3">Apr 17, 2026, 1:19:40 PM</td>
                         <td className="px-4 py-3 font-medium">anjali</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>

                 <div className="space-y-4 border-t border-primary-600 pt-6">
                   <div>
                     <label className="block text-sm font-medium text-accent-blue mb-1">Add Comment <span className="text-text-muted font-normal">(optional)</span></label>
                     <textarea 
                       className="w-full bg-primary-900/60 text-text-primary placeholder-text-muted border border-primary-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue"
                       rows={3}
                       placeholder="Type your update here..."
                     ></textarea>
                     <p className="text-xs text-text-muted mt-1 text-right">Max. 100 characters are allowed</p>
                   </div>

                   <div className="border-2 border-dashed border-primary-600 rounded-lg p-6 flex flex-col items-center justify-center text-text-muted hover:bg-primary-700/50 cursor-pointer">
                     <p className="text-sm mb-1">Drop your file here or <span className="text-accent-blue font-medium">Browse</span> (This field is optional)</p>
                     <p className="text-xs text-text-muted">Supported File Formats: png/jpeg/jpg/pdf/xlsx/docx</p>
                     <p className="text-xs font-semibold text-text-secondary mt-2 bg-primary-700 px-2 py-0.5 rounded">No File Selected</p>
                   </div>

                   <div className="flex justify-end gap-2 pt-4">
                     <button onClick={() => setShowLinkedIncident(false)} className="btn btn-secondary">Cancel</button>
                     <button className="btn btn-primary opacity-60 cursor-not-allowed">Submit</button>
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
