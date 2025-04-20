import { AssignmentCompletionStatus } from "@/client/components/course/assignment/AssignmentCompletionStatus";
import { AssignmentResponsesModal } from "@/client/components/course/assignment/AssignmentResponsesModal";
import { TextEditor } from "@/client/components/TextEditor";
import { useAssignmentSubmission } from "@/client/hooks/useAssignmentSubmission";
import { isProfessor } from "@/client/services/authService";
import {
  getCourseItemById,
  updateCourseItem,
} from "@/client/services/courseItemService";
import { getSubmissionsByItemId } from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import { SubmissionWithDetails } from "@/shared/types/models/submission";
import { Button, Spinner, useDisclosure } from "@heroui/react";
import { IconCheck, IconPencil, IconUserCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * AssignmentContent props interface.
 */
interface AssignmentContentProps {
  /**
   * The course item object containing assignment details.
   * @type {CourseItem}
   */
  courseItem: CourseItem;

  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * The enrollment object containing enrollment details.
   * @type {Enrollment | undefined}
   */
  enrollment?: Enrollment;

  /**
   * Callback function to be called when the assignment is submitted.
   * @type {function}
   */
  onSubmit?: () => void;

  /**
   * Callback function to be called when the assignment is refreshed.
   * @type {function}
   */
  onRefresh?: () => void;
}

/**
 * AssignmentContent component to display and manage assignment content.
 * @param {AssignmentContentProps} props - The props for the AssignmentContent component.
 * @returns {JSX.Element} The AssignmentContent component.
 */
export const AssignmentContent = ({
  courseItem,
  courseId,
  enrollment,
  onSubmit,
  onRefresh,
}: AssignmentContentProps): JSX.Element => {
  const [isInProfessorMode] = useState(isProfessor());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [assignmentPrompt, setAssignmentPrompt] = useState(
    courseItem.description || ""
  );
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState<
    SubmissionWithDetails[]
  >([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);

  const responsesModal = useDisclosure();

  const {
    submissionId,
    submissionContent,
    isSubmitting,
    isCompleted,
    handleContentChange,
    handleSubmitAssignment,
    refreshSubmission,
  } = useAssignmentSubmission(courseItem, enrollment, onSubmit);

  useEffect(() => {
    // Update assignment prompt when courseItem changes.
    setAssignmentPrompt(courseItem.description || "");
  }, [courseItem]);

  // Fetch student submissions for professors.
  const fetchStudentSubmissions = async () => {
    if (!isInProfessorMode) return;

    setIsLoadingSubmissions(true);

    try {
      const response = await getSubmissionsByItemId(courseItem.id);

      if (response.success && response.data) {
        const submissions = Array.isArray(response.data)
          ? response.data
          : [response.data];

        setStudentSubmissions(submissions as SubmissionWithDetails[]);
      } else {
        console.error(`Failed to fetch submissions: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error fetching submissions: ${error}`);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (isInProfessorMode) {
      fetchStudentSubmissions();
    }
  }, [isInProfessorMode, courseItem.id]);

  // For professors to update assignment prompt.
  const handleUpdatePrompt = async () => {
    if (!isInProfessorMode) return;

    setIsUpdatingPrompt(true);
    setError(null);

    try {
      const response = await updateCourseItem(courseId, courseItem.id, {
        description: assignmentPrompt,
      });

      if (response.success) {
        setIsEditingPrompt(false);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setError(response.message || "Failed to update assignment prompt");
      }
    } catch (error) {
      console.error(`Error updating assignment prompt: ${error}`);
      setError(
        "An error occurred while updating the assignment. Please try again."
      );
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  // Fetch the latest assignment content.
  const fetchAssignmentContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCourseItemById(courseId, courseItem.id);
      if (response.success && response.data) {
        setAssignmentPrompt(
          Array.isArray(response.data) ? "" : response.data.description || ""
        );
      } else {
        setError(response.message || "Failed to load assignment content");
      }
    } catch (error) {
      console.error(`Error fetching assignment content: ${error}`);
      setError(
        "An error occurred while loading the assignment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing a specific student submission.
  const handleViewSubmission = (submissionId: number) => {
    setSelectedSubmissionId(submissionId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-danger mb-4">{error}</p>
        <Button color="primary" variant="flat" onPress={fetchAssignmentContent}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!isInProfessorMode && isCompleted) {
    return <AssignmentCompletionStatus submissionContent={submissionContent} />;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col space-y-6" style={{ padding: "20px" }}>
        <div className="flex justify-between" style={{ paddingBottom: "10px" }}>
          <h2 className="text-xl font-semibold">Assignment Description</h2>
          {isInProfessorMode && !isEditingPrompt && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<IconPencil size={16} />}
              onPress={() => setIsEditingPrompt(true)}
            >
              Edit Prompt
            </Button>
          )}
          {isInProfessorMode && isEditingPrompt && (
            <div className="flex gap-2">
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => {
                  setIsEditingPrompt(false);
                  setAssignmentPrompt(courseItem.description || "");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                color="success"
                onPress={handleUpdatePrompt}
                isLoading={isUpdatingPrompt}
                endContent={<IconCheck size={16} />}
              >
                Save
              </Button>
            </div>
          )}
        </div>
        <TextEditor
          content={assignmentPrompt}
          isReadOnly={!isInProfessorMode || !isEditingPrompt}
          onChangeContent={
            isInProfessorMode && isEditingPrompt
              ? setAssignmentPrompt
              : undefined
          }
        />

        {!isInProfessorMode && (
          <div className="flex flex-col gap-4" style={{ paddingTop: "20px" }}>
            <h2 className="text-xl font-semibold mb-4">Your Submission</h2>
            <TextEditor
              content={submissionContent}
              isReadOnly={isCompleted}
              onChangeContent={(value: string) => handleContentChange(value)}
            />

            <div className="flex justify-end mt-4">
              <Button
                color="success"
                size="lg"
                disabled={isCompleted || isSubmitting}
                onPress={handleSubmitAssignment}
                isLoading={isSubmitting}
                endContent={<IconCheck size={18} />}
              >
                Submit Assignment
              </Button>
            </div>
          </div>
        )}

        {isInProfessorMode && (
          <div className="flex justify-end mt-2">
            <Button
              color="secondary"
              variant="flat"
              startContent={<IconUserCheck size={18} />}
              onPress={responsesModal.onOpen}
            >
              View Responses
            </Button>
          </div>
        )}
      </div>

      {isInProfessorMode && (
        <AssignmentResponsesModal
          isOpen={responsesModal.isOpen}
          onClose={responsesModal.onClose}
          submissions={studentSubmissions}
          isLoading={isLoadingSubmissions}
          onViewSubmission={handleViewSubmission}
        />
      )}
    </div>
  );
};
