import { isProfessor } from "@/client/services/authService";
import { formatDate } from "@/client/utils/format";
import { getMyEnrollments } from "@/client/services/enrollmentService";
import {
  createSubmission,
  getSubmissionById,
  getSubmissionsByItemId,
  updateSubmission,
} from "@/client/services/submissionService";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { EnrollmentWithCourseDetails } from "@shared/types/models/enrollment";
import {
  Submission,
  SubmissionWithDetails,
} from "@shared/types/models/submission";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconFileText,
  IconPencil,
  IconSend,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * AssignmentView props interface.
 */
interface AssignmentViewProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * The ID of the assignment item.
   * @type {number}
   */
  itemId: number;

  /**
   * The name of the assignment item.
   * @type {string}
   */
  itemName: string;

  /**
   * The description of the assignment.
   * @type {string}
   */
  description: string;

  /**
   * The due date of the assignment.
   * @type {string}
   */
  dueDate: string;

  /**
   * The maximum points for the assignment.
   * @type {number}
   */
  maxPoints: number;

  /**
   * Callback function to be called when the submission changes.
   * @type {function}
   */
  onSubmissionChange?: () => void;
}

/**
 * AssignmentView component to display assignment details and submission form.
 * @param {AssignmentViewProps} props - The props for the component.
 * @return {JSX.Element} The AssignmentView component.
 */
export const AssignmentView = ({
  courseId,
  itemId,
  itemName,
  description,
  dueDate,
  maxPoints,
  onSubmissionChange,
}: AssignmentViewProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<
    Submission | SubmissionWithDetails | null
  >(null);

  const [content, setContent] = useState("");
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithDetails[]>(
    []
  );

  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithDetails | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [grading, setGrading] = useState(false);

  const isProfessorView = isProfessor();
  const isSubmitted =
    submission?.status === "submitted" || submission?.status === "graded";

  const isGraded = submission?.status === "graded";
  const isPastDue = new Date(dueDate) < new Date();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchAssignmentData();
  }, [courseId, itemId]);

  const fetchAssignmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isProfessorView) {
        // Fetch all submissions for the assignment.
        const response = await getSubmissionsByItemId(itemId);
        if (response.success && response.data) {
          setAllSubmissions(response.data as SubmissionWithDetails[]);
        }
      } else {
        // Fetch student's submission if it exists.
        const response = await getSubmissionById(itemId);
        if (response.success && response.data) {
          const submissionData = response.data as SubmissionWithDetails;
          setSubmission(submissionData);
          setContent(submissionData.content || "");

          if (submissionData.points_earned !== undefined) {
            setPoints(submissionData.points_earned);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching assignment data: ${error}`);
      setError("An error occurred while loading the assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmission = async () => {
    setSubmitting(true);

    try {
      const enrollmentsResponse = await getMyEnrollments("active");
      if (!enrollmentsResponse.success || !enrollmentsResponse.data) {
        setError("Failed to retrieve your enrollment information");
        setSubmitting(false);
        return;
      }

      // Find the enrollment for this specific course.
      const enrollments =
        enrollmentsResponse.data as EnrollmentWithCourseDetails[];

      const courseEnrollment = enrollments.find(
        (e) => e.course_id === courseId
      );

      if (!courseEnrollment) {
        setError("You are not enrolled in this course");
        setSubmitting(false);
        return;
      }

      const response = await createSubmission({
        enrollment_id: courseEnrollment.id,
        item_id: itemId,
        content: content,
        status: "draft",
      });

      if (response.success && response.data) {
        setSubmission(response.data as Submission);
        if (onSubmissionChange) onSubmissionChange();
      } else {
        setError("Failed to create submission");
      }
    } catch (error) {
      console.error(`Error creating submission: ${error}`);
      setError("An error occurred while creating your submission");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmission = async () => {
    if (!submission) return;

    setSubmitting(true);

    try {
      const response = await updateSubmission(submission.id, {
        content: content,
        status: submission.status, // Keep the same status.
      });

      if (response.success && response.data) {
        setSubmission(response.data as Submission);
        if (onSubmissionChange) onSubmissionChange();
      } else {
        setError("Failed to update submission");
      }
    } catch (error) {
      console.error(`Error updating submission: ${error}`);
      setError("An error occurred while updating your submission");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submission) return;

    // Confirm submission.
    if (
      !confirm(
        "Are you sure you want to submit this assignment? You won't be able to edit it after submission."
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await updateSubmission(submission.id, {
        content: content,
        status: "submitted",
      });

      if (response.success && response.data) {
        setSubmission(response.data as Submission);
        if (onSubmissionChange) onSubmissionChange();
      } else {
        setError("Failed to submit assignment");
      }
    } catch (error) {
      console.error(`Error submitting assignment: ${error}`);
      setError("An error occurred while submitting your assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    setGrading(true);

    try {
      // Update with grade.
      // TODO: implement grading logic for the server.
      const response = await updateSubmission(selectedSubmission.id, {
        status: "graded",
        // points_earned: points,
      });

      if (response.success) {
        await fetchAssignmentData();
        onClose();
      } else {
        setError("Failed to grade submission");
      }
    } catch (error) {
      console.error(`Error grading submission: ${error}`);
      setError("An error occurred while grading the submission");
    } finally {
      setGrading(false);
    }
  };

  const openSubmissionModal = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setPoints(submission.points_earned || 0);
    onOpen();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border border-danger-200">
        <CardBody>
          <div className="flex items-center gap-2 text-danger">
            <IconAlertCircle size={20} />
            <p>{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Professor view.
  if (isProfessorView) {
    return (
      <>
        <Card className="mb-4">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assignment Submissions</h2>
            <Chip color="primary">{maxPoints} points</Chip>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Assignment Details</h3>
              <p className="mb-2">{description}</p>
              <p className="text-sm text-default-600">
                Due date: {new Date(dueDate).toLocaleString()}
              </p>
            </div>

            <Divider className="my-4" />

            <Table aria-label="Assignment submissions">
              <TableHeader>
                <TableColumn>STUDENT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>GRADE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {allSubmissions.length > 0 ? (
                  allSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={sub.student_full_name} size="sm" />
                          <span>{sub.student_full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            sub.status === "submitted"
                              ? "primary"
                              : sub.status === "graded"
                                ? "success"
                                : "default"
                          }
                        >
                          {sub.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {sub.submission_date
                          ? formatDate(sub.submission_date)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {sub.points_earned !== undefined &&
                        sub.status === "graded" ? (
                          <span>
                            {sub.points_earned} / {maxPoints}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => openSubmissionModal(sub)}
                        >
                          {sub.status === "graded" ? "Review" : "Grade"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="text-center py-4 text-default-500">
                        No submissions yet
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalContent>
            {selectedSubmission && (
              <>
                <ModalHeader className="flex justify-between items-center">
                  <span>Student Submission</span>
                  <Chip
                    size="sm"
                    color={
                      selectedSubmission.status === "submitted"
                        ? "primary"
                        : selectedSubmission.status === "graded"
                          ? "success"
                          : "default"
                    }
                  >
                    {selectedSubmission.status}
                  </Chip>
                </ModalHeader>
                <ModalBody>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">
                        {selectedSubmission.student_full_name}
                      </h3>
                      <span className="text-sm text-default-600">
                        Submitted:{" "}
                        {selectedSubmission.submission_date
                          ? formatDate(selectedSubmission.submission_date)
                          : "N/A"}
                      </span>
                    </div>

                    <div className="border rounded-lg p-4 bg-default-50 whitespace-pre-wrap">
                      {selectedSubmission.content || "No content submitted"}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Input
                      type="number"
                      label="Points"
                      min={0}
                      max={maxPoints}
                      value={points.toString()}
                      onValueChange={(value) => setPoints(Number(value))}
                      description={`Maximum points: ${maxPoints}`}
                      isDisabled={selectedSubmission.status === "graded"}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="bordered" onPress={onClose}>
                    Close
                  </Button>
                  {selectedSubmission.status !== "graded" && (
                    <Button
                      color="primary"
                      onPress={handleGradeSubmission}
                      isLoading={grading}
                      isDisabled={grading}
                    >
                      Grade Submission
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Student view.
  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{itemName}</h2>
          <p className="text-sm text-default-600">
            Due: {new Date(dueDate).toLocaleString()}
          </p>
        </div>
        <Chip color="primary">{maxPoints} points</Chip>
      </CardHeader>

      <CardBody>
        <div className="mb-4">
          <h3 className="font-medium mb-2">Assignment Description</h3>
          <p className="mb-4">{description}</p>

          {isPastDue && !submission && (
            <div className="bg-danger-100 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-danger">
                <IconAlertCircle size={20} />
                <p>
                  This assignment is past due and can no longer be submitted.
                </p>
              </div>
            </div>
          )}

          {isGraded && (
            <div className="bg-success-100 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <IconCheck size={20} className="text-success" />
                <div>
                  <p className="text-success font-medium">
                    This assignment has been graded.
                  </p>
                  <p className="text-sm">
                    Your score:{" "}
                    {submission && "points_earned" in submission
                      ? submission.points_earned
                      : "N/A"}{" "}
                    / {maxPoints}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSubmitted && !isGraded && (
            <div className="bg-primary-100 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <IconClock size={20} className="text-primary" />
                <p className="text-primary">
                  Your submission is awaiting grading.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <Textarea
            label="Your Submission"
            placeholder="Type your submission here..."
            value={content}
            onValueChange={setContent}
            rows={8}
            isDisabled={isSubmitted || isPastDue || !submission}
            className="mb-4"
          />

          {!submission && !isPastDue && (
            <Button
              color="primary"
              startContent={<IconFileText size={18} />}
              onPress={handleCreateSubmission}
              isLoading={submitting}
              isDisabled={!content || submitting}
              className="mr-2"
            >
              Save Draft
            </Button>
          )}

          {submission && submission.status === "draft" && (
            <>
              <Button
                color="primary"
                variant="bordered"
                startContent={<IconPencil size={18} />}
                onPress={handleUpdateSubmission}
                isLoading={submitting}
                isDisabled={!content || submitting}
                className="mr-2"
              >
                Update Draft
              </Button>

              <Button
                color="success"
                startContent={<IconSend size={18} />}
                onPress={handleSubmitAssignment}
                isLoading={submitting}
                isDisabled={!content || submitting}
              >
                Submit Assignment
              </Button>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
