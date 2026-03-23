import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import "./Admin.css";

const Admin = () => {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(adminService.getToken()));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(adminService.getToken()));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadStats = async () => {
      try {
        setError("");
        const data = await adminService.getStats();
        if (!mounted) return;
        setStats(data);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || "Unable to load admin stats";
        setError(message);
        if (message.toLowerCase().includes("token")) {
          adminService.clearToken();
          setIsAuthenticated(false);
          setStats(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setLoggingIn(true);
    setError("");

    try {
      await adminService.login(password, code);
      setIsAuthenticated(true);
      setLoading(true);
      setPassword("");
      setCode("");
    } catch (err) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminService.clearToken();
    setIsAuthenticated(false);
    setStats(null);
    setError("");
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-page">
        <section className="admin-login-card">
          <h1>Admin Login</h1>
          <p>Enter admin password and security code.</p>

          <div style={{ marginTop: "12px", marginBottom: "6px" }}>
            <Link className="admin-users-link" to="/">
              Home
            </Link>
          </div>

          <form className="admin-login-form" onSubmit={handleAdminLogin}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              required
            />

            <label htmlFor="admin-code">Security Code</label>
            <input
              id="admin-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter admin code"
              required
            />

            {error ? <div className="admin-login-error">{error}</div> : null}

            <button type="submit" disabled={loggingIn}>
              {loggingIn ? "Signing in..." : "Login as Admin"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-panel">Loading admin dashboard...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-page">
        <div className="admin-panel admin-error">{error}</div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Live overview of users and prompt usage.</p>
          </div>
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <div className="admin-stat-grid">
          <article className="admin-stat-card">
            <span>Total Users</span>
            <strong>{stats?.overview?.totalUsers ?? 0}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Total Prompts</span>
            <strong>{stats?.overview?.totalPrompts ?? 0}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Prompts This Month</span>
            <strong>{stats?.overview?.promptsThisMonth ?? 0}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Active Users This Month</span>
            <strong>{stats?.overview?.activeUsersThisMonth ?? 0}</strong>
          </article>
        </div>

        <section className="admin-mode-section">
          <h2>Prompt Mode Usage</h2>
          <div className="admin-mode-grid">
            <div className="admin-mode-card">
              <span>Quick</span>
              <strong>{stats?.promptsByMode?.quick ?? 0}</strong>
            </div>
            <div className="admin-mode-card">
              <span>Balanced</span>
              <strong>{stats?.promptsByMode?.balanced ?? 0}</strong>
            </div>
            <div className="admin-mode-card">
              <span>Auto</span>
              <strong>{stats?.promptsByMode?.auto ?? 0}</strong>
            </div>
            <div className="admin-mode-card">
              <span>Expert</span>
              <strong>{stats?.promptsByMode?.expert ?? 0}</strong>
            </div>
          </div>
        </section>

        <section className="admin-users-nav-section">
          <h2>Separate Admin Pages</h2>
          <p>Open users names and login logs in separate pages.</p>
          <div className="admin-users-links-row">
            <Link className="admin-users-link" to="/admin/users">
              View User Names
            </Link>
            <Link className="admin-users-link" to="/admin/logs">
              View Login Logs
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Admin;