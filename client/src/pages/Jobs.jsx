import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { PageHead, bind, fmtDate, guard, useAction, useData } from "../ui.jsx";

export default function Jobs() {
  const [company, setCompany] = useState({ company_name: "", location: "" });
  const b = bind(company, setCompany);
  const run = useAction();
  const { data, error, reload } = useData("/jobs");

  const remove = async (j) => {
    if (!window.confirm("Delete this job and its applications?")) return;
    if (await run(() => api.del(`/jobs/${j.job_id}`), "Job deleted")) reload();
  };

  const addCompany = async (event) => {
    event.preventDefault();
    if (await run(() => api.post("/companies", company), "Company added")) setCompany({ company_name: "", location: "" });
  };

  const wait = guard(data, error);

  return (
    <>
      <PageHead title="Jobs" subtitle="Open a job to see candidates ranked by match score.">
        <Link className="btn" to="/jobs/new">Post job</Link>
      </PageHead>
      {wait || (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Company</th><th>Min. experience</th><th>Skills</th><th>Applicants</th><th>Posted</th><th></th></tr></thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan="7" className="empty">No jobs posted yet.</td></tr>}
                {data.map((j) => (
                  <tr key={j.job_id}>
                    <td><Link to={`/jobs/${j.job_id}`}><strong>{j.title}</strong></Link></td>
                    <td>{j.company_name}<div className="muted">{j.location}</div></td>
                    <td>{j.min_experience} yrs</td>
                    <td>{j.skill_count}</td>
                    <td>{j.applicants}</td>
                    <td>{fmtDate(j.posted_date)}</td>
                    <td className="right"><button className="btn small danger" onClick={() => remove(j)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <form className="card" onSubmit={addCompany}>
        <h2>Add company</h2>
        <div className="filters" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <div><label htmlFor="company_name">Company name</label><input id="company_name" required maxLength="100" {...b("company_name")} /></div>
          <div><label htmlFor="company_location">Location</label><input id="company_location" maxLength="100" {...b("location")} /></div>
          <button className="btn" type="submit">Add company</button>
        </div>
      </form>
    </>
  );
}
