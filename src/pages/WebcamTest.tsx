import React, { useRef, useState, useEffect } from 'react';
import StudentLayout from '../components/StudentLayout';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function WebcamTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'requesting' | 'active' | 'error'>('requesting');

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('active');
        }
      } catch (err) {
        setStatus('error');
      }
    }
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <StudentLayout activeMenu="Webcam Test">
      <div className="bg-[#ecf0f5] px-4 py-3 border-b border-white">
        <h2 className="text-xl text-slate-700 font-medium">Webcam Security Test</h2>
      </div>
      <div className="p-4 flex flex-col items-center">
        <div className="max-w-xl w-full bg-slate-900 rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border-4 border-white shadow-xl">
           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
           {status === 'requesting' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                <Camera className="w-12 h-12 mb-4 animate-pulse" />
                <p className="text-sm font-bold uppercase tracking-tighter">Initialising Camera...</p>
             </div>
           )}
           {status === 'error' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 p-8 text-center text-balance">
                <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
                <p className="text-lg font-bold">Webcam Access Denied</p>
                <p className="text-xs text-slate-400 mt-2">Please ensure you have granted camera permissions in your browser settings to proceed with the exam.</p>
             </div>
           )}
        </div>
        
        <div className="mt-8 max-w-xl w-full">
           <div className={`p-4 rounded-xl border flex items-start gap-3 ${status === 'active' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              {status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className={`text-sm font-bold ${status === 'active' ? 'text-green-800' : 'text-blue-800'}`}>
                   {status === 'active' ? 'System Check Passed' : 'Security Protocol'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                   {status === 'active' 
                     ? 'Your webcam is working correctly. You are now verified for secure proctored examination sessions.' 
                     : 'This portal requires active video monitoring to maintain examination integrity. Your identity will be verified periodically.'}
                </p>
              </div>
           </div>
        </div>
      </div>
    </StudentLayout>
  );
}
