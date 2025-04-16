import {
  Course,
  CourseWithEnrollments,
  CourseWithProfessor,
  CreateCourseInput,
  UpdateCourseInput,
} from "./course";

import {
  Enrollment,
  EnrollmentWithCourseDetails,
  EnrollmentWithStudentDetails,
  CreateEnrollmentInput,
  UpdateEnrollmentStatusInput,
} from "./enrollment";

import {
  CourseItem,
  CourseItemWithDetails,
  CreateCourseItemInput,
  UpdateCourseItemInput,
} from "./courseItem";

import {
  QuizOption,
  QuizQuestion,
  QuizQuestionWithOptions,
  QuizResponse,
  CreateQuizQuestionInput,
  CreateQuizResponseInput,
} from "./quiz";

import {
  Submission,
  SubmissionWithDetails,
  CreateSubmissionInput,
  UpdateSubmissionInput,
} from "./submission";

import {
  User,
  UserWithDetails,
  CreateUserInput,
  UpdateUserInput,
} from "./user";
