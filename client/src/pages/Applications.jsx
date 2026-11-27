import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Meter, PageHead, bind, fmtDate, guard, useAction, useData } from "../ui.jsx";

const statuses = ["Applied", "Shortlisted", "Interviewed", "Selected", "Rejected"];

export default function Applications() {
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ candidate_id: "", job_id: "" });
  const b = bind(form, setForm);
  const run = useAction();
  const { data, error, reload } = useData(`/applications${status ? `?status=${status}` : ""}`);
  const lookups = useData("/lookups");

  const add = async (event) => {
    event.preventDefault();
    if (await run(() => api.post("/applications", form), "Application submitted")) {
      setForm({ candidate_id: "", job_id: "" });
      reload();
    }
  };

  const changeStatus = async (a, value) => {
    if (await run(() => api.patch(`/applications/${a.application_id}/status`, { status: value }), "Status updated")) reload();
  };

  const remove = async (a) => {
    if (!window.confirm("Delete this application?")) return;
    if (await run(() => api.del(`/applications/${a.application_id}`), "Application deleted")) reload();
  };

  const wait = guard(data, error);

  return (
    <>
      <PageHead title="Applications" subtitle="The match score is calculated by the database when an application is created." />

      <form className="card" onSubmit={add}>
        <h2>New application</h2>
        <div className="filters" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <div>
            <label htmlFor="candidate_id">Candidate</label>
            <select id="candidate_id" required {...b("candidate_id")}>
              <option value="">Choose candidate</option>
              {lookups.data?.candidates.map((c) => <option key={c.candidate_id} value={c.candidate_id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="job_id">Job</label>
            <select id="job_id" required {...b("job_id")}>
              <option value="">Choose job</option>
              {lookups.data?.jobs.map((j) => <option key={j.job_id} value={j.job_id}>{j.title} at {j.company_name}</option>)}
            </select>
          </div>
          <button className="btn" type="submit">Submit application</button>
        </div>
      </form>

      <div className="actions" style={{ marginBottom: "1rem" }}>
        <button className={`btn small ${status ? "ghost" : ""}`} onClick={() => setStatus("")}>All</button>
        {statuses.map((s) => (
          <button key={s} className={`btn small ${status === s ? "" : "ghost"}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      {wait || (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Candidate</th><th>Job</th><th>Applied</th><th>Match score</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan="6" className="empty">No applications found for this filter.</td></tr>}
                {data.map((a) => (
                  <tr key={a.application_id}>
                    <td><Link to={`/candidates/${a.candidate_id}`}>{a.name}</Link></td>
                    <td><Link to={`/jobs/${a.job_id}`}>{a.title}</Link><div className="muted">{a.company_name}</div></td>
                    <td>{fmtDate(a.applied_date)}</td>
                    <td><Meter value={a.match_score} /></td>
                    <td>
                      <select style={{ width: "auto" }} value={a.status} onChange={(e) => changeStatus(a, e.target.value)}>
                        {statuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="right"><button className="btn small danger" onClick={() => remove(a)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
