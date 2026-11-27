import { useState } from "react";
import { api } from "../api.js";
import { PageHead, guard, useAction, useData } from "../ui.jsx";

export default function Skills() {
  const [name, setName] = useState("");
  const run = useAction();
  const { data, error, reload } = useData("/skills");

  const add = async (event) => {
    event.preventDefault();
    if (await run(() => api.post("/skills", { skill_name: name }), "Skill added")) {
      setName("");
      reload();
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.skill_name}? It will be removed from all profiles and jobs.`)) return;
    if (await run(() => api.del(`/skills/${s.skill_id}`), "Skill deleted")) reload();
  };

  const wait = guard(data, error);

  return (
    <>
      <PageHead title="Skills" subtitle="One shared list keeps skill names consistent across candidates and jobs." />
      <form className="card" onSubmit={add}>
        <div className="filters" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <label htmlFor="skill_name">New skill</label>
            <input id="skill_name" required maxLength="100" placeholder="For example, Kubernetes" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn" type="submit">Add skill</button>
        </div>
      </form>
      {wait || (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Skill</th><th>Candidates</th><th>Jobs requiring it</th><th></th></tr></thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan="4" className="empty">No skills yet. Add one above.</td></tr>}
                {data.map((s) => (
                  <tr key={s.skill_id}>
                    <td><strong>{s.skill_name}</strong></td>
                    <td>{s.candidates}</td>
                    <td>{s.jobs}</td>
                    <td className="right"><button className="btn small danger" onClick={() => remove(s)}>Delete</button></td>
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
