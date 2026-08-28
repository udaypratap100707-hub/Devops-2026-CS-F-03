import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, PlusCircle, Briefcase, Users, UserCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/company", "Dashboard", LayoutDashboard], ["/company/profile", "Company Profile", Building2],
  ["/company/post-job", "Post Job", PlusCircle], ["/company/jobs", "Manage Jobs", Briefcase],
  ["/company/applicants", "Applicants", Users], ["/company/shortlisted", "Shortlisted", UserCheck]
];

export default function CompanyLayout() {
  const { logout } = useAuth(); const navigate = useNavigate();
  return <div className="dashboard-shell">
    <aside className="sidebar"><div className="side-brand">PlaceMate</div>
      {links.map(([to, label, Icon]) => <NavLink key={to} end={to === "/company"} to={to}><Icon size={19}/>{label}</NavLink>)}
      <button className="logout" onClick={() => {logout(); navigate("/");}}><LogOut size={19}/> Logout</button>
    </aside>
    <section className="dashboard-main"><div className="dashboard-top"><span>Company Portal</span><strong>Company</strong></div><Outlet/></section>
  </div>;
}
