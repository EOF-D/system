import { isProfessor } from "@/client/services/authService";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import {
  IconDownload,
  IconExternalLink,
  IconFileText,
} from "@tabler/icons-react";

/**
 * DocumentView props interface.
 */
interface DocumentViewProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * The ID of the document item.
   * @type {number}
   */
  itemId: number;

  /**
   * The name of the document item.
   * @type {string}
   */
  itemName: string;

  /**
   * The description of the document item.
   * @type {string}
   */
  description: string;
}

/**
 * DocumentView component to display a document item in a course.
 * @param {DocumentViewProps} props - The props for the DocumentView component.
 * @return {JSX.Element} The rendered DocumentView component.
 */
export const DocumentView = ({
  courseId,
  itemId,
  itemName,
  description,
}: DocumentViewProps): JSX.Element => {
  const isProfessorView = isProfessor();

  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <IconFileText size={24} className="text-primary" />
          <div>
            <h2 className="text-xl font-semibold">{itemName}</h2>
            <p className="text-sm text-default-600">Document</p>
          </div>
        </div>
        {isProfessorView && (
          <Badge
            content="Uploaded by you"
            color="primary"
            placement="top-right"
          >
            <Chip color="primary" variant="flat">
              Instructor Document
            </Chip>
          </Badge>
        )}
      </CardHeader>

      <Divider />

      <CardBody>
        <div className="mb-6">
          <h3 className="font-medium mb-2">Description</h3>
          <p className="whitespace-pre-wrap">{description}</p>
        </div>

        <div className="p-6 border border-default-200 rounded-lg bg-default-50">
          <div className="flex flex-col items-center justify-center text-center">
            <IconFileText size={48} className="text-default-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">{itemName}</h3>
            <p className="text-sm text-default-600 mb-4">
              PDF Document - Uploaded by instructor [PLACEHOLDER]
            </p>

            <div className="flex gap-2">
              <a
                href="#"
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("TODO: Implement download");
                }}
              >
                <IconDownload size={16} />
                Download
              </a>

              <a
                href="#"
                className="inline-flex items-center gap-1 px-4 py-2 bg-default-100 text-default-700 rounded-lg hover:bg-default-200 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("TODO: Implement open in new tab");
                  window.open("#", "_blank");
                }}
              >
                <IconExternalLink size={16} />
                Open
              </a>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
