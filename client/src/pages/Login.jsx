import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { ThemeToggle } from "../theme.jsx";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="brand">TalentBase</div>
        <div>
          <h2>Every candidate, job and interview in one place.</h2>
          <p>Sign in to manage profiles, match skills to openings and follow each application through to a decision.</p>
        </div>
        <ul>
          <li>Match scores calculated inside the database</li>
          <li>Application and interview tracking with automatic status updates</li>
          <li>Audit log of every profile change</li>
        </ul>
      </section>

      <section className="login-panel">
        <ThemeToggle />
        <form className="login-card" onSubmit={submit}>
          <h1>Sign in</h1>
          <p className="sub">Use your HR account to continue.</p>

          {error && <div className="flash err" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              autoFocus
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <label className="show">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Show password
          </label>

          <button className="btn" type="submit" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>

          <p className="hint">Demo account: <code>admin</code> with password <code>Admin@123</code></p>
        </form>
      </section>
    </div>
  );
}
