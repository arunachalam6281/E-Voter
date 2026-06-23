-- =============================================
-- E-Voter Database Schema
-- Module 1: Authentication
-- =============================================

CREATE DATABASE IF NOT EXISTS evoter;
USE evoter;

-- ---------------------------------------------
-- Table: users
-- Stores all registered voters and admins.
-- Each user has a role: VOTER or ADMIN.
-- password_hash stores BCrypt-encrypted password.
-- is_verified controls whether the voter is
-- approved to cast a vote.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          ENUM('VOTER','ADMIN') NOT NULL DEFAULT 'VOTER',
    is_verified   BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- Seed: Default Admin Account
-- Password is 'admin123' BCrypt-hashed.
-- Change this immediately in production.
-- ---------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, is_verified)
VALUES (
    'System Admin',
    'admin@evoter.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    TRUE
);

-- =============================================
-- Module 2: Election Management
-- =============================================

-- ---------------------------------------------
-- Table: elections
-- Stores all election events created by admins.
--
-- status column uses VARCHAR (not MySQL ENUM)
-- so that adding new statuses later doesn't
-- require an ALTER TABLE on the column type.
-- The application enum enforces valid values.
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS elections (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200)                         NOT NULL,
    description TEXT,
    start_date  DATETIME                             NOT NULL,
    end_date    DATETIME                             NOT NULL,
    status      VARCHAR(20)                          NOT NULL DEFAULT 'UPCOMING',
    created_at  TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Ensures no two elections share the same title
    CONSTRAINT uq_election_title UNIQUE (title),

    -- Ensures end_date is always after start_date at the DB level
    CONSTRAINT chk_election_dates CHECK (end_date > start_date)
);

-- ---------------------------------------------
-- Seed: Sample Elections for development/testing
-- ---------------------------------------------
INSERT INTO elections (title, description, start_date, end_date, status) VALUES
(
    'Presidential Election 2024',
    'National election to choose the President of the country.',
    '2024-11-01 08:00:00',
    '2024-11-01 20:00:00',
    'UPCOMING'
),
(
    'City Council Election',
    'Election for city council members in all districts.',
    '2024-10-15 09:00:00',
    '2024-10-15 17:00:00',
    'ACTIVE'
),
(
    'Student Union Election 2024',
    'Annual election for student union president and committee.',
    '2024-09-01 08:00:00',
    '2024-09-01 18:00:00',
    'COMPLETED'
);

-- =============================================
-- Module 3: Candidate Management
-- =============================================

-- ---------------------------------------------
-- Table: candidates
-- Each candidate belongs to exactly one election.
--
-- ON DELETE CASCADE: deleting an election
-- automatically removes all its candidates,
-- preventing orphan records.
--
-- image_url is optional — stores a URL string,
-- not the file itself (files are hosted separately).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    description TEXT,
    image_url   VARCHAR(500),
    election_id BIGINT        NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- FK to elections — cascade delete keeps data consistent
    CONSTRAINT fk_candidate_election
        FOREIGN KEY (election_id) REFERENCES elections(id)
        ON DELETE CASCADE,

    -- Index on election_id — speeds up
    -- SELECT * FROM candidates WHERE election_id = ?
    -- which is the most frequent query in this module
    INDEX idx_candidate_election (election_id)
);

-- ---------------------------------------------
-- Seed: Sample Candidates (tied to seed elections)
-- Assumes elections were inserted with id 1, 2, 3
-- ---------------------------------------------
INSERT INTO candidates (name, description, image_url, election_id) VALUES
('Alice Johnson',  'Experienced leader with 15 years in public service.',   NULL, 1),
('Bob Martinez',   'Former mayor focused on economic growth.',               NULL, 1),
('Carol Smith',    'Advocate for education and healthcare reform.',          NULL, 1),
('David Lee',      'City councillor running for District 1.',                NULL, 2),
('Emma Wilson',    'Community organiser and small business owner.',          NULL, 2),
('Frank Garcia',   'Student leader with focus on campus sustainability.',    NULL, 3),
('Grace Kim',      'Final year student promoting mental health awareness.',  NULL, 3);

-- =============================================
-- Module 4: Voting System
-- =============================================

-- ---------------------------------------------
-- Table: votes
-- Each row = one vote cast by one voter in one
-- election for one candidate.
--
-- UNIQUE KEY uq_voter_election:
--   Enforces one-vote-per-election at the DB level.
--   This is the second line of defence after the
--   application-layer check in VoteService.
--   Even if the app check is bypassed (e.g. race
--   condition, direct DB access), this constraint
--   guarantees integrity.
--
-- No ON DELETE CASCADE — votes are a permanent
--   audit trail. Deleting an election or candidate
--   should be blocked if votes exist (enforced in
--   VoteService, not FK constraint).
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    voter_id     BIGINT    NOT NULL,
    election_id  BIGINT    NOT NULL,
    candidate_id BIGINT    NOT NULL,
    voted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Core integrity constraint: one vote per voter per election
    CONSTRAINT uq_voter_election UNIQUE (voter_id, election_id),

    CONSTRAINT fk_vote_voter
        FOREIGN KEY (voter_id)     REFERENCES users(id),
    CONSTRAINT fk_vote_election
        FOREIGN KEY (election_id)  REFERENCES elections(id),
    CONSTRAINT fk_vote_candidate
        FOREIGN KEY (candidate_id) REFERENCES candidates(id),

    -- Speeds up results queries per election
    INDEX idx_vote_election     (election_id),
    -- Speeds up per-candidate vote counts
    INDEX idx_vote_candidate    (candidate_id)
);
