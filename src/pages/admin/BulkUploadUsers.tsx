import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Download, Upload
} from 'lucide-react';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';

export default function BulkUploadUsers() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('');

  const handleUpload = () => {
    if (!selectedGroup) {
      Swal.fire('Error', 'Please select a user group', 'error');
      return;
    }
    
    Swal.fire({
      title: 'Uploading...',
      text: 'Simulating user bulk upload',
      timer: 2000,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      Swal.fire('Success', 'Users uploaded successfully!', 'success');
      navigate('/admin/users');
    });
  };

  return (
    <AdminLayout activeMenu="Users" activeSubMenu="Bulk Upload Users">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium">Bulk Users Upload</h2>
          <span className="text-xs text-slate-400 mt-1.5 ml-2">Upload Users via Excel File</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
          <Globe className="w-3 h-3 text-[#3c8dbc]" />
          <span>Home</span>
          <span className="text-slate-300">&gt;</span>
          <span>All Users</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-400">Bulk Upload</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white border-t border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Bulk upload facility</h3>
              <button className="text-slate-300 hover:text-slate-500"><div className="w-4 h-0.5 bg-current" /></button>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Select User Group</label>
                    <select 
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-400 transition-colors bg-white font-medium text-slate-600"
                      value={selectedGroup}
                      onChange={e => setSelectedGroup(e.target.value)}
                    >
                      <option value="">Select user group</option>
                      <option value="Free">Free</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Upload File</label>
                    <div className="flex border border-slate-300 rounded overflow-hidden shadow-sm">
                      <input type="file" id="bulk-users" className="hidden" />
                      <label htmlFor="bulk-users" className="bg-[#f4f4f4] px-4 py-2 text-xs border-r border-slate-300 cursor-pointer font-bold text-slate-600 hover:bg-slate-200 transition-colors shrink-0 uppercase tracking-tight">Choose File</label>
                      <div className="flex-1 px-4 py-2 text-xs text-slate-400 flex items-center italic">No file chosen</div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload}
                    className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-8 py-2 rounded text-sm font-bold transition-all shadow-md active:transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Users Now
                  </button>
                </div>

                <div className="flex flex-col justify-center">
                   <button className="w-full bg-[#7000df] hover:bg-[#6000c0] text-white p-6 rounded-xl flex items-center justify-center gap-4 group transition-all transform hover:scale-[1.01] shadow-xl text-left">
                      <div className="bg-white/20 p-3 rounded-full group-hover:rotate-12 transition-transform">
                        <Download className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wider">Download Sample Excel File</span>
                        <span className="text-[10px] font-normal opacity-70">(Used for users bulk upload)</span>
                      </div>
                   </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#f39c12] text-white p-5 rounded font-bold text-sm italic shadow-md border-l-4 border-black/20">
            Security Note! <span className="font-normal not-italic text-xs ml-2 opacity-90 tracking-tight">User data is sensitive. Ensure the excel file contains correct Registration Numbers and Emails as they are used for login.</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
