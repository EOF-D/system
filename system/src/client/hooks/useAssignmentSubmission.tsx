import {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  updateSubmission,
} from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import { useEffect, useState } from "react";

/**
 * Custom hook to manage assignment submissions.
 * @param {CourseItem} courseItem - The assignment course item.
 * @param {Enrollment | undefined} enrollment - The student's enrollment.
 * @param {function | undefined} onSubmit - Callback when assignment is submitted.
 */
export const useAssignmentSubmission = (
  courseItem: CourseItem,
  enrollment?: Enrollment,
  onSubmit?: () => void
) => {
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (enrollment) {
      initializeStudentView();
    }
  }, [courseItem.id, enrollment]);

  /**
   * Initialize the student view by checking for existing submissions.
   */
  const initializeStudentView = async () => {
    if (!enrollment) return;

    try {
      await checkExistingSubmission();
      setIsInitialized(true);
    } catch (error) {
      console.error(`Error initializing student view: ${error}`);
    }
  };

  /**
   * Check if there is an existing submission for the student.
   * If not, create a new submission.
   */
  const checkExistingSubmission = async () => {
    if (!enrollment) return;

    try {
      const existingSubmissions = await getMySubmissions(courseItem.course_id);

      if (existingSubmissions.success && existingSubmissions.data) {
        const submissions = Array.isArray(existingSubmissions.data)
          ? existingSubmissions.data
          : [existingSubmissions.data];

        // Find a submission for this course item.
        const existingSubmission = submissions.find(
          (sub) => sub.item_id === courseItem.id
        );

        if (existingSubmission) {
          // Use the existing submission.
          setSubmissionId(existingSubmission.id);
          setSubmissionContent(existingSubmission.content || "");

          // If submission is already submitted, mark as completed.
          if (existingSubmission.status === "submitted") {
            setIsCompleted(true);
          }

          return;
        }
      }

      // If no existing submission was found, create a new one.
      const submissionData = {
        enrollment_id: enrollment.id,
        item_id: courseItem.id,
        status: "draft" as "draft",
      };

      const response = await createSubmission(submissionData);
      if (response.success && response.data) {
        const submission = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        setSubmissionId(submission.id);
      }
    } catch (error) {
      console.error(`Error checking existing submission: ${error}`);
    }
  };

  /**
   * Refresh the submission data.
   */
  const refreshSubmission = async () => {
    if (!submissionId) return;

    setIsRefreshing(true);

    try {
      const response = await getSubmissionById(submissionId);

      if (response.success && response.data) {
        const submission = response.data;
        if (!Array.isArray(submission)) {
          setSubmissionContent(submission.content || "");

          if (submission.status === "submitted") {
            setIsCompleted(true);
          }
        }
      }
    } catch (error) {
      console.error(`Error refreshing submission: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle content change for the assignment submission.
   * @param {string} content - The new content.
   */
  const handleContentChange = (content: string) => {
    setSubmissionContent(content);
  };

  /**
   * Save draft of the assignment (without submitting).
   */
  const handleSaveDraft = async () => {
    if (!submissionId) {
      if (enrollment) {
        await checkExistingSubmission();
      } else {
        return;
      }
    }

    if (!submissionId) return;

    try {
      await updateSubmission(submissionId, {
        content: submissionContent,
        status: "draft",
      });
    } catch (error) {
      console.error(`Error saving draft: ${error}`);
    }
  };

  /**
   * Submit the assignment.
   */
  const handleSubmitAssignment = async () => {
    if (!submissionId) {
      if (enrollment) {
        await checkExistingSubmission();
      } else {
        return;
      }
    }

    if (!submissionId) return;
    setIsSubmitting(true);

    try {
      // Update the submission with the content and status.
      const response = await updateSubmission(submissionId, {
        content: submissionContent,
        status: "submitted",
      });

      if (response.success) {
        setIsCompleted(true);
        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.error(`Error submitting assignment: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submissionId,
    submissionContent,
    isSubmitting,
    isCompleted,
    isInitialized,
    isRefreshing,
    handleContentChange,
    handleSaveDraft,
    handleSubmitAssignment,
    refreshSubmission,
  };
};
