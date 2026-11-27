import { PageHead, fmtDateTime, guard, useData } from "../ui.jsx";

export default function Audit() {
  const { data, error } = useData("/audit");
  const wait = guard(data, error);
  if (wait) return wait;

  return (
    <>
      <PageHead title="Audit log" subtitle="A database trigger records every candidate update and deletion here." />
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Action</th><th>Candidate ID</th><th>Previous name</th><th>Previous email</th></tr></thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan="5" className="empty">Nothing logged yet. Edit or delete a candidate to see an entry.</td></tr>}
              {data.map((r) => (
                <tr key={r.audit_id}>
                  <td className="nowrap">{fmtDateTime(r.changed_at)}</td>
                  <td><span className={`badge ${r.action === "DELETE" ? "rejected" : "shortlisted"}`}>{r.action}</span></td>
                  <td>{r.candidate_id}</td>
                  <td>{r.old_name}</td>
                  <td>{r.old_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
