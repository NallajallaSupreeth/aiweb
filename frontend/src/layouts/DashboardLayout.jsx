import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div
        className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{ marginLeft: sidebarWidth }}
      >
        <Navbar sidebarWidth={sidebarWidth} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
