import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { PageHead, bind, useAction } from "../ui.jsx";

const empty = { name: "", email: "", phone: "", location: "", resume_url: "", summary: "" };

export default function CandidateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const run = useAction();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const b = bind(form, setForm);

  useEffect(() => {
    if (!id) return;
    api.get(`/candidates/${id}`).then(({ candidate }) => {
      setForm({
        name: candidate.name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",
        resume_url: candidate.resume_url || "",
        summary: candidate.summary || "",
      });
    });
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await run(
      () => (id ? api.put(`/candidates/${id}`, form) : api.post("/candidates", form)),
      id ? "Profile updated" : "Candidate created. Add skills, education and experience below."
    );
    setSaving(false);
    if (result) navigate(`/candidates/${id || result.candidate_id}`);
  };

  return (
    <>
      <PageHead title={id ? "Edit candidate" : "Add candidate"} subtitle="Basic contact details and a short professional summary." />
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div><label htmlFor="name">Full name</label><input id="name" required maxLength="100" {...b("name")} /></div>
          <div><label htmlFor="email">Email</label><input id="email" type="email" required maxLength="100" {...b("email")} /></div>
          <div><label htmlFor="phone">Phone (10 to 15 digits)</label><input id="phone" pattern="[0-9]{10,15}" maxLength="15" {...b("phone")} /></div>
          <div><label htmlFor="location">Location</label><input id="location" maxLength="100" {...b("location")} /></div>
          <div className="full"><label htmlFor="resume_url">Resume link</label><input id="resume_url" type="url" maxLength="255" {...b("resume_url")} /></div>
          <div className="full"><label htmlFor="summary">Professional summary</label><textarea id="summary" {...b("summary")} /></div>
        </div>
        <div className="actions" style={{ marginTop: "1.25rem" }}>
          <button className="btn" type="submit" disabled={saving}>Save candidate</button>
          <Link className="btn ghost" to={id ? `/candidates/${id}` : "/candidates"}>Cancel</Link>
        </div>
      </form>
    </>
  );
}
