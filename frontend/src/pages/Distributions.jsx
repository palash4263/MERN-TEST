import React, { useEffect, useState } from 'react';
import { getDistributions } from '../api/distributions';

export default function Distributions() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setErr('');
    try {
      const resp = await getDistributions();
      setData(resp);
    } catch (e) {
      console.error('Get distributions error:', e);
      setErr(e.message || 'Failed to load distributions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="card">Loading distributions...</div>;
  if (err) return <div className="card error">{err}</div>;
  if (!data) return null;

  const { batch, distributions } = data;

  return (
    <main className="page-wrap">
      <section className="card list-card">
        <header className="card-head">
          <div>
            <h2>Distributed Lists</h2>
            <p className="muted">
              Batch: <strong>{batch.filename}</strong> — total {batch.totalItems} items — created at{' '}
              {new Date(batch.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <button className="btn" onClick={fetchData}>Refresh</button>
          </div>
        </header>

        <div className="distributions-grid">
          {distributions.map((d, idx) => {
            const aid = d.agent.id;
            const isOpen = !!expanded[aid];
            return (
              <article key={aid} className="agent-card card">
                <div className="agent-top">
                  <div>
                    <div className="agent-title">{d.agent.name || '—'}</div>
                    <div className="muted small">{d.agent.email || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="agent-count">{d.tasks.length}</div>
                    <div className="muted small">Assigned</div>
                    <div style={{ marginTop: 8 }}>
                      <button className="tiny" onClick={() => setExpanded((s) => ({ ...s, [aid]: !s[aid] }))}>
                        {isOpen ? 'Collapse' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="agent-tasks">
                    {d.tasks.length === 0 ? (
                      <div className="muted">No tasks assigned.</div>
                    ) : (
                      <table className="tasks-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>FirstName</th>
                            <th>Phone</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.tasks.map((t, i) => (
                            <tr key={t.id}>
                              <td>{i + 1}</td>
                              <td>{t.firstName}</td>
                              <td>{t.phone}</td>
                              <td>{t.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
