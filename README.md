<div align="center">
    <h1>CSI-300: Project 3: Database Integration on Web</h1>
</div>

## Project Outline:

- Design and implement a lightweight Learning Management System (LMS).

  - The LMS will manage (for only one professor):

    - `course enrollment`
    - `course materials`
    - `grade records`

  - Courses:
    - `DAT-210`
    - `DAT-410`
    - `CSI-300-01`
    - `CSI-300-02`

**NOTE:** `CSI-300` has different sections, students must not be allowed to enroll simultaneously.

- Technology Stack:
  - frontend: `React`
  - database: `SQLite`
  - backend: `NodeJS`

## Minimum Project Requirements

- [ ] Stores courses (course prefix, course number, class room, start time) information.
- [ ] Stores students (first name, last name, email, major, graduating year) information.
- [ ] Stores grading (2 quiz, 2 project, final exam) information.
- [ ] Upload some course materials for any one course.
- [ ] A student can be enrolled in multiple courses, but cannot be enrolled in both CSI-300-01 and
      CSI-300-02.
- [ ] A valid sign-in is required for enrollment by the instructor.
