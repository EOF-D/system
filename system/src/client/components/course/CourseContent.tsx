import { AssignmentContent } from "@/client/components/course/assignment/AssignmentContent";
import { DocumentContent } from "@/client/components/course/document/DocumentContent";
import { QuizContent } from "@/client/components/course/quiz/QuizContent";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import { Spinner } from "@heroui/react";
import { useState } from "react";

/**
 * CourseContent props interface.
 */
interface CourseContentProps {
  /**
   * The course item object containing course material details.
   * @type {CourseItem}
   */
  courseItem: CourseItem;

  /**
   * The enrollment object containing enrollment details.
   * @type {Enrollment | undefined}
   */
  enrollment?: Enrollment;

  /**
   * Callback function to be called when an item is submitted.
   * @type {function}
   */
  onSubmit?: () => void;

  /**
   * Callback function to be called when an item is refreshed.
   * @type {function}
   */
  onRefresh?: () => void;
}

/**
 * CourseContent component to display the appropriate content based on item type.
 * @param {CourseContentProps} props - The props for the CourseContent component.
 * @returns {JSX.Element} The CourseContent component.
 */
export const CourseContent = ({
  courseItem,
  enrollment,
  onSubmit,
  onRefresh,
}: CourseContentProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  switch (courseItem.type) {
    case "quiz":
      return (
        <QuizContent
          courseItem={courseItem}
          enrollment={enrollment}
          onSubmit={onSubmit}
          onRefresh={onRefresh}
        />
      );
    case "assignment":
      return (
        <AssignmentContent
          courseId={courseItem.course_id}
          courseItem={courseItem}
          enrollment={enrollment}
          onSubmit={onSubmit}
          onRefresh={onRefresh}
        />
      );
    case "document":
      return (
        <DocumentContent
          courseId={courseItem.course_id}
          courseItem={courseItem}
          onRefresh={onRefresh}
        />
      );
    default:
      return (
        <div className="p-6 text-center text-default-500">
          <p>This content type is not supported yet.</p>
        </div>
      );
  }
};
