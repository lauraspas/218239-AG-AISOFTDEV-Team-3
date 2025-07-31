CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('New Hire', 'Team Manager', 'HR Specialist'))
);

CREATE TABLE onboarding_tasks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE training_modules (
    id INTEGER PRIMARY KEY,
    module_name TEXT NOT NULL,
    description TEXT,
    role TEXT NOT NULL CHECK(role IN ('New Hire', 'Team Manager', 'HR Specialist'))
);

CREATE TABLE user_training_progress (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    training_module_id INTEGER NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    quiz_score INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (training_module_id) REFERENCES training_modules(id)
);

CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    is_signed BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE communication (
    id INTEGER PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    feedback_text TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);