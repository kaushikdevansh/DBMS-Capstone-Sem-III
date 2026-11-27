import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { Badge, Meter, fmtDate, guard, useAction, useData } from "../ui.jsx";

export default function JobDetail() {
  const { id } = useParams();
  const run = useAction();
  const { data, error, reload } = useData(`/jobs/${id}`);
  const wait = guard(data, error);
  if (wait) return wait;

  const { job, required, ranking } = data;

  const apply = async (candidateId) => {
    if (await run(() => api.post("/applications", { candidate_id: candidateId, job_id: id }), "Application submitted")) reload();
  };

  return (
    <>
      <section className="card">
        <h1>{job.title}</h1>
        <div className="profile-meta">
          <span>{job.company_name}</span>
          <span>{job.location}</span>
          <span>Minimum {job.min_experience} years</span>
          <span>Posted {fmtDate(job.posted_date)}</span>
        </div>
        {job.description && <p style={{ marginTop: "1rem" }}>{job.description}</p>}
        <div style={{ marginTop: "0.75rem" }}>
          {required.length === 0 && <span className="muted">No required skills set</span>}
          {required.map((s) => <span className="tag" key={s.skill_name}>{s.skill_name}</span>)}
        </div>
      </section>

      <section className="card">
        <h2>Candidates ranked by match</h2>
        <p className="muted">Score is 70% skill overlap plus 30% experience against the minimum required.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Candidate</th><th>Location</th><th>Experience</th><th>Skills matched</th><th>Match score</th><th></th></tr></thead>
            <tbody>
              {ranking.length === 0 && <tr><td colSpan="6" className="empty">No candidates in the system yet.</td></tr>}
              {ranking.map((r) => (
                <tr key={r.candidate_id}>
                  <td><Link to={`/candidates/${r.candidate_id}`}>{r.name}</Link></td>
                  <td>{r.location}</td>
                  <td>{r.experience} yrs</td>
                  <td>{r.matched} of {required.length}</td>
                  <td><Meter value={r.score} /></td>
                  <td className="right">
                    {r.applied ? <Badge value="Applied" /> : <button className="btn small" onClick={() => apply(r.candidate_id)}>Add application</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
