import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { Badge, bind, fmtDate, guard, useAction, useData } from "../ui.jsx";

function SkillForm({ available, onSave }) {
  const empty = { skill_id: "", proficiency: "Intermediate" };
  const [f, setF] = useState(empty);
  const b = bind(f, setF);
  const submit = async (event) => {
    event.preventDefault();
    if (await onSave(f)) setF(empty);
  };
  return (
    <form className="mini-form row2" onSubmit={submit}>
      <div>
        <label htmlFor="skill_id">Skill</label>
        <select id="skill_id" required {...b("skill_id")}>
          <option value="">Choose skill</option>
          {available.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="proficiency">Level</label>
        <select id="proficiency" {...b("proficiency")}>
          <option>Beginner</option><option>Intermediate</option><option>Expert</option>
        </select>
      </div>
      <div className="full"><button className="btn small" type="submit">Add skill</button></div>
    </form>
  );
}

function EducationForm({ onSave }) {
  const empty = { degree: "", institution: "", year_completed: "", grade: "" };
  const [f, setF] = useState(empty);
  const b = bind(f, setF);
  const submit = async (event) => {
    event.preventDefault();
    if (await onSave(f)) setF(empty);
  };
  return (
    <form className="mini-form row2" onSubmit={submit}>
      <div className="full"><label htmlFor="degree">Degree</label><input id="degree" required {...b("degree")} /></div>
      <div className="full"><label htmlFor="institution">Institution</label><input id="institution" required {...b("institution")} /></div>
      <div><label htmlFor="year_completed">Year</label><input id="year_completed" type="number" min="1980" max="2100" {...b("year_completed")} /></div>
      <div><label htmlFor="grade">Grade</label><input id="grade" maxLength="20" {...b("grade")} /></div>
      <div className="full"><button className="btn small" type="submit">Add education</button></div>
    </form>
  );
}

function ExperienceForm({ onSave }) {
  const empty = { company: "", role: "", start_date: "", end_date: "" };
  const [f, setF] = useState(empty);
  const b = bind(f, setF);
  const submit = async (event) => {
    event.preventDefault();
    if (await onSave(f)) setF(empty);
  };
  return (
    <form className="mini-form row2" onSubmit={submit}>
      <div><label htmlFor="company">Company</label><input id="company" required {...b("company")} /></div>
      <div><label htmlFor="role">Role</label><input id="role" required {...b("role")} /></div>
      <div><label htmlFor="start_date">Start date</label><input id="start_date" type="date" required {...b("start_date")} /></div>
      <div><label htmlFor="end_date">End date</label><input id="end_date" type="date" {...b("end_date")} /></div>
      <div className="full"><button className="btn small" type="submit">Add experience</button></div>
    </form>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const run = useAction();
  const { data, error, reload } = useData(`/candidates/${id}`);
  const wait = guard(data, error);
  if (wait) return wait;

  const { candidate: c, education, experience, skills, available, applications } = data;

  const save = (path, message) => async (body) => {
    const ok = await run(() => api.post(`/candidates/${id}/${path}`, body), message);
    if (ok) reload();
    return ok;
  };

  const remove = (path, message) => async () => {
    if (await run(() => api.del(`/candidates/${id}/${path}`), message)) reload();
  };

  const deleteCandidate = async () => {
    if (!window.confirm("Delete this candidate and all related records?")) return;
    if (await run(() => api.del(`/candidates/${id}`), "Candidate deleted")) navigate("/candidates");
  };

  return (
    <>
      <section className="card">
        <div className="profile-head">
          <div>
            <h1>{c.name}</h1>
            <div className="profile-meta">
              <span>{c.email}</span>
              {c.phone && <span>{c.phone}</span>}
              {c.location && <span>{c.location}</span>}
              <span>{c.total_experience} years of experience</span>
              {c.resume_url && <a href={c.resume_url} target="_blank" rel="noopener noreferrer">View resume</a>}
            </div>
          </div>
          <div className="actions">
            <Link className="btn ghost" to={`/candidates/${id}/edit`}>Edit profile</Link>
            <button className="btn danger" onClick={deleteCandidate}>Delete</button>
          </div>
        </div>
        {c.summary && <p style={{ marginTop: "1rem" }}>{c.summary}</p>}
      </section>

      <div className="grid3">
        <section className="card">
          <h2>Skills</h2>
          {skills.length === 0 && <p className="empty">No skills yet. Add the first one below.</p>}
          {skills.map((s) => (
            <div className="item" key={s.skill_id}>
              <div><strong>{s.skill_name}</strong><span className={`tag ${s.proficiency.toLowerCase()}`}>{s.proficiency}</span></div>
              <button className="btn small danger" onClick={remove(`skills/${s.skill_id}`, "Skill removed")}>Remove</button>
            </div>
          ))}
          <SkillForm available={available} onSave={save("skills", "Skill saved")} />
        </section>

        <section className="card">
          <h2>Education</h2>
          {education.length === 0 && <p className="empty">No education recorded.</p>}
          {education.map((e) => (
            <div className="item" key={e.edu_id}>
              <div>
                <strong>{e.degree}</strong>
                <span className="muted">{e.institution}{e.year_completed ? `, ${e.year_completed}` : ""}{e.grade ? ` (${e.grade})` : ""}</span>
              </div>
              <button className="btn small danger" onClick={remove(`education/${e.edu_id}`, "Education removed")}>Remove</button>
            </div>
          ))}
          <EducationForm onSave={save("education", "Education added")} />
        </section>

        <section className="card">
          <h2>Experience</h2>
          {experience.length === 0 && <p className="empty">No work experience recorded.</p>}
          {experience.map((x) => (
            <div className="item" key={x.exp_id}>
              <div>
                <strong>{x.role}</strong>
                <span className="muted">{x.company}, {fmtDate(x.start_date)} to {x.end_date ? fmtDate(x.end_date) : "present"}</span>
              </div>
              <button className="btn small danger" onClick={remove(`experience/${x.exp_id}`, "Experience removed")}>Remove</button>
            </div>
          ))}
          <ExperienceForm onSave={save("experience", "Experience added")} />
        </section>
      </div>

      <section className="card">
        <h2>Applications</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Job</th><th>Company</th><th>Applied</th><th>Match</th><th>Status</th></tr></thead>
            <tbody>
              {applications.length === 0 && (
                <tr><td colSpan="5" className="empty">This candidate has not applied to any job. Open a job to see how well they match.</td></tr>
              )}
              {applications.map((a) => (
                <tr key={a.application_id}>
                  <td><Link to={`/jobs/${a.job_id}`}>{a.title}</Link></td>
                  <td>{a.company_name}</td>
                  <td>{fmtDate(a.applied_date)}</td>
                  <td>{a.match_score}%</td>
                  <td><Badge value={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
