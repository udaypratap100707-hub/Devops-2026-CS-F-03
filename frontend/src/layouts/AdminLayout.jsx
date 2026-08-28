import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Building2, Briefcase, FileText, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/admin", "Dashboard", LayoutDashboard], ["/admin/students", "Students", Users],
  ["/admin/companies", "Companies", Building2], ["/admin/jobs", "Jobs", Briefcase],
  ["/admin/applications", "Applications", FileText], ["/admin/statistics", "Statistics", BarChart3]
];

export default function AdminLayout() {
  const { logout } = useAuth(); const navigate = useNavigate();
  return <div className="dashboard-shell">
    <aside className="sidebar"><div className="side-brand">PlaceMate</div>
      {links.map(([to, label, Icon]) => <NavLink key={to} end={to === "/admin"} to={to}><Icon size={19}/>{label}</NavLink>)}
      <button className="logout" onClick={() => {logout(); navigate("/");}}><LogOut size={19}/> Logout</button>
    </aside>
    <section className="dashboard-main"><div className="dashboard-top"><span>Administration</span><strong>Admin</strong></div><Outlet/></section>
  </div>;
}
