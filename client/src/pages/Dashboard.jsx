import { Link } from "react-router-dom";
import { Badge, PageHead, fmtDate, guard, useData } from "../ui.jsx";

export default function Dashboard() {
  const { data, error } = useData("/dashboard");
  const wait = guard(data, error);
  if (wait) return wait;

  const { stats, topSkills, pipeline, recent } = data;
  const maxSkill = topSkills[0]?.total || 1;
  const maxPipeline = pipeline[0]?.total || 1;

  return (
    <>
      <PageHead title="Dashboard" subtitle="Where your candidates, jobs and hiring pipeline stand today.">
        <Link className="btn" to="/candidates/new">Add candidate</Link>
      </PageHead>

      <div className="stats">
        <div className="stat"><span>{stats.candidates}</span>Candidates</div>
        <div className="stat"><span>{stats.jobs}</span>Open jobs</div>
        <div className="stat"><span>{stats.applications}</span>Applications</div>
        <div className="stat"><span>{stats.interviews}</span>Interviews</div>
      </div>

      <div className="grid2">
        <section className="card">
          <h2>Most common candidate skills</h2>
          {topSkills.length === 0 && <p className="empty">No skills recorded yet. Add skills to candidate profiles.</p>}
          {topSkills.map((s) => (
            <div className="bar-row" key={s.skill_name}>
              <label>{s.skill_name}</label>
              <div className="bar"><i style={{ width: `${(s.total / maxSkill) * 100}%` }} /></div>
              <b>{s.total}</b>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Application pipeline</h2>
          {pipeline.length === 0 && <p className="empty">No applications yet.</p>}
          {pipeline.map((p) => (
            <div className="bar-row" key={p.status}>
              <label><Badge value={p.status} /></label>
              <div className="bar amber"><i style={{ width: `${(p.total / maxPipeline) * 100}%` }} /></div>
              <b>{p.total}</b>
            </div>
          ))}
        </section>
      </div>

      <section className="card">
        <h2>Recently added candidates</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Location</th><th>Added</th></tr></thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan="4" className="empty">No candidates yet.</td></tr>}
              {recent.map((c) => (
                <tr key={c.candidate_id}>
                  <td><Link to={`/candidates/${c.candidate_id}`}>{c.name}</Link></td>
                  <td>{c.email}</td>
                  <td>{c.location}</td>
                  <td>{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
