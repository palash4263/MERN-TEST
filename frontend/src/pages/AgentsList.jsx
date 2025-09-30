import React, { useEffect, useState } from 'react';
import { getAgents } from '../api/agents';
import { useNavigate } from 'react-router-dom';

export default function AgentsList() {
  const [agents, setAgents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const fetchAgents = async (opts = {}) => {
    setLoading(true);
    setErr('');
    try {
      const res = await getAgents({
        page: opts.page || meta.page,
        limit: opts.limit || meta.limit,
        search: opts.search ?? search
      });
      setAgents(res.data || []);
      setMeta(res.meta || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (e) {
      console.error('Fetch agents error:', e);
      setErr((e && e.message) || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchAgents({ page: 1, search });
  };

  return (
    <main className="page-wrap">
      <section className="card list-card">
        <header className="card-head">
          <div>
            <h2>Agents</h2>
            <p className="muted">Search, view and manage your agents.</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <form onSubmit={onSearch} className="search-form" role="search" aria-label="Search agents">
              <div className="input-with-button">
                <input
                  className="search-input"
                  placeholder="Search by name / email / mobile"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search agents"
                  type="search"
                />
                <button className="search-btn" type="submit" aria-label="Search">
                  Search
                </button>
              </div>
            </form>
          </div>
        </header>

        {err && <div className="server-alert error" role="alert">{err}</div>}

        <div className="table-wrap">
          <table className="agents-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Name</th>
                <th style={{ width: '34%' }}>Email</th>
                <th style={{ width: '22%' }}>Mobile</th>
                <th style={{ width: '16%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                // simple loading rows
                Array.from({ length: meta.limit || 5 }).map((_, i) => (
                  <tr className="loading-row" key={i}>
                    <td><div className="skeleton short" /></td>
                    <td><div className="skeleton" /></td>
                    <td><div className="skeleton" /></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton tiny" /></td>
                  </tr>
                ))
              ) : agents.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center' }}>No agents found.</td></tr>
              ) : (
                agents.map((a, idx) => (
                  <tr key={a._id || a.id}>
                    <td className="td-name">
                      <div className="name-wrap">
                        <div className="name-initials">{(a.name || '—').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</div>
                        <div>
                          <div className="name-main">{a.name || '—'}</div>
                          <div className="muted small">{/* optional subtitle */}</div>
                        </div>
                      </div>
                    </td>

                    <td className="td-email">
                      <div className="email-text">{a.email}</div>
                    </td>

                    <td className="td-mobile">
                      <div className="muted">{a.mobile || '—'}</div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div className="actions-cell">
                        <button className="btn tiny" onClick={() => navigate(`/agents/${a._id || a.id}`)}>View</button>
                        {/* future: edit/delete buttons could go here */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="pagination">
            <button
              className="btn ghost"
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchAgents({ page: meta.page - 1 })}
            >
              Prev
            </button>

            <div className="page-info">Page {meta.page} / {meta.pages || 1}</div>

            <button
              className="btn ghost"
              disabled={meta.page >= (meta.pages || 1) || loading}
              onClick={() => fetchAgents({ page: meta.page + 1 })}
            >
              Next
            </button>
          </div>

          <div className="items-info muted">Total: {meta.total}</div>
        </div>
      </section>
    </main>
  );
}
