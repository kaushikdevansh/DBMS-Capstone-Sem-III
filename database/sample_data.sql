INSERT INTO users (username, full_name, password_hash) VALUES
('admin', 'HR Administrator', '$2b$10$klqYbALE1ojHj8BhxGYkZuSNhgFs3ezGPhWLJQyYjPRS3FrQNljje');

INSERT INTO skills (skill_name) VALUES
('Python'), ('SQL'), ('Java'), ('JavaScript'), ('React'), ('Node.js'), ('Machine Learning'),
('Data Analysis'), ('HTML/CSS'), ('Django'), ('Flask'), ('PostgreSQL'), ('Git'), ('Docker'), ('Communication');

INSERT INTO candidates (name, email, phone, location, summary, resume_url) VALUES
('Aarav Sharma', 'aarav.sharma@email.com', '9876543210', 'Delhi', 'Backend developer focused on Python services and relational databases.', 'https://example.com/resumes/aarav.pdf'),
('Priya Verma', 'priya.verma@email.com', '9812345670', 'Mumbai', 'Data analyst with a strong SQL and reporting background.', 'https://example.com/resumes/priya.pdf'),
('Rohan Mehta', 'rohan.mehta@email.com', '9823456701', 'Bengaluru', 'Full stack engineer building React and Node.js applications.', 'https://example.com/resumes/rohan.pdf'),
('Sneha Iyer', 'sneha.iyer@email.com', '9834567012', 'Chennai', 'Machine learning engineer working on prediction models.', 'https://example.com/resumes/sneha.pdf'),
('Karan Singh', 'karan.singh@email.com', '9845670123', 'Delhi', 'Fresh graduate interested in web development.', NULL),
('Ananya Das', 'ananya.das@email.com', '9856701234', 'Kolkata', 'Database administrator experienced with PostgreSQL tuning.', 'https://example.com/resumes/ananya.pdf'),
('Vikram Rao', 'vikram.rao@email.com', '9867012345', 'Hyderabad', 'Java developer with enterprise application experience.', 'https://example.com/resumes/vikram.pdf'),
('Meera Nair', 'meera.nair@email.com', '9878123456', 'Pune', 'Python and Django developer with a focus on APIs.', 'https://example.com/resumes/meera.pdf');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency)
SELECT c.candidate_id, s.skill_id, v.prof
FROM (VALUES
('aarav.sharma@email.com', 'Python', 'Expert'), ('aarav.sharma@email.com', 'SQL', 'Expert'), ('aarav.sharma@email.com', 'Flask', 'Intermediate'),
('aarav.sharma@email.com', 'PostgreSQL', 'Intermediate'), ('aarav.sharma@email.com', 'Git', 'Intermediate'),
('priya.verma@email.com', 'SQL', 'Expert'), ('priya.verma@email.com', 'Data Analysis', 'Expert'), ('priya.verma@email.com', 'Python', 'Intermediate'),
('priya.verma@email.com', 'Communication', 'Expert'),
('rohan.mehta@email.com', 'JavaScript', 'Expert'), ('rohan.mehta@email.com', 'React', 'Expert'), ('rohan.mehta@email.com', 'Node.js', 'Intermediate'),
('rohan.mehta@email.com', 'HTML/CSS', 'Expert'), ('rohan.mehta@email.com', 'Git', 'Intermediate'), ('rohan.mehta@email.com', 'SQL', 'Beginner'),
('sneha.iyer@email.com', 'Python', 'Expert'), ('sneha.iyer@email.com', 'Machine Learning', 'Expert'), ('sneha.iyer@email.com', 'Data Analysis', 'Intermediate'),
('sneha.iyer@email.com', 'SQL', 'Intermediate'),
('karan.singh@email.com', 'HTML/CSS', 'Intermediate'), ('karan.singh@email.com', 'JavaScript', 'Beginner'), ('karan.singh@email.com', 'Python', 'Beginner'),
('ananya.das@email.com', 'PostgreSQL', 'Expert'), ('ananya.das@email.com', 'SQL', 'Expert'), ('ananya.das@email.com', 'Docker', 'Intermediate'),
('ananya.das@email.com', 'Python', 'Intermediate'),
('vikram.rao@email.com', 'Java', 'Expert'), ('vikram.rao@email.com', 'SQL', 'Intermediate'), ('vikram.rao@email.com', 'Git', 'Expert'),
('vikram.rao@email.com', 'Docker', 'Intermediate'),
('meera.nair@email.com', 'Python', 'Expert'), ('meera.nair@email.com', 'Django', 'Expert'), ('meera.nair@email.com', 'PostgreSQL', 'Intermediate'),
('meera.nair@email.com', 'Git', 'Intermediate'), ('meera.nair@email.com', 'Docker', 'Beginner')
) AS v(email, skill, prof)
JOIN candidates c ON c.email = v.email
JOIN skills s ON s.skill_name = v.skill;

INSERT INTO education (candidate_id, degree, institution, year_completed, grade)
SELECT c.candidate_id, v.degree, v.inst, v.yr, v.grade
FROM (VALUES
('aarav.sharma@email.com', 'B.Tech Computer Science', 'Delhi Technological University', 2020, '8.4 CGPA'),
('priya.verma@email.com', 'B.Sc Statistics', 'University of Mumbai', 2019, '8.1 CGPA'),
('priya.verma@email.com', 'MBA Analytics', 'NMIMS Mumbai', 2021, '7.9 CGPA'),
('rohan.mehta@email.com', 'B.E Information Technology', 'PES University', 2018, '8.0 CGPA'),
('sneha.iyer@email.com', 'M.Tech Data Science', 'IIT Madras', 2020, '9.0 CGPA'),
('karan.singh@email.com', 'BCA', 'Delhi University', 2025, '7.6 CGPA'),
('ananya.das@email.com', 'B.Tech Computer Science', 'Jadavpur University', 2016, '8.2 CGPA'),
('vikram.rao@email.com', 'B.E Computer Engineering', 'Osmania University', 2015, '7.8 CGPA'),
('meera.nair@email.com', 'B.Tech Information Technology', 'COEP Pune', 2019, '8.5 CGPA')
) AS v(email, degree, inst, yr, grade)
JOIN candidates c ON c.email = v.email;

INSERT INTO experience (candidate_id, company, role, start_date, end_date)
SELECT c.candidate_id, v.company, v.role, v.sd::date, v.ed::date
FROM (VALUES
('aarav.sharma@email.com', 'Infosys', 'Software Engineer', '2020-07-01', '2023-03-31'),
('aarav.sharma@email.com', 'Zoho', 'Backend Developer', '2023-04-15', NULL),
('priya.verma@email.com', 'Accenture', 'Data Analyst', '2021-08-01', NULL),
('rohan.mehta@email.com', 'Flipkart', 'Frontend Developer', '2018-08-01', '2021-12-31'),
('rohan.mehta@email.com', 'Swiggy', 'Full Stack Developer', '2022-02-01', NULL),
('sneha.iyer@email.com', 'Mu Sigma', 'ML Engineer', '2020-09-01', '2024-01-31'),
('ananya.das@email.com', 'TCS', 'Database Administrator', '2016-07-01', '2022-06-30'),
('ananya.das@email.com', 'Wipro', 'Senior DBA', '2022-07-15', NULL),
('vikram.rao@email.com', 'Cognizant', 'Java Developer', '2015-07-01', '2020-12-31'),
('vikram.rao@email.com', 'Capgemini', 'Senior Java Developer', '2021-01-15', NULL),
('meera.nair@email.com', 'Persistent Systems', 'Python Developer', '2019-07-01', NULL)
) AS v(email, company, role, sd, ed)
JOIN candidates c ON c.email = v.email;

INSERT INTO companies (company_name, location) VALUES
('TechNova', 'Bengaluru'), ('DataWorks', 'Mumbai'), ('CloudSphere', 'Delhi');

INSERT INTO jobs (company_id, title, min_experience, description)
SELECT co.company_id, v.title, v.exp, v.descr
FROM (VALUES
('TechNova', 'Python Developer', 2, 'Build and maintain backend services using Python and PostgreSQL.'),
('DataWorks', 'Data Analyst', 1, 'Analyse business data and build reports with SQL and Python.'),
('CloudSphere', 'Full Stack Developer', 3, 'Develop web applications across the frontend and backend.'),
('DataWorks', 'ML Engineer', 2, 'Design and deploy machine learning models.'),
('CloudSphere', 'Database Administrator', 3, 'Manage, tune and secure production PostgreSQL databases.')
) AS v(company, title, exp, descr)
JOIN companies co ON co.company_name = v.company;

INSERT INTO job_skills (job_id, skill_id)
SELECT j.job_id, s.skill_id
FROM (VALUES
('Python Developer', 'Python'), ('Python Developer', 'SQL'), ('Python Developer', 'PostgreSQL'), ('Python Developer', 'Git'),
('Data Analyst', 'SQL'), ('Data Analyst', 'Data Analysis'), ('Data Analyst', 'Python'), ('Data Analyst', 'Communication'),
('Full Stack Developer', 'JavaScript'), ('Full Stack Developer', 'React'), ('Full Stack Developer', 'Node.js'), ('Full Stack Developer', 'SQL'),
('ML Engineer', 'Python'), ('ML Engineer', 'Machine Learning'), ('ML Engineer', 'Data Analysis'),
('Database Administrator', 'PostgreSQL'), ('Database Administrator', 'SQL'), ('Database Administrator', 'Docker')
) AS v(title, skill)
JOIN jobs j ON j.title = v.title
JOIN skills s ON s.skill_name = v.skill;

INSERT INTO applications (candidate_id, job_id, status)
SELECT c.candidate_id, j.job_id, v.status
FROM (VALUES
('aarav.sharma@email.com', 'Python Developer', 'Shortlisted'),
('meera.nair@email.com', 'Python Developer', 'Applied'),
('ananya.das@email.com', 'Python Developer', 'Applied'),
('priya.verma@email.com', 'Data Analyst', 'Shortlisted'),
('sneha.iyer@email.com', 'Data Analyst', 'Applied'),
('rohan.mehta@email.com', 'Full Stack Developer', 'Shortlisted'),
('karan.singh@email.com', 'Full Stack Developer', 'Applied'),
('sneha.iyer@email.com', 'ML Engineer', 'Shortlisted'),
('ananya.das@email.com', 'Database Administrator', 'Shortlisted'),
('vikram.rao@email.com', 'Database Administrator', 'Applied')
) AS v(email, title, status)
JOIN candidates c ON c.email = v.email
JOIN jobs j ON j.title = v.title;

INSERT INTO interviews (application_id, round_number, interview_date, interviewer_name, feedback, result)
SELECT a.application_id, v.rnd, v.dt::timestamp, v.interviewer, v.fb, v.res
FROM (VALUES
('aarav.sharma@email.com', 'Python Developer', 1, '2026-11-10 10:00', 'Rahul Kapoor', 'Strong problem solving and clear database design.', 'Pass'),
('aarav.sharma@email.com', 'Python Developer', 2, '2026-11-20 14:30', 'Neha Joshi', NULL, 'Pending'),
('priya.verma@email.com', 'Data Analyst', 1, '2026-11-12 11:00', 'Sanjay Rao', 'Good analytical thinking and communication.', 'Pass'),
('rohan.mehta@email.com', 'Full Stack Developer', 1, '2026-11-13 15:00', 'Divya Menon', 'Needs deeper backend knowledge.', 'Fail'),
('sneha.iyer@email.com', 'ML Engineer', 1, '2026-11-22 10:30', 'Arjun Nair', NULL, 'Pending'),
('ananya.das@email.com', 'Database Administrator', 1, '2026-11-14 16:00', 'Kavita Shah', 'Excellent tuning and backup strategy knowledge.', 'Pass')
) AS v(email, title, rnd, dt, interviewer, fb, res)
JOIN candidates c ON c.email = v.email
JOIN jobs j ON j.title = v.title
JOIN applications a ON a.candidate_id = c.candidate_id AND a.job_id = j.job_id;
