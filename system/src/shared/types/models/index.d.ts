import {
  Course,
  CourseWithEnrollments,
  CourseWithProfessor,
  CreateCourseInput,
  UpdateCourseInput,
} from "./course";

import {
  CreateEnrollmentInput,
  Enrollment,
  EnrollmentWithCourseDetails,
  EnrollmentWithStudentDetails,
  UpdateEnrollmentStatusInput,
} from "./enrollment";

import {
  CourseItem,
  CourseItemWithDetails,
  CreateCourseItemInput,
  UpdateCourseItemInput,
} from "./courseItem";

import {
  CreateQuizQuestionInput,
  CreateQuizResponseInput,
  QuizOption,
  QuizQuestion,
  QuizQuestionWithOptions,
  QuizResponse,
} from "../quiz";

import {
  CreateSubmissionInput,
  Submission,
  SubmissionWithDetails,
  UpdateSubmissionInput,
} from "../submission";

import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserWithDetails,
} from "./user";

import {
  Grade,
  GradeInput,
  GradeWithItemDetails,
  GradeWithStudentDetails,
} from "./grade";
