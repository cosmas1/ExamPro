import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import AdminLayout from '../../components/AdminLayout';

export default function BulkUploadUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const data = [
      {
        'First Name': 'Govind',
        'Last Name': 'Prajapat',
        'Email': 'govind512@gmail.com',
        'Registration Number': '8963811371',
        'Password': '123123',
        'Session': 'M26'
      },
      {
        'First Name': 'Mukesh',
        'Last Name': 'Prajapat',
        'Email': 'mukesh2876@gmail.com',
        'Registration Number': '7014971552',
        'Password': '123123',
        'Session': 'S25'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'bulk_users_upload_template.xlsx');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire('Error', 'Please select an excel file', 'error');
      return;
    }

    setLoading(true);
    Swal.fire({
      title: 'Processing Upload...',
      text: 'Please wait while we create accounts...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error('Excel file is empty');
        }

        // Fetch all sessions to map names to IDs
        const sessionsSnap = await getDocs(collection(db, 'sessions'));
        const sessionsMap: Record<string, string> = {};
        sessionsSnap.docs.forEach(doc => {
          sessionsMap[doc.data().name.toLowerCase()] = doc.id;
        });

        // Secondary app for auth creation
        const secondaryAppName = 'BulkApp';
        const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        let successCount = 0;
        let errorCount = 0;

        for (const row of json) {
          try {
            const email = row['Email']?.toString().trim().toLowerCase();
            const password = row['Password']?.toString() || '123123';
            const firstName = row['First Name']?.toString() || '';
            const lastName = row['Last Name']?.toString() || '';
            const regNum = row['Registration Number']?.toString() || '';
            const sessionName = row['Session']?.toString().trim().toLowerCase() || '';
            
            // Resolve session name to ID
            const resolvedSessionId = sessionsMap[sessionName] || sessionName; 

            if (!email) continue;

            // 1. Create Auth
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const user = userCredential.user;

            // 2. Create Firestore Doc
            await setDoc(doc(db, 'users', user.uid), {
              name: `${firstName} ${lastName}`.trim(),
              email: email,
              role: 'student',
              admissionNumber: regNum,
              sessionId: resolvedSessionId,
              createdAt: serverTimestamp(),
            });

            // 2.1 Create Lookup for admission number
            if (regNum) {
              const sanitizedRegNum = regNum.toString().trim().replace(/\//g, '_');
              await setDoc(doc(db, 'admission_to_email', sanitizedRegNum), {
                email: email,
                uid: user.uid
              });
            }

            // 3. Sign out secondary app
            await signOut(secondaryAuth);
            successCount++;
          } catch (err) {
            console.error('Error creating user:', err);
            errorCount++;
          }
        }

        Swal.fire({
          icon: errorCount > 0 ? 'warning' : 'success',
          title: 'Upload Complete',
          text: `Successfully created ${successCount} users. ${errorCount > 0 ? `Failed ${errorCount} users.` : ''}`,
        });
        navigate('/admin/users');
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activeMenu="Users" activeSubMenu="Bulk Upload Users">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Bulk Users Upload</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Excel batch registration system.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded shadow-sm border-t-2 border-[#3c8dbc]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Bulk entry node</h3>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Selected Excel File</label>
                    <div className="flex border border-slate-200 rounded overflow-hidden shadow-sm">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .csv"
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#f4f4f4] px-4 py-2 text-[10px] border-r border-slate-200 cursor-pointer font-black text-slate-500 hover:bg-slate-200 transition-colors shrink-0 uppercase tracking-tight"
                      >
                        Select Source
                      </button>
                      <div className="flex-1 px-4 py-2 text-xs text-slate-400 flex items-center italic truncate">
                        {selectedFile ? selectedFile.name : 'No file loaded into memory'}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload}
                    disabled={loading || !selectedFile}
                    className="w-full bg-[#00a65a] hover:bg-[#008d4c] text-white px-8 py-3 rounded text-[11px] font-black tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? 'PROCESSING BATCH...' : 'START BULK MIGRATION'}
                  </button>
                </div>

                <div className="flex flex-col justify-center">
                   <button 
                    onClick={handleDownloadSample}
                    className="w-full bg-[#3c8dbc] hover:bg-[#367fa9] text-white p-6 rounded-xl flex items-center justify-center gap-4 group transition-all transform hover:scale-[1.01] shadow-xl text-left"
                   >
                      <div className="bg-white/20 p-3 rounded-full group-hover:rotate-12 transition-transform">
                        <Download className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wider">Download Sample Template</span>
                        <span className="text-[10px] font-normal opacity-70">(Pre-configured columns for auto-sync)</span>
                      </div>
                   </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#f39c12] text-white p-5 rounded font-bold text-sm italic shadow-md border-l-4 border-black/20 flex items-start gap-4">
            <span className="text-lg">⚠️</span>
            <div>
              Security Integrity Protocol! 
              <p className="font-normal not-italic text-[11px] mt-1 opacity-90 tracking-tight leading-relaxed">
                The spreadsheet must follow the exact structure: [First Name | Last Name | Email | Registration Number | Password | Session]. 
                Password defaults to 123123 if omitted. Session values are mapped to user metadata.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
