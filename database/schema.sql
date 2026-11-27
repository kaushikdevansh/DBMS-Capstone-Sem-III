DROP VIEW IF EXISTS candidate_profile_view;
DROP TABLE IF EXISTS users, candidate_audit, interviews, applications, job_skills, jobs, companies, candidate_skills, skills, experience, education, candidates CASCADE;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~ '^[A-Za-z0-9_.-]{3,50}$'),
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
    candidate_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone VARCHAR(15) CHECK (phone ~ '^[0-9]{10,15}$'),
    location VARCHAR(100),
    summary TEXT,
    resume_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education (
    edu_id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    degree VARCHAR(100) NOT NULL,
    institution VARCHAR(150) NOT NULL,
    year_completed INT CHECK (year_completed BETWEEN 1980 AND 2100),
    grade VARCHAR(20)
);

CREATE TABLE experience (
    exp_id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE candidate_skills (
    candidate_id INT REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency VARCHAR(20) NOT NULL DEFAULT 'Intermediate' CHECK (proficiency IN ('Beginner', 'Intermediate', 'Expert')),
    PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(100)
);

CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    min_experience NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (min_experience >= 0),
    description TEXT,
    posted_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE job_skills (
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    applied_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected')),
    match_score NUMERIC(5,2),
    UNIQUE (candidate_id, job_id)
);

CREATE TABLE interviews (
    interview_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number >= 1),
    interview_date TIMESTAMP NOT NULL,
    interviewer_name VARCHAR(100),
    feedback TEXT,
    result VARCHAR(10) NOT NULL DEFAULT 'Pending' CHECK (result IN ('Pending', 'Pass', 'Fail')),
    UNIQUE (application_id, round_number)
);

CREATE TABLE candidate_audit (
    audit_id SERIAL PRIMARY KEY,
    candidate_id INT,
    action VARCHAR(10),
    old_name VARCHAR(100),
    old_email VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_candidates_location ON candidates(location);
CREATE INDEX idx_candidate_skills_skill ON candidate_skills(skill_id);
CREATE INDEX idx_job_skills_skill ON job_skills(skill_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_application ON interviews(application_id);

CREATE OR REPLACE FUNCTION total_experience(p_candidate INT)
RETURNS NUMERIC AS $$
    SELECT COALESCE(ROUND(SUM(COALESCE(end_date, CURRENT_DATE) - start_date) / 365.0, 1), 0)
    FROM experience WHERE candidate_id = p_candidate;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION calc_match_score(p_candidate INT, p_job INT)
RETURNS NUMERIC AS $$
DECLARE
    required_count INT;
    matched_count INT;
    needed_exp NUMERIC;
    skill_part NUMERIC;
    exp_part NUMERIC;
BEGIN
    SELECT COUNT(*) INTO required_count FROM job_skills WHERE job_id = p_job;
    SELECT COUNT(*) INTO matched_count
    FROM job_skills js JOIN candidate_skills cs ON cs.skill_id = js.skill_id
    WHERE js.job_id = p_job AND cs.candidate_id = p_candidate;
    SELECT min_experience INTO needed_exp FROM jobs WHERE job_id = p_job;

    IF required_count = 0 THEN
        skill_part := 100;
    ELSE
        skill_part := matched_count * 100.0 / required_count;
    END IF;

    IF COALESCE(needed_exp, 0) = 0 THEN
        exp_part := 100;
    ELSE
        exp_part := LEAST(total_experience(p_candidate) / needed_exp, 1) * 100;
    END IF;

    RETURN ROUND(skill_part * 0.7 + exp_part * 0.3, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_application_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.match_score := calc_match_score(NEW.candidate_id, NEW.job_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_score
BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION set_application_score();

CREATE OR REPLACE FUNCTION update_status_after_interview()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result = 'Pass' THEN
        UPDATE applications SET status = 'Interviewed'
        WHERE application_id = NEW.application_id AND status IN ('Applied', 'Shortlisted');
    ELSIF NEW.result = 'Fail' THEN
        UPDATE applications SET status = 'Rejected' WHERE application_id = NEW.application_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_interview_status
AFTER INSERT OR UPDATE OF result ON interviews
FOR EACH ROW EXECUTE FUNCTION update_status_after_interview();

CREATE OR REPLACE FUNCTION log_candidate_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO candidate_audit (candidate_id, action, old_name, old_email)
    VALUES (OLD.candidate_id, TG_OP, OLD.name, OLD.email);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidate_audit
AFTER UPDATE OR DELETE ON candidates
FOR EACH ROW EXECUTE FUNCTION log_candidate_change();

CREATE VIEW candidate_profile_view AS
SELECT c.*,
    total_experience(c.candidate_id) AS total_experience,
    (SELECT STRING_AGG(s.skill_name, ', ' ORDER BY s.skill_name)
     FROM candidate_skills cs JOIN skills s ON s.skill_id = cs.skill_id
     WHERE cs.candidate_id = c.candidate_id) AS skills,
    (SELECT COUNT(*) FROM candidate_skills cs WHERE cs.candidate_id = c.candidate_id) AS skill_count,
    (SELECT e.degree FROM education e WHERE e.candidate_id = c.candidate_id
     ORDER BY e.year_completed DESC NULLS LAST LIMIT 1) AS latest_degree
FROM candidates c;
