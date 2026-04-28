import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';

export default function AdminDataRepair() {
  const [loading, setLoading] = useState(false);

  const repairData = async () => {
    setLoading(true);
    try {
      const q = collection(db, 'admission_to_email');
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;

      for (const docSnapshot of querySnapshot.docs) {
        if (docSnapshot.id.includes('/')) {
            const newId = docSnapshot.id.replace(/\//g, '_');
            const newDocRef = doc(db, 'admission_to_email', newId);
            batch.set(newDocRef, docSnapshot.data());
            batch.delete(docSnapshot.ref);
            count++;
        }
      }

      if (count > 0) {
        await batch.commit();
        Swal.fire('Success', `Repaired ${count} admission number references.`, 'success');
      } else {
        Swal.fire('Info', 'No corrupted admission number references found.', 'info');
      }
    } catch (error: any) {
      console.error('Repair Error:', error);
      Swal.fire('Error', 'Failed to repair data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-2">Data Administration</h3>
      <p className="text-xs text-slate-500 mb-4">Click below to fix old admission number login references (e.g., replace '/' with '_').</p>
      <button
        onClick={repairData}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Repairing...' : 'Repair Admission Lookups'}
      </button>
    </div>
  );
}
