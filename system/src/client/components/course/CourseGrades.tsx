import { useGrades } from "@/client/hooks/useGrades";
import { isProfessor } from "@/client/services/authService";
import { getCourseEnrollments } from "@/client/services/enrollmentService";
import { formatDate } from "@/client/utils/format";
import { CourseItem } from "@/shared/types/models/courseItem";
import { GradeWithItemDetails } from "@/shared/types/models/grade";
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
  Progress,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { IconBulb, IconChecklist, IconUserCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * Capitalize the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get the color for the item type.
 * @param {string} type - The type of the item (assignment, quiz, etc.).
 * @returns {"primary" | "secondary" | "default"} The color for the item type.
 */
const getItemTypeColor = (
  type: string
): "primary" | "secondary" | "default" => {
  switch (type) {
    case "assignment":
      return "primary";
    case "quiz":
      return "secondary";
    default:
      return "default";
  }
};

/**
 * Get the color for the percentage.
 * @param {number} percentage - The percentage value.
 * @returns {"success" | "warning" | "danger"} The color for the percentage.
 */
const getPercentageColor = (
  percentage: number
): "success" | "warning" | "danger" => {
  if (percentage >= 80) return "success";
  if (percentage >= 60) return "warning";
  return "danger";
};

/**
 * Get the color for the grade.
 * @param {string} grade - The letter grade (A, B, C, etc.).
 * @returns {"success" | "primary" | "warning" | "danger"} The color for the grade.
 */
const getGradeColor = (
  grade: string
): "success" | "primary" | "warning" | "danger" => {
  if (grade.startsWith("A")) return "success";
  if (grade.startsWith("B")) return "primary";
  if (grade.startsWith("C")) return "warning";
  return "danger";
};

/**
 * CourseGrades props interface.
 */
interface CourseGradesProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * List of course items.
   * @type {CourseItem[]}
   */
  courseItems: CourseItem[];

  /**
   * Loading state for course items.
   * @type {boolean}
   */
  isLoading: boolean;

  /**
   * Optional callback function to be called when grades change.
   * @type {function | undefined}
   */
  onGradesChange?: () => void;
}

/**
 * CourseGrades component to display and manage grades.
 * @param {CourseGradesProps} props - The component props.
 * @returns {JSX.Element} The CourseGrades component.
 */
export const CourseGrades = ({
  courseId,
  courseItems,
  isLoading,
  onGradesChange,
}: CourseGradesProps): JSX.Element => {
  const [isProfessorMode] = useState(isProfessor());
  const gradesHook = useGrades();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [gradesByItem, setGradesByItem] = useState<GradeWithItemDetails[]>([]);
  const [currentGradeValue, setCurrentGradeValue] = useState<string>("");
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [finalizingGrades, setFinalizingGrades] = useState<boolean>(false);

  const studentModal = useDisclosure();
  const itemModal = useDisclosure();
  const finalizeModal = useDisclosure();

  // Load initial data.
  useEffect(() => {
    if (isProfessorMode) {
      fetchEnrollments();
    } else {
      gradesHook.fetchMyGrades(courseId);
    }
  }, [courseId, isProfessorMode]);

  const fetchEnrollments = async () => {
    try {
      const response = await getCourseEnrollments(courseId);
      if (response.success && response.data) {
        const enrollments = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setEnrollments(enrollments);
      }
    } catch (error) {
      console.error(`Error fetching enrollments: ${error}`);
    }
  };

  const handleSelectStudent = async (studentId: number) => {
    setSelectedStudentId(studentId);

    await gradesHook.fetchStudentGrades(courseId, studentId);
    studentModal.onOpen();
  };

  const handleSelectItem = async (itemId: number) => {
    setSelectedItemId(itemId);

    const grades = await gradesHook.fetchItemGrades(itemId);
    setGradesByItem(grades || []);

    itemModal.onOpen();
  };

  const handleSubmitGrade = async (enrollmentId: number, itemId: number) => {
    if (!currentGradeValue) return;

    const pointsEarned = parseFloat(currentGradeValue);
    if (isNaN(pointsEarned) || pointsEarned < 0) return;

    setIsGrading(true);

    try {
      await gradesHook.submitGrade({
        enrollment_id: enrollmentId,
        item_id: itemId,
        points_earned: pointsEarned,
      });

      // Refresh data.
      if (selectedItemId) await gradesHook.fetchItemGrades(selectedItemId);
      if (selectedStudentId)
        await gradesHook.fetchStudentGrades(courseId, selectedStudentId);
      if (onGradesChange) onGradesChange();

      setCurrentGradeValue("");
    } catch (error) {
      console.error(`Error submitting grade: ${error}`);
    } finally {
      setIsGrading(false);
    }
  };

  const handleFinalizeGrades = async () => {
    setFinalizingGrades(true);

    try {
      await gradesHook.finalizeGrades(courseId);
      if (onGradesChange) onGradesChange();
      finalizeModal.onClose();
    } catch (error) {
      console.error(`Error finalizing grades: ${error}`);
    } finally {
      setFinalizingGrades(false);
    }
  };

  const renderStudentView = () => {
    if (gradesHook.loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (gradesHook.error) {
      return (
        <div className="p-6 text-center">
          <p className="text-danger mb-4">{gradesHook.error}</p>
          <Button
            color="primary"
            variant="flat"
            onPress={() => gradesHook.fetchMyGrades(courseId)}
          >
            Try Again
          </Button>
        </div>
      );
    }

    const { grades, ungradedItems, finalGrade } = gradesHook.courseGrades;
    const percentage = gradesHook.calculatePercentage(grades);
    const letterGrade = finalGrade || gradesHook.getLetterGrade(percentage);

    const allItems = [
      ...grades.map((grade) => ({
        id: grade.id,
        itemId: grade.item_id,
        name: grade.item_name,
        type: grade.item_type,
        maxPoints: grade.max_points,
        pointsEarned: grade.points_earned,
        isGraded: true,
      })),
      ...ungradedItems.map((item) => ({
        id: `ungraded-${item.id}`,
        itemId: item.id,
        name: item.name,
        type: item.type,
        maxPoints: item.max_points,
        pointsEarned: null,
        isGraded: false,
      })),
    ];

    return (
      <div className="flex flex-col gap-4" style={{ padding: "20px" }}>
        <Card className="shadow-sm border border-default-200">
          <CardHeader className="flex justify-between items-center bg-default-100">
            <h3 className="text-lg font-medium">Grade Summary</h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {percentage.toFixed(1)}%
              </span>
              <Chip size="md" color={getGradeColor(letterGrade)}>
                {letterGrade}
              </Chip>
            </div>
          </CardHeader>
          <CardBody>
            <Progress
              aria-label="Grade percentage"
              value={percentage}
              color={getGradeColor(letterGrade)}
              className="mb-4"
              showValueLabel={true}
            />
            <div className="text-sm text-default-500">
              {finalGrade
                ? "Final grade has been submitted"
                : "Provisional grade based on current submissions"}
            </div>
          </CardBody>
        </Card>

        <h3 className="text-lg font-medium">Assignments & Quizzes</h3>
        <Table aria-label="Grades table" removeWrapper>
          <TableHeader>
            <TableColumn>ITEM</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>POINTS</TableColumn>
            <TableColumn>PERCENTAGE</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No items found">
            {allItems.map((item) => {
              const itemPercentage = item.isGraded
                ? item.pointsEarned !== null
                  ? (item.pointsEarned / item.maxPoints) * 100
                  : null
                : null;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getItemTypeColor(item.type)}
                      variant="flat"
                    >
                      {capitalize(item.type)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {item.isGraded ? (
                      `${item.pointsEarned} / ${item.maxPoints}`
                    ) : (
                      <span className="text-default-400">
                        {`Not graded (${item.maxPoints} possible)`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.isGraded ? (
                      <Chip
                        size="sm"
                        color={getPercentageColor(itemPercentage ?? 0)}
                        variant="flat"
                      >
                        {(itemPercentage ?? 0).toFixed(1)}%
                      </Chip>
                    ) : (
                      <span className="text-default-300 italic text-sm">
                        Pending
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderProfessorView = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4" style={{ padding: "20px" }}>
        <h3 className="text-lg font-medium mb-2">Grading Options</h3>

        <Table aria-label="Assignments table" removeWrapper>
          <TableHeader>
            <TableColumn>ASSIGNMENT</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>DUE DATE</TableColumn>
            <TableColumn>POINTS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No assignments found">
            {courseItems
              .filter((item) => item.type !== "document")
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getItemTypeColor(item.type)}
                      variant="flat"
                    >
                      {capitalize(item.type)}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatDate(item.due_date)}</TableCell>
                  <TableCell>{item.max_points}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleSelectItem(item.id)}
                    >
                      Grade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="mb-6 mt-6">
      <div
        className="flex justify-between items-center mb-4"
        style={{ padding: "20px" }}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="bg-primary-100 text-primary-500 p-2 rounded-full mr-2">
            <IconUserCheck size={20} />
          </span>
          Course Grades
        </h2>
      </div>
      <Divider />

      {isProfessorMode ? renderProfessorView() : renderStudentView()}

      <Modal
        isOpen={itemModal.isOpen}
        onClose={itemModal.onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {selectedItemId &&
              courseItems.find((item) => item.id === selectedItemId)?.name}
          </ModalHeader>
          <ModalBody>
            {gradesHook.loading ? (
              <div className="flex justify-center items-center p-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : (
              <Table aria-label="Item grades" removeWrapper>
                <TableHeader>
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>POINTS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No students graded yet">
                  {enrollments.map((enrollment) => {
                    const grade = gradesByItem.find(
                      (g) =>
                        g.enrollment_id === enrollment.id &&
                        selectedItemId &&
                        g.item_id === selectedItemId
                    );

                    const maxPoints = selectedItemId
                      ? courseItems.find((item) => item.id === selectedItemId)
                          ?.max_points || 0
                      : 0;

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={enrollment.student_full_name}
                              size="sm"
                              color="primary"
                              isBordered
                            />
                            <span className="font-medium">
                              {enrollment.student_full_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {grade ? (
                            <div className="flex items-center">
                              <span className="font-medium">
                                {grade.points_earned}
                              </span>
                              <span className="text-default-500 mx-1">/</span>
                              <span>{maxPoints}</span>
                            </div>
                          ) : (
                            <span className="text-default-400">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              size="sm"
                              placeholder="Points"
                              min="0"
                              max={maxPoints.toString()}
                              value={currentGradeValue}
                              onValueChange={setCurrentGradeValue}
                            />
                            <Button
                              size="sm"
                              color="primary"
                              isLoading={isGrading}
                              onPress={() =>
                                handleSubmitGrade(
                                  enrollment.id,
                                  selectedItemId || 0
                                )
                              }
                              isDisabled={!selectedItemId}
                            >
                              {grade ? "Update" : "Grade"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* TODO: unhide and implement fully. */}
      <Modal
        isOpen={finalizeModal.isOpen}
        onClose={finalizeModal.onClose}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Finalize Course Grades</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-warning-600 bg-warning-50 p-3 rounded-lg">
                <IconBulb size={24} />
                <div>
                  <p className="font-medium">Important Note</p>
                  <p className="text-sm">
                    Finalizing grades will calculate final grades for all
                    students. This action cannot be undone.
                  </p>
                </div>
              </div>

              <p>
                Are you sure you want to finalize grades for this course? This
                will:
              </p>

              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Calculate final letter grades for all students</li>
                <li>Set the course status to "completed"</li>
                <li>Make grades visible to students on their dashboard</li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={finalizeModal.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleFinalizeGrades}
              isLoading={finalizingGrades}
            >
              Confirm Finalization
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
