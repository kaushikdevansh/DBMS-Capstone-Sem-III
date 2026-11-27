import { useState } from "react";
import { api } from "../api.js";
import { Badge, PageHead, bind, fmtDateTime, guard, useAction, useData } from "../ui.jsx";

const empty = { application_id: "", round_number: "1", interview_date: "", interviewer_name: "" };

function Row({ interview, run, reload }) {
  const [result, setResult] = useState(interview.result);
  const [feedback, setFeedback] = useState(interview.feedback || "");

  const save = async () => {
    if (await run(() => api.patch(`/interviews/${interview.interview_id}`, { result, feedback }), "Interview updated")) reload();
  };

  const remove = async () => {
    if (!window.confirm("Delete this interview?")) return;
    if (await run(() => api.del(`/interviews/${interview.interview_id}`), "Interview deleted")) reload();
  };

  return (
    <tr>
      <td>{interview.name}<div><Badge value={interview.status} /></div></td>
      <td>{interview.title}</td>
      <td>{interview.round_number}</td>
      <td className="nowrap">{fmtDateTime(interview.interview_date)}</td>
      <td>{interview.interviewer_name}</td>
      <td>
        <div className="actions">
          <select style={{ width: "auto" }} value={result} onChange={(e) => setResult(e.target.value)}>
            <option>Pending</option><option>Pass</option><option>Fail</option>
          </select>
          <input style={{ width: "190px" }} placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <button className="btn small" onClick={save}>Save</button>
        </div>
      </td>
      <td className="right"><button className="btn small danger" onClick={remove}>Delete</button></td>
    </tr>
  );
}

export default function Interviews() {
  const [form, setForm] = useState(empty);
  const b = bind(form, setForm);
  const run = useAction();
  const { data, error, reload } = useData("/interviews");
  const lookups = useData("/lookups");

  const add = async (event) => {
    event.preventDefault();
    if (await run(() => api.post("/interviews", form), "Interview scheduled")) {
      setForm(empty);
      reload();
      lookups.reload();
    }
  };

  const wait = guard(data, error);

  return (
    <>
      <PageHead title="Interviews" subtitle="Recording a Pass or Fail result updates the application status automatically." />

      <form className="card" onSubmit={add}>
        <h2>Schedule interview</h2>
        <div className="filters" style={{ gridTemplateColumns: "2fr 0.7fr 1.3fr 1.3fr auto" }}>
          <div>
            <label htmlFor="application_id">Application</label>
            <select id="application_id" required {...b("application_id")}>
              <option value="">Choose application</option>
              {lookups.data?.openApplications.map((a) => <option key={a.application_id} value={a.application_id}>{a.name} for {a.title}</option>)}
            </select>
          </div>
          <div><label htmlFor="round_number">Round</label><input id="round_number" type="number" min="1" required {...b("round_number")} /></div>
          <div><label htmlFor="interview_date">Date and time</label><input id="interview_date" type="datetime-local" required {...b("interview_date")} /></div>
          <div><label htmlFor="interviewer_name">Interviewer</label><input id="interviewer_name" maxLength="100" {...b("interviewer_name")} /></div>
          <button className="btn" type="submit">Schedule</button>
        </div>
      </form>

      {wait || (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Candidate</th><th>Job</th><th>Round</th><th>When</th><th>Interviewer</th><th>Result and feedback</th><th></th></tr></thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan="7" className="empty">No interviews scheduled yet.</td></tr>}
                {data.map((i) => (
                  <Row key={`${i.interview_id}-${i.result}-${i.status}`} interview={i} run={run} reload={reload} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
