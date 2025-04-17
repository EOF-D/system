import { useAuth } from "@/client/context/auth";
import { getCourseItemById } from "@/client/services/courseItemService";
import { AssignmentView } from "@client/components/AssignmentView";
import { DocumentView } from "@client/components/DocumentView";
import { QuizView } from "@client/components/QuizView";
import { Card, CardBody, Spinner } from "@heroui/react";
import { CourseItem } from "@shared/types/models/courseItem";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * CourseItemView props interface.
 */
interface CourseItemViewProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * The ID of the course item.
   * @type {number}
   */
  itemId: number;

  /**
   * Callback function to refresh the item.
   * @type {function}
   */
  refreshItem?: () => void;
}

/**
 * CourseItemView component to display a course item based on its type.
 * @param {CourseItemViewProps} props - The props for the CourseItemView component.
 * @return {JSX.Element} The rendered CourseItemView component.
 */
export const CourseItemView = ({
  courseId,
  itemId,
  refreshItem,
}: CourseItemViewProps): JSX.Element => {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseItem, setCourseItem] = useState<CourseItem | null>(null);

  useEffect(() => {
    if (isLoggedIn && courseId && itemId) {
      loadCourseItem();
    }
  }, [isLoggedIn, courseId, itemId]);

  const loadCourseItem = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCourseItemById(courseId, itemId);
      if (response.success && response.data) {
        setCourseItem(response.data as CourseItem);
      } else {
        setError(response.message || "Failed to load course item");
      }
    } catch (error) {
      console.error(`Error loading course item: ${error}`);
      setError("An error occurred while loading this item");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = () => {
    if (refreshItem) {
      refreshItem();
    } else {
      loadCourseItem();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !courseItem) {
    return (
      <Card className="mb-4 border border-danger-200">
        <CardBody>
          <div className="flex items-center gap-2 text-danger">
            <IconAlertCircle size={20} />
            <p>{error || "Course item not found"}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const renderItemContent = () => {
    switch (courseItem.type) {
      case "assignment":
        return (
          <AssignmentView
            courseId={courseId}
            itemId={itemId}
            itemName={courseItem.name}
            description={courseItem.description}
            dueDate={courseItem.due_date}
            maxPoints={courseItem.max_points}
            onSubmissionChange={handleItemChange}
          />
        );
      case "quiz":
        return (
          <QuizView
            courseId={courseId}
            itemId={itemId}
            dueDate={courseItem.due_date}
            maxPoints={courseItem.max_points}
            onSubmitSuccess={handleItemChange}
          />
        );
      case "document":
        return (
          <DocumentView
            courseId={courseId}
            itemId={itemId}
            itemName={courseItem.name}
            description={courseItem.description}
          />
        );
      default:
        return (
          <Card className="mb-4">
            <CardBody>
              <p>Unsupported item type: {courseItem.type}</p>
            </CardBody>
          </Card>
        );
    }
  };

  return <div className="max-w-4xl mx-auto">{renderItemContent()}</div>;
};
