import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [agents, setAgents] = useState([]);
  const [agentsMeta, setAgentsMeta] = useState({ total: 0 });
  const [loadingAgents, setLoadingAgents] = useState(true);

  const [latestBatch, setLatestBatch] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loadingDist, setLoadingDist] = useState(true);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // helper to build headers
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // fetch user info
    (async () => {
      try {
        const resp = await fetch(`${apiBase}/auth/me`, { headers: authHeaders });
        const data = await resp.json();
        if (!resp.ok) throw data;
        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch user', err);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoadingUser(false);
      }
    })();

    // fetch top 5 agents + meta
    (async () => {
      setLoadingAgents(true);
      try {
        const resp = await fetch(`${apiBase}/agents?page=1&limit=5`, { headers: authHeaders });
        const data = await resp.json();
        if (!resp.ok) throw data;
        setAgents(data.data || []);
        setAgentsMeta(data.meta || { total: 0 });
      } catch (err) {
        console.error('Failed to fetch agents', err);
      } finally {
        setLoadingAgents(false);
      }
    })();

    // fetch latest distributions
    (async () => {
      setLoadingDist(true);
      try {
        const resp = await fetch(`${apiBase}/distributions`, { headers: authHeaders });
        const data = await resp.json();
        if (!resp.ok) throw data;
        if (data.batch) {
          setLatestBatch(data.batch);
        }
        
        const total = (data.distributions || []).reduce((acc, cur) => acc + (cur.tasks?.length || 0), 0);
        setTotalTasks(total);
      } catch (err) {
        
        console.warn('No distributions yet or failed to fetch:', err);
        setLatestBatch(null);
        setTotalTasks(0);
      } finally {
        setLoadingDist(false);
      }
    })();
  }, [token]);

  const initials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header card">
        <div className="header-left">

          <div>
            <h2 className="welcome">Welcome{user?.name ? `, ${user.name}` : ''}</h2>

          </div>
        </div>

        <div className="header-right">
          <button className="action primary" onClick={() => navigate('/agents')}>
            View Agents
          </button>
          <button className="action primary" onClick={() => navigate('/agents/add')}>
            + Add Agent
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card card">
          <div className="stat-label">Agents</div>
          <div className="stat-value">{loadingAgents ? '—' : agentsMeta.total ?? 0}</div>
          <div className="stat-note">Most recent 5 shown below</div>
        </div>

        <div className="stat-card card">
          <div className="stat-label">Latest Batch</div>
          <div className="stat-value">
            {loadingDist ? '—' : latestBatch ? latestBatch.filename : 'No batch'}
          </div>
          <div className="stat-note">{latestBatch ? `Total: ${latestBatch.totalItems}` : 'Upload CSV to distribute'}</div>
        </div>

        <div className="stat-card card">
          <div className="stat-label">Total Assigned Tasks</div>
          <div className="stat-value">{loadingDist ? '—' : totalTasks}</div>
          <div className="stat-note">Across all agents (latest batch)</div>
        </div>
      </section>

    </main>
  );
}
