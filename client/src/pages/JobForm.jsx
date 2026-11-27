import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { PageHead, bind, guard, useAction, useData } from "../ui.jsx";

export default function JobForm() {
  const navigate = useNavigate();
  const run = useAction();
  const { data, error } = useData("/lookups");
  const [form, setForm] = useState({ title: "", company_id: "", min_experience: "0", description: "" });
  const [chosen, setChosen] = useState([]);
  const b = bind(form, setForm);
  const wait = guard(data, error);
  if (wait) return wait;

  const toggle = (id) => setChosen(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await run(() => api.post("/jobs", { ...form, skills: chosen }), "Job posted");
    if (result) navigate(`/jobs/${result.job_id}`);
  };

  return (
    <>
      <PageHead title="Post job" subtitle="Choose the skills a candidate needs. They drive the match score." />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div><label htmlFor="title">Job title</label><input id="title" required maxLength="100" {...b("title")} /></div>
          <div>
            <label htmlFor="company_id">Company</label>
            <select id="company_id" required {...b("company_id")}>
              <option value="">Choose company</option>
              {data.companies.map((co) => <option key={co.company_id} value={co.company_id}>{co.company_name}</option>)}
            </select>
          </div>
          <div><label htmlFor="min_experience">Minimum experience (years)</label><input id="min_experience" type="number" min="0" max="99" step="0.5" {...b("min_experience")} /></div>
          <div className="full"><label htmlFor="description">Description</label><textarea id="description" {...b("description")} /></div>
          <div className="full">
            <label>Required skills</label>
            <div className="checks">
              {data.skills.map((s) => (
                <label key={s.skill_id}>
                  <input type="checkbox" checked={chosen.includes(s.skill_id)} onChange={() => toggle(s.skill_id)} />
                  {s.skill_name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="actions" style={{ marginTop: "1.25rem" }}>
          <button className="btn" type="submit">Post job</button>
          <Link className="btn ghost" to="/jobs">Cancel</Link>
        </div>
      </form>
    </>
  );
}
