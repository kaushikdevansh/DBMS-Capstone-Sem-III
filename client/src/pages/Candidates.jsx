import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { PageHead, bind, guard, useAction, useData } from "../ui.jsx";

const emptyFilters = { q: "", skill: "", location: "", min_exp: "", sort: "name" };

export default function Candidates() {
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const run = useAction();
  const params = new URLSearchParams(Object.entries(applied).filter(([, v]) => v !== ""));
  const { data, error, reload } = useData(`/candidates?${params}`);
  const lookups = useData("/lookups");
  const b = bind(draft, setDraft);

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name} and all related records?`)) return;
    if (await run(() => api.del(`/candidates/${c.candidate_id}`), "Candidate deleted")) reload();
  };

  const submit = (event) => {
    event.preventDefault();
    setApplied(draft);
  };

  const reset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
  };

  const wait = guard(data, error);

  return (
    <>
      <PageHead title="Candidates" subtitle={data ? `${data.length} profile${data.length === 1 ? "" : "s"} found` : ""}>
        <Link className="btn" to="/candidates/new">Add candidate</Link>
      </PageHead>

      <form className="card filters" onSubmit={submit}>
        <div><label htmlFor="q">Name or email</label><input id="q" placeholder="Search" {...b("q")} /></div>
        <div>
          <label htmlFor="skill">Skill</label>
          <select id="skill" {...b("skill")}>
            <option value="">Any skill</option>
            {lookups.data?.skills.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="location">Location</label>
          <select id="location" {...b("location")}>
            <option value="">Any location</option>
            {lookups.data?.locations.map((l) => <option key={l.location}>{l.location}</option>)}
          </select>
        </div>
        <div><label htmlFor="min_exp">Min. years</label><input id="min_exp" type="number" step="0.5" min="0" {...b("min_exp")} /></div>
        <div>
          <label htmlFor="sort">Sort by</label>
          <select id="sort" {...b("sort")}>
            <option value="name">Name</option>
            <option value="experience">Experience</option>
            <option value="recent">Recently added</option>
          </select>
        </div>
        <div className="actions">
          <button className="btn" type="submit">Apply</button>
          <button className="btn ghost" type="button" onClick={reset}>Reset</button>
        </div>
      </form>

      {wait || (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Location</th><th>Experience</th><th>Latest degree</th><th>Skills</th><th></th></tr></thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan="6" className="empty">No candidates match these filters. Reset the filters or add a candidate.</td></tr>
                )}
                {data.map((c) => (
                  <tr key={c.candidate_id}>
                    <td>
                      <Link to={`/candidates/${c.candidate_id}`}><strong>{c.name}</strong></Link>
                      <div className="muted">{c.email}</div>
                    </td>
                    <td>{c.location}</td>
                    <td className="nowrap">{c.total_experience} yrs</td>
                    <td>{c.latest_degree}</td>
                    <td>
                      {c.skills ? c.skills.split(", ").map((s) => <span className="tag" key={s}>{s}</span>) : <span className="muted">None</span>}
                    </td>
                    <td className="actions">
                      <Link className="btn small ghost" to={`/candidates/${c.candidate_id}/edit`}>Edit</Link>
                      <button className="btn small danger" onClick={() => remove(c)}>Delete</button>
                    </td>
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
