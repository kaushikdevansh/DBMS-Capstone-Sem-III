import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { ThemeToggle } from "./theme.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Candidates from "./pages/Candidates.jsx";
import CandidateForm from "./pages/CandidateForm.jsx";
import CandidateDetail from "./pages/CandidateDetail.jsx";
import Skills from "./pages/Skills.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobForm from "./pages/JobForm.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Applications from "./pages/Applications.jsx";
import Interviews from "./pages/Interviews.jsx";
import Reports from "./pages/Reports.jsx";
import Audit from "./pages/Audit.jsx";

const links = [
  ["/", "Dashboard"],
  ["/candidates", "Candidates"],
  ["/skills", "Skills"],
  ["/jobs", "Jobs"],
  ["/applications", "Applications"],
  ["/interviews", "Interviews"],
  ["/reports", "Reports"],
  ["/audit", "Audit log"],
];

export default function App() {
  const { user, ready, logout } = useAuth();

  if (!ready) return <p className="muted" style={{ gridColumn: "1 / -1", padding: "2rem" }}>Loading</p>;
  if (!user) return <Login />;

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          TalentBase
          <small>Candidate profile management</small>
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="user-chip">
            Signed in as
            <strong>{user.name}</strong>
          </div>
          <ThemeToggle />
          <button type="button" className="side-btn" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/new" element={<CandidateForm />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/candidates/:id/edit" element={<CandidateForm />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<p className="empty">This page does not exist.</p>} />
        </Routes>
      </main>
    </>
  );
}
