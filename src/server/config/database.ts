import fs from "fs";
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure SQLite database.
const dbConfig = {
  filename:
    process.env.DB_PATH || path.resolve(__dirname, "../data/database.sqlite"),
  driver: sqlite3.Database,
};

/**
 * Create a SQLite database connection factory.
 * @returns {Promise<sqlite3.Database>} A promise that resolves to the SQLite database connection.
 */
export async function getDb() {
  // Check if the database file exists, if not create it.
  if (!fs.existsSync(dbConfig.filename)) {
    fs.mkdirSync(path.dirname(dbConfig.filename), { recursive: true });
    fs.writeFileSync(dbConfig.filename, "");
  }

  return open(dbConfig);
}

/**
 * Initialize the database by creating necessary tables.
 */
export async function initializeDatabase() {
  const db = await getDb();

  // Create the schema if it doesn't exist.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      first_name TEXT NOT NULL, 
      last_name TEXT NOT NULL, 
      email TEXT NOT NULL UNIQUE, 
      major TEXT,              -- Optional field for students.
      graduation_year INTEGER, -- Optional field for students.
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      profile_id INTEGER NOT NULL, 
      email TEXT NOT NULL UNIQUE, 
      password TEXT NOT NULL, 
      role TEXT NOT NULL CHECK (
        role IN ('admin', 'user', 'professor')
      ), 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      professor_id INTEGER NOT NULL, 
      prefix TEXT NOT NULL, 
      number TEXT NOT NULL,     -- Department code (e.g., CS, MATH).
      room TEXT NOT NULL,       -- Course number (e.g., 101, 102).
      start_time TEXT NOT NULL, -- Format: HH:MM (24-hour).
      end_time TEXT NOT NULL,   -- Format: HH:MM (24-hour).
      days TEXT NOT NULL,       -- Format: "M,...,F" ("M,W,F").

      FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      student_id INTEGER NOT NULL, 
      course_id INTEGER NOT NULL, 
      final_grade TEXT, -- NULL until course is completed.
      enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'dropped', 'completed')
      ), 

      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE, 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, 

      -- Each student can only enroll once in a given course.
      UNIQUE (student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS course_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      course_id INTEGER NOT NULL, 
      name TEXT NOT NULL, 
      type TEXT NOT NULL CHECK (
        type IN ('assignment', 'quiz')
      ), 
      max_points REAL NOT NULL CHECK (max_points > 0), 
      due_date TIMESTAMP NOT NULL, 

      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS item_grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      enrollment_id INTEGER NOT NULL, 
      item_id INTEGER NOT NULL, 
      points_earned REAL CHECK (points_earned >= 0), 
      submission_date TIMESTAMP, 
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE, 
      FOREIGN KEY (item_id) REFERENCES course_items(id) ON DELETE CASCADE, 

      -- Each enrollment can only have one grade per item.
      UNIQUE (enrollment_id, item_id)
    );
  `);

  const triggersExist = await db.get(
    "SELECT name FROM sqlite_master WHERE type='trigger' AND name='update_profiles_timestamp'"
  );

  // If triggers already exist, no need to create them again.
  if (triggersExist) return;

  await db.exec(`
    -- Update timestamps.
    CREATE TRIGGER update_profiles_timestamp
    AFTER UPDATE ON profiles
    BEGIN
        UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- Ensure consistency between users and profiles for timestamps.
    CREATE TRIGGER ensure_update_consistency
    AFTER UPDATE ON profiles
    FOR EACH ROW
    BEGIN
        UPDATE users
        SET updated_at = NEW.updated_at
        WHERE id = NEW.id;
    END;

    -- Ensure consistency between users and profiles for emails.
    CREATE TRIGGER ensure_email_consistency
    AFTER INSERT ON users
    FOR EACH ROW
    BEGIN
        UPDATE profiles 
        SET email = NEW.email
        WHERE id = NEW.profile_id;
    END;

    -- Validate professor role before inserting or updating a course.
    CREATE TRIGGER validate_professor_role
    BEFORE INSERT ON courses
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN (SELECT role FROM users WHERE id = NEW.professor_id) != 'professor'
            THEN RAISE(ABORT, 'Only users with professor role can be assigned as professors')
        END;
    END;

    -- Validate points earned don't exceed max points.
    CREATE TRIGGER validate_points_earned
    BEFORE INSERT ON item_grades
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.points_earned > (SELECT max_points FROM course_items WHERE id = NEW.item_id)
            THEN RAISE(ABORT, 'Points earned cannot exceed max points')
        END;
    END;

    -- Validate points earned don't exceed max points on update.
    CREATE TRIGGER validate_points_earned_update
    BEFORE UPDATE ON item_grades
    FOR EACH ROW
    BEGIN
        SELECT CASE
            WHEN NEW.points_earned > (SELECT max_points FROM course_items WHERE id = NEW.item_id)
            THEN RAISE(ABORT, 'Points earned cannot exceed max points')
        END;
    END;
  `);

  console.log("Database initialized successfully");
  await db.close();
}
