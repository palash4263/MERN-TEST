import React, { useState } from 'react';
import { uploadDistributionFile } from '../api/distributions';
import { useNavigate } from 'react-router-dom';

export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const allowed = ['.csv'];

  function getExt(n) {
    const m = n ? n.toLowerCase().match(/\.[^\.]+$/) : null;
    return m ? m[0] : '';
  }

  const handleChange = (e) => {
    setErr('');
    setMsg('');
    const f = e.target.files[0];
    if (!f) return setFile(null);
    const ext = getExt(f.name);
    if (!allowed.includes(ext)) {
      setErr('Invalid file type. Allowed: .csv');
      return setFile(null);
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!file) return setErr('Please select a file to upload');
    setLoading(true);
    try {
      const resp = await uploadDistributionFile(file);
      setMsg(`Uploaded. Batch created: ${resp.batchId}. Each agent counts: ${resp.perAgentCounts.join(', ')}`);
      // after success, navigate to distributions page to view (latest)
      navigate('/distributions');
    } catch (error) {
      console.error('Upload error', error);
      setErr(error.message || (error && error.message) || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload CSV </h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv,.xls,.xlsx" onChange={handleChange} />
        {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
        {msg && <div style={{ color: 'green', marginTop: 8 }}>{msg}</div>}
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload & Distribute'}</button>
        </div>
      </form>
      <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
        File must contain headers: FirstName, Phone, Notes (case-insensitive). Phone should include country code preferred.
      </div>
    </div>
  );
}
