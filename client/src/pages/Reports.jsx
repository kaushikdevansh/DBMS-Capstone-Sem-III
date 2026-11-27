import { Link } from "react-router-dom";
import { Badge, PageHead, guard, useData } from "../ui.jsx";

export default function Reports() {
  const { data, error } = useData("/reports");
  const wait = guard(data, error);
  if (wait) return wait;

  const { demand, topMatches, idle, byLocation, perJob } = data;

  return (
    <>
      <PageHead title="Reports" subtitle="Summaries built from joins, grouping and subqueries." />
      <div className="grid2">
        <section className="card">
          <h2>Skill demand and supply</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Skill</th><th>Jobs needing it</th><th>Candidates with it</th></tr></thead>
              <tbody>{demand.map((d) => <tr key={d.skill_name}><td>{d.skill_name}</td><td>{d.jobs_needing}</td><td>{d.candidates_having}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2>Top five matches</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Candidate</th><th>Job</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>
                {topMatches.length === 0 && <tr><td colSpan="4" className="empty">No applications yet.</td></tr>}
                {topMatches.map((t, i) => <tr key={i}><td>{t.name}</td><td>{t.title}</td><td>{t.match_score}%</td><td><Badge value={t.status} /></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2>Applicants and average score per job</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Job</th><th>Applicants</th><th>Average score</th></tr></thead>
              <tbody>{perJob.map((p) => <tr key={p.title}><td>{p.title}</td><td>{p.applicants}</td><td>{p.avg_score ?? ""}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2>Candidates by location</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Location</th><th>Candidates</th><th>Average experience</th></tr></thead>
              <tbody>{byLocation.map((l) => <tr key={l.location}><td>{l.location}</td><td>{l.total}</td><td>{l.avg_experience} yrs</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
      <section className="card">
        <h2>Candidates who have not applied anywhere</h2>
        {idle.length === 0 && <p className="empty">Every candidate has at least one application.</p>}
        {idle.map((i) => (
          <Link className="tag" key={i.candidate_id} to={`/candidates/${i.candidate_id}`}>{i.name}{i.location ? `, ${i.location}` : ""}</Link>
        ))}
      </section>
    </>
  );
}
