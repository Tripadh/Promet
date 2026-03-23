import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { adminService } from "../../services/adminService";
import "./Admin.css";

const AdminLogs = () => {
  const [logsData, setLogsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = adminService.getToken();

  useEffect(() => {
    let mounted = true;

    const loadLogs = async () => {
      try {
        setError("");
        const data = await adminService.getLogs();
        if (!mounted) return;
        setLogsData(data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Unable to load login logs");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      mounted = false;
    };
  }, []);

  const logs = useMemo(() => logsData?.logs || [], [logsData]);

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        <header className="admin-header">
          <div>
            <h1>Login Logs</h1>
            <p>Separate page for user login history.</p>
          </div>
          <Link className="admin-users-link" to="/admin">
            Back to Dashboard
          </Link>
        </header>

        {loading ? (
          <div className="admin-table-section">Loading logs...</div>
        ) : error ? (
          <div className="admin-table-section admin-error">{error}</div>
        ) : (
          <section className="admin-table-section">
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Method</th>
                    <th>IP</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id || `${log.email}-${log.createdAt}`}>
                      <td>{log.name || "-"}</td>
                      <td>{log.email || "-"}</td>
                      <td>{log.method || "-"}</td>
                      <td>{log.ipAddress || "-"}</td>
                      <td>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {!logs.length && (
                    <tr>
                      <td colSpan={5}>No login logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

export default AdminLogs;