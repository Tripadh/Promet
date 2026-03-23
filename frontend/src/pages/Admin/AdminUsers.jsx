import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { adminService } from "../../services/adminService";
import "./Admin.css";

const AdminUsers = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = adminService.getToken();

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        setError("");
        const data = await adminService.getUsers();
        if (!mounted) return;
        setStats(data);
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || "Unable to load users";
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const users = useMemo(() => stats?.users || [], [stats]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to completely delete "${userName}" and all their data? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await adminService.deleteUser(userId);
      setStats(prev => ({
        ...prev,
        users: prev.users.filter(u => u._id !== userId)
      }));
    } catch (err) {
      alert("Failed to delete user. " + (err?.response?.data?.message || ""));
    }
  };

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        <header className="admin-header">
          <div>
            <h1>Signed User Names</h1>
            <p>All registered user names in a separate page.</p>
          </div>
          <Link className="admin-users-link" to="/admin">
            Back to Dashboard
          </Link>
        </header>

        {loading ? (
          <div className="admin-table-section">Loading users...</div>
        ) : error ? (
          <div className="admin-table-section admin-error">{error}</div>
        ) : (
          <section className="admin-table-section">
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id || `${user.name}-${user.createdAt}`}>
                      <td>{user.name || "-"}</td>
                      <td>{user.email || "-"}</td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="btn-outline"
                          style={{
                            padding: "6px 12px", 
                            fontSize: "12px", 
                            borderColor: "rgba(239,68,68,0.4)", 
                            color: "#fca5a5"
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td colSpan={4}>No signed users found.</td>
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

export default AdminUsers;