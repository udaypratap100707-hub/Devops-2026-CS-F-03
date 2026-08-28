import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, Briefcase, FileText, Trophy, Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/student", "Dashboard", LayoutDashboard],
  ["/student/profile", "My Profile", User],
  ["/student/jobs", "Available Jobs", Briefcase],
  ["/student/applications", "Applications", FileText],
  ["/student/placement", "Placement", Trophy],
  ["/student/notifications", "Notifications", Bell]
];

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <div className="dashboard-shell">
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="side-brand">PlaceMate</div>
      {links.map(([to, label, Icon]) => <NavLink key={to} end={to === "/student"} to={to} onClick={() => setOpen(false)}>
        <Icon size={19}/>{label}
      </NavLink>)}
      <button className="logout" onClick={() => { logout(); navigate("/"); }}><LogOut size={19}/> Logout</button>
    </aside>
    <section className="dashboard-main">
      <button className="mobile-sidebar" onClick={() => setOpen(!open)}><Menu/></button>
      <div className="dashboard-top"><span>Student Portal</span><strong>{user?.name || "Student"}</strong></div>
      <Outlet />
    </section>
  </div>;
}
