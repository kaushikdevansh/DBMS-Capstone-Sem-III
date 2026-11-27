
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, q, one } from "./db.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
}));

app.use(express.json());

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);

const nil = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

const notFound = (res, what) =>
  res.status(404).json({ error: `${what} not found` });

const friendly = (err) => {
  if (err.code === "23505") return "This record already exists";
  if (err.code === "23514") return `Value rejected by rule: ${err.constraint}`;
  if (err.code === "23503") return "A related record does not exist";
  if (err.code === "23502") return `Missing required field: ${err.column}`;
  if (["22P02", "22007", "22008"].includes(err.code))
    return "One of the values has an invalid format";
  return err.message;
};

app.get("/api/health", wrap(async (req, res) => {
  const row = await one(
    "SELECT current_database() AS database, NOW() AS time"
  );
  res.json(row);
}));

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error("JWT_SECRET environment variable is missing.");
  process.exit(1);
}

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

const recent = (key) =>
  (attempts.get(key) || []).filter(
    (t) => Date.now() - t < WINDOW_MS
  );

const dummyHash = bcrypt.hashSync("not-a-real-password", 10);

app.post("/api/auth/login", wrap(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({
      error: "Enter your username and password"
    });
  }

  const key = `${req.ip}:${username.toLowerCase()}`;

  if (recent(key).length >= MAX_FAILS) {
    return res.status(429).json({
      error: "Too many failed attempts. Try again in a few minutes"
    });
  }

  const user = await one(
    "SELECT user_id, username, full_name, password_hash FROM users WHERE LOWER(username) = LOWER($1)",
    [username]
  );

  const matches = await bcrypt.compare(
    password,
    user ? user.password_hash : dummyHash
  );

  if (!user || !matches) {
    attempts.set(key, [...recent(key), Date.now()]);
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  attempts.delete(key);

  const payload = {
    id: user.user_id,
    username: user.username,
    name: user.full_name
  };

  res.json({
    token: jwt.sign(payload, secret, { expiresIn: "8h" }),
    user: payload
  });
}));

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({
      error: "Please log in to continue"
    });
  }
};

app.use("/api", requireAuth);

app.get("/api/auth/me", (req, res) => {
  const { id, username, name } = req.user;
  res.json({ user: { id, username, name } });
});

app.get("/api/lookups", wrap(async (req, res) => {
  const [candidates, jobs, skills, companies, locations, openApplications] =
    await Promise.all([
      q("SELECT candidate_id, name FROM candidates ORDER BY name"),
      q("SELECT j.job_id, j.title, co.company_name FROM jobs j JOIN companies co ON co.company_id = j.company_id ORDER BY j.title"),
      q("SELECT skill_id, skill_name FROM skills ORDER BY skill_name"),
      q("SELECT company_id, company_name FROM companies ORDER BY company_name"),
      q("SELECT DISTINCT location FROM candidates WHERE location IS NOT NULL ORDER BY location"),
      q(`SELECT a.application_id, c.name, j.title FROM applications a
         JOIN candidates c ON c.candidate_id = a.candidate_id
         JOIN jobs j ON j.job_id = a.job_id
         WHERE a.status NOT IN ('Rejected', 'Selected')
         ORDER BY c.name`)
    ]);

  res.json({
    candidates,
    jobs,
    skills,
    companies,
    locations,
    openApplications
  });
}));

app.get("/api/dashboard", wrap(async (req, res) => {
  const [stats, topSkills, pipeline, recent] = await Promise.all([
    one(`SELECT
      (SELECT COUNT(*) FROM candidates)::int AS candidates,
      (SELECT COUNT(*) FROM jobs)::int AS jobs,
      (SELECT COUNT(*) FROM applications)::int AS applications,
      (SELECT COUNT(*) FROM interviews)::int AS interviews`),

    q(`SELECT s.skill_name, COUNT(*)::int AS total
       FROM candidate_skills cs
       JOIN skills s ON s.skill_id = cs.skill_id
       GROUP BY s.skill_name
       ORDER BY total DESC, s.skill_name LIMIT 6`),

    q("SELECT status, COUNT(*)::int AS total FROM applications GROUP BY status ORDER BY total DESC"),

    q("SELECT candidate_id, name, email, location, created_at FROM candidates ORDER BY created_at DESC, candidate_id DESC LIMIT 5")
  ]);

  res.json({ stats, topSkills, pipeline, recent });
}));

app.get("/api/candidates", wrap(async (req, res) => {
  const {
    q: search,
    skill,
    location,
    min_exp: minExp,
    sort
  } = req.query;

  const order = {
    name: "v.name",
    experience: "v.total_experience DESC",
    recent: "v.created_at DESC"
  }[sort] || "v.name";

  const params = [];
  let sql = "SELECT * FROM candidate_profile_view v WHERE 1=1";

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (v.name ILIKE $${params.length} OR v.email ILIKE $${params.length})`;
  }

  if (skill) {
    params.push(skill);
    sql += ` AND EXISTS (
      SELECT 1 FROM candidate_skills cs
      WHERE cs.candidate_id = v.candidate_id
      AND cs.skill_id = $${params.length})`;
  }

  if (location) {
    params.push(location);
    sql += ` AND v.location = $${params.length}`;
  }

  if (minExp && !Number.isNaN(Number(minExp))) {
    params.push(Number(minExp));
    sql += ` AND v.total_experience >= $${params.length}`;
  }

  res.json(await q(`${sql} ORDER BY ${order}`, params));
}));

const candidateBody = (b) => [
  nil(b.name),
  nil(b.email),
  nil(b.phone),
  nil(b.location),
  nil(b.summary),
  nil(b.resume_url)
];

app.post("/api/candidates", wrap(async (req, res) => {
  const row = await one(
    `INSERT INTO candidates
     (name, email, phone, location, summary, resume_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING candidate_id`,
    candidateBody(req.body)
  );

  res.status(201).json(row);
}));

app.get("/api/candidates/:id", wrap(async (req, res) => {
  const id = req.params.id;

  const candidate = await one(
    "SELECT * FROM candidate_profile_view WHERE candidate_id = $1",
    [id]
  );

  if (!candidate) return notFound(res, "Candidate");

  const [education, experience, skills, available, applications] =
    await Promise.all([
      q("SELECT * FROM education WHERE candidate_id = $1 ORDER BY year_completed DESC NULLS LAST", [id]),
      q("SELECT * FROM experience WHERE candidate_id = $1 ORDER BY start_date DESC", [id]),
      q(`SELECT s.skill_id, s.skill_name, cs.proficiency
         FROM candidate_skills cs
         JOIN skills s ON s.skill_id = cs.skill_id
         WHERE cs.candidate_id = $1 ORDER BY s.skill_name`, [id]),
      q(`SELECT * FROM skills
         WHERE skill_id NOT IN (
           SELECT skill_id FROM candidate_skills WHERE candidate_id = $1
         ) ORDER BY skill_name`, [id]),
      q(`SELECT a.*, j.title, co.company_name
         FROM applications a
         JOIN jobs j ON j.job_id = a.job_id
         JOIN companies co ON co.company_id = j.company_id
         WHERE a.candidate_id = $1 ORDER BY a.applied_date DESC`, [id])
    ]);

  res.json({
    candidate,
    education,
    experience,
    skills,
    available,
    applications
  });
}));

app.put("/api/candidates/:id", wrap(async (req, res) => {
  const row = await one(
    `UPDATE candidates
     SET name = $1, email = $2, phone = $3, location = $4,
         summary = $5, resume_url = $6
     WHERE candidate_id = $7 RETURNING candidate_id`,
    [...candidateBody(req.body), req.params.id]
  );

  if (!row) return notFound(res, "Candidate");
  res.json(row);
}));

app.delete("/api/candidates/:id", wrap(async (req, res) => {
  await q("DELETE FROM candidates WHERE candidate_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.post("/api/candidates/:id/education", wrap(async (req, res) => {
  const b = req.body;

  const row = await one(
    `INSERT INTO education
     (candidate_id, degree, institution, year_completed, grade)
     VALUES ($1, $2, $3, $4, $5) RETURNING edu_id`,
    [
      req.params.id,
      nil(b.degree),
      nil(b.institution),
      nil(b.year_completed),
      nil(b.grade)
    ]
  );

  res.status(201).json(row);
}));

app.delete("/api/candidates/:id/education/:eid", wrap(async (req, res) => {
  await q(
    "DELETE FROM education WHERE edu_id = $1 AND candidate_id = $2",
    [req.params.eid, req.params.id]
  );
  res.json({ ok: true });
}));

app.post("/api/candidates/:id/experience", wrap(async (req, res) => {
  const b = req.body;

  const row = await one(
    `INSERT INTO experience
     (candidate_id, company, role, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING exp_id`,
    [
      req.params.id,
      nil(b.company),
      nil(b.role),
      nil(b.start_date),
      nil(b.end_date)
    ]
  );

  res.status(201).json(row);
}));

app.delete("/api/candidates/:id/experience/:xid", wrap(async (req, res) => {
  await q(
    "DELETE FROM experience WHERE exp_id = $1 AND candidate_id = $2",
    [req.params.xid, req.params.id]
  );
  res.json({ ok: true });
}));

app.post("/api/candidates/:id/skills", wrap(async (req, res) => {
  const { skill_id: skillId, proficiency } = req.body;

  await q(
    `INSERT INTO candidate_skills
     (candidate_id, skill_id, proficiency)
     VALUES ($1, $2, $3)
     ON CONFLICT (candidate_id, skill_id)
     DO UPDATE SET proficiency = EXCLUDED.proficiency`,
    [req.params.id, skillId, proficiency || "Intermediate"]
  );

  res.status(201).json({ ok: true });
}));

app.delete("/api/candidates/:id/skills/:sid", wrap(async (req, res) => {
  await q(
    "DELETE FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2",
    [req.params.id, req.params.sid]
  );
  res.json({ ok: true });
}));

app.get("/api/skills", wrap(async (req, res) => {
  res.json(await q(`SELECT s.*,
    (SELECT COUNT(*) FROM candidate_skills WHERE skill_id = s.skill_id)::int AS candidates,
    (SELECT COUNT(*) FROM job_skills WHERE skill_id = s.skill_id)::int AS jobs
    FROM skills s ORDER BY s.skill_name`));
}));

app.post("/api/skills", wrap(async (req, res) => {
  const row = await one(
    "INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id",
    [nil(req.body.skill_name)]
  );

  res.status(201).json(row);
}));

app.delete("/api/skills/:id", wrap(async (req, res) => {
  await q("DELETE FROM skills WHERE skill_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.post("/api/companies", wrap(async (req, res) => {
  const row = await one(
    "INSERT INTO companies (company_name, location) VALUES ($1, $2) RETURNING company_id",
    [nil(req.body.company_name), nil(req.body.location)]
  );

  res.status(201).json(row);
}));

app.get("/api/jobs", wrap(async (req, res) => {
  res.json(await q(`SELECT j.*, co.company_name, co.location,
    (SELECT COUNT(*) FROM job_skills WHERE job_id = j.job_id)::int AS skill_count,
    (SELECT COUNT(*) FROM applications WHERE job_id = j.job_id)::int AS applicants
    FROM jobs j
    JOIN companies co ON co.company_id = j.company_id
    ORDER BY j.posted_date DESC, j.job_id DESC`));
}));

app.post("/api/jobs", wrap(async (req, res) => {
  const b = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO jobs
       (company_id, title, min_experience, description)
       VALUES ($1, $2, $3, $4) RETURNING job_id`,
      [
        b.company_id,
        nil(b.title),
        nil(b.min_experience) || 0,
        nil(b.description)
      ]
    );

    for (const skillId of b.skills || []) {
      await client.query(
        "INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)",
        [rows[0].job_id, skillId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(rows[0]);

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
}));

app.get("/api/jobs/:id", wrap(async (req, res) => {
  const id = req.params.id;

  const job = await one(
    `SELECT j.*, co.company_name, co.location
     FROM jobs j
     JOIN companies co ON co.company_id = j.company_id
     WHERE j.job_id = $1`,
    [id]
  );

  if (!job) return notFound(res, "Job");

  const [required, ranking] = await Promise.all([
    q(`SELECT s.skill_name FROM job_skills js
       JOIN skills s ON s.skill_id = js.skill_id
       WHERE js.job_id = $1 ORDER BY s.skill_name`, [id]),

    q(`SELECT c.candidate_id, c.name, c.location,
       total_experience(c.candidate_id) AS experience,
       calc_match_score(c.candidate_id, $1) AS score,
       (SELECT COUNT(*) FROM job_skills js
        JOIN candidate_skills cs ON cs.skill_id = js.skill_id
        WHERE js.job_id = $1 AND cs.candidate_id = c.candidate_id)::int AS matched,
       EXISTS (SELECT 1 FROM applications a
        WHERE a.candidate_id = c.candidate_id AND a.job_id = $1) AS applied
       FROM candidates c ORDER BY score DESC, c.name`, [id])
  ]);

  res.json({ job, required, ranking });
}));

app.delete("/api/jobs/:id", wrap(async (req, res) => {
  await q("DELETE FROM jobs WHERE job_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.get("/api/applications", wrap(async (req, res) => {
  const params = [];

  let sql = `SELECT a.*, c.name, j.title, co.company_name
    FROM applications a
    JOIN candidates c ON c.candidate_id = a.candidate_id
    JOIN jobs j ON j.job_id = a.job_id
    JOIN companies co ON co.company_id = j.company_id`;

  if (req.query.status) {
    params.push(req.query.status);
    sql += " WHERE a.status = $1";
  }

  res.json(
    await q(`${sql} ORDER BY a.match_score DESC NULLS LAST, a.application_id`, params)
  );
}));

app.post("/api/applications", wrap(async (req, res) => {
  const row = await one(
    "INSERT INTO applications (candidate_id, job_id) VALUES ($1, $2) RETURNING application_id, match_score",
    [req.body.candidate_id, req.body.job_id]
  );

  res.status(201).json(row);
}));

app.patch("/api/applications/:id/status", wrap(async (req, res) => {
  await q(
    "UPDATE applications SET status = $1 WHERE application_id = $2",
    [req.body.status, req.params.id]
  );

  res.json({ ok: true });
}));

app.delete("/api/applications/:id", wrap(async (req, res) => {
  await q("DELETE FROM applications WHERE application_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.get("/api/interviews", wrap(async (req, res) => {
  res.json(await q(`SELECT i.*, c.name, j.title, a.status
    FROM interviews i
    JOIN applications a ON a.application_id = i.application_id
    JOIN candidates c ON c.candidate_id = a.candidate_id
    JOIN jobs j ON j.job_id = a.job_id
    ORDER BY i.interview_date DESC`));
}));

app.post("/api/interviews", wrap(async (req, res) => {
  const b = req.body;

  const row = await one(
    `INSERT INTO interviews
     (application_id, round_number, interview_date, interviewer_name)
     VALUES ($1, $2, $3, $4) RETURNING interview_id`,
    [
      b.application_id,
      b.round_number,
      b.interview_date,
      nil(b.interviewer_name)
    ]
  );

  res.status(201).json(row);
}));

app.patch("/api/interviews/:id", wrap(async (req, res) => {
  await q(
    "UPDATE interviews SET result = $1, feedback = $2 WHERE interview_id = $3",
    [req.body.result, nil(req.body.feedback), req.params.id]
  );

  res.json({ ok: true });
}));

app.delete("/api/interviews/:id", wrap(async (req, res) => {
  await q("DELETE FROM interviews WHERE interview_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

app.get("/api/reports", wrap(async (req, res) => {
  const [demand, topMatches, idle, byLocation, perJob] =
    await Promise.all([
      q(`SELECT s.skill_name,
         (SELECT COUNT(*) FROM job_skills js WHERE js.skill_id = s.skill_id)::int AS jobs_needing,
         (SELECT COUNT(*) FROM candidate_skills cs WHERE cs.skill_id = s.skill_id)::int AS candidates_having
         FROM skills s ORDER BY jobs_needing DESC, candidates_having DESC LIMIT 8`),

      q(`SELECT c.name, j.title, a.match_score, a.status
         FROM applications a
         JOIN candidates c ON c.candidate_id = a.candidate_id
         JOIN jobs j ON j.job_id = a.job_id
         ORDER BY a.match_score DESC LIMIT 5`),

      q(`SELECT c.candidate_id, c.name, c.location
         FROM candidates c
         LEFT JOIN applications a ON a.candidate_id = c.candidate_id
         WHERE a.application_id IS NULL ORDER BY c.name`),

      q(`SELECT location, COUNT(*)::int AS total,
         ROUND(AVG(total_experience), 1) AS avg_experience
         FROM candidate_profile_view
         WHERE location IS NOT NULL
         GROUP BY location HAVING COUNT(*) >= 1
         ORDER BY total DESC, location`),

      q(`SELECT j.title, COUNT(a.application_id)::int AS applicants,
         ROUND(AVG(a.match_score), 1) AS avg_score
         FROM jobs j
         LEFT JOIN applications a ON a.job_id = j.job_id
         GROUP BY j.job_id, j.title ORDER BY applicants DESC`)
    ]);

  res.json({ demand, topMatches, idle, byLocation, perJob });
}));

app.get("/api/audit", wrap(async (req, res) => {
  res.json(
    await q("SELECT * FROM candidate_audit ORDER BY changed_at DESC, audit_id DESC LIMIT 50")
  );
}));

app.use((err, req, res, next) => {
  const isDatabaseError = /^[0-9A-Z]{5}$/.test(err.code || "");

  if (!isDatabaseError) console.error(err);

  res.status(isDatabaseError ? 400 : 500).json({
    error: isDatabaseError ? friendly(err) : err.message
  });
});

const port = Number(process.env.PORT) || 4000;

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});
