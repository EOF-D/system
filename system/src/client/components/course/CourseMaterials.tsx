import { isProfessor } from "@/client/services/authService";
import {
  createCourseItem,
  deleteCourseItem,
  updateCourseItem,
} from "@/client/services/courseItemService";
import { formatDueDate } from "@/client/utils/format";
import { CourseItem } from "@/shared/types/models/courseItem";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  IconBook,
  IconCertificate,
  IconDotsVertical,
  IconFileText,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * CourseMaterials props interface.
 */
interface CourseMaterialsProps {
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
   * Callback function to be called when items change.
   * @type {function}
   */
  onItemsChange: () => void;

  /**
   * Optional modal disclosure object for managing modal state.
   * @type {object}
   */
  modalDisclosure?: {
    /**
     * Function to open the modal.
     * @type {function}
     */
    isOpen: boolean;

    /**
     * Function to close the modal.
     * @type {function}
     */
    onOpen: () => void;

    /**
     * Function to close the modal.
     * @type {function}
     */
    onClose: () => void;
  };
}

/**
 * CourseMaterials component to display and manage course materials.
 * @param {CourseMaterialsProps} props - The component props.
 * @returns {JSX.Element} The CourseMaterials component.
 */
export const CourseMaterials = ({
  courseId,
  courseItems,
  isLoading,
  onItemsChange,
  modalDisclosure,
}: CourseMaterialsProps): JSX.Element => {
  const localAddDisclosure = useDisclosure();
  const addDisclosure = modalDisclosure || localAddDisclosure;
  const editDisclosure = useDisclosure();

  const [materialForm, setMaterialForm] = useState({
    id: 0,
    name: "",
    description: "",
    type: "document" as "document" | "assignment" | "quiz",
    due_date: "",
    max_points: 0,
  });

  const resetMaterialForm = () => {
    setMaterialForm({
      id: 0,
      name: "",
      description: "",
      type: "document",
      due_date: getTomorrowDate(),
      max_points: 0,
    });
  };

  // Get tomorrow's date formatted for the input.
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0] + "T23:59";
  };

  useEffect(() => {
    resetMaterialForm();
  }, []);

  const handleAddMaterial = async () => {
    try {
      const itemData = {
        course_id: courseId,
        name: materialForm.name,
        type: materialForm.type,
        max_points:
          materialForm.type === "document" ? 0 : materialForm.max_points,
        due_date: materialForm.due_date,
        description: materialForm.description,
      };

      const response = await createCourseItem(courseId, itemData);
      if (response.success) {
        onItemsChange();
        resetMaterialForm();
        addDisclosure.onClose();
      } else {
        console.error(`Error adding material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error adding material: ${error}`);
    }
  };

  const handleUpdateMaterial = async () => {
    try {
      const itemData = {
        name: materialForm.name,
        type: materialForm.type,
        max_points:
          materialForm.type === "document" ? 0 : materialForm.max_points,
        due_date: materialForm.due_date,
        description: materialForm.description,
      };

      const response = await updateCourseItem(
        courseId,
        materialForm.id,
        itemData
      );
      if (response.success) {
        onItemsChange();
        resetMaterialForm();
        editDisclosure.onClose();
      } else {
        console.error(`Error updating material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error updating material: ${error}`);
    }
  };

  const handleDeleteMaterial = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await deleteCourseItem(courseId, itemId);
      if (response.success) {
        onItemsChange();
      } else {
        console.error(`Error deleting material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error deleting material: ${error}`);
    }
  };

  const handleEditMaterial = (item: CourseItem) => {
    setMaterialForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      type: item.type,
      due_date: item.due_date.split(".")[0], // Format for input.
      max_points: item.max_points,
    });
    editDisclosure.onOpen();
  };

  const renderMaterialIcon = (type: string) => {
    switch (type) {
      case "document":
        return <IconFileText size={18} />;
      case "assignment":
        return <IconBook size={18} />;
      case "quiz":
        return <IconCertificate size={18} />;
      default:
        return <IconFileText size={18} />;
    }
  };

  const renderAddMaterialModal = () => {
    return (
      <Modal
        isOpen={addDisclosure.isOpen}
        onClose={addDisclosure.onClose}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Add course material</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Title"
                placeholder="Week 1 Lecture Notes"
                value={materialForm.name}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, name: value })
                }
                isRequired
              />
              <Textarea
                isRequired
                label="Description"
                placeholder="Brief description of the material"
                value={materialForm.description}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, description: value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded p-2"
                  value={materialForm.type}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      type: e.target.value as
                        | "document"
                        | "assignment"
                        | "quiz",
                    })
                  }
                >
                  <option value="document">Document</option>
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                </select>
                {materialForm.type !== "document" && (
                  <Input
                    type="number"
                    label="Points"
                    min={0}
                    placeholder="100"
                    value={materialForm.max_points.toString()}
                    onValueChange={(value) =>
                      setMaterialForm({
                        ...materialForm,
                        max_points: parseInt(value) || 0,
                      })
                    }
                  />
                )}
              </div>
              <Input
                type="datetime-local"
                label="Due Date"
                value={materialForm.due_date}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, due_date: value })
                }
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={addDisclosure.onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddMaterial}
              isDisabled={!materialForm.name || !materialForm.due_date}
            >
              Add Material
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderEditMaterialModal = () => {
    return (
      <Modal
        isOpen={editDisclosure.isOpen}
        onClose={editDisclosure.onClose}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>Edit course material</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Title"
                placeholder="Week 1 Lecture Notes"
                value={materialForm.name}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, name: value })
                }
                isRequired
              />
              <Textarea
                label="Description"
                placeholder="Brief description of the material"
                value={materialForm.description}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, description: value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded p-2"
                  value={materialForm.type}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      type: e.target.value as
                        | "document"
                        | "assignment"
                        | "quiz",
                    })
                  }
                >
                  <option value="document">Document</option>
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                </select>
                {materialForm.type !== "document" && (
                  <Input
                    type="number"
                    label="Points"
                    min={0}
                    placeholder="100"
                    value={materialForm.max_points.toString()}
                    onValueChange={(value) =>
                      setMaterialForm({
                        ...materialForm,
                        max_points: parseInt(value) || 0,
                      })
                    }
                  />
                )}
              </div>
              <Input
                type="datetime-local"
                label="Due Date"
                value={materialForm.due_date}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, due_date: value })
                }
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={editDisclosure.onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateMaterial}
              isDisabled={!materialForm.name || !materialForm.due_date}
            >
              Update Material
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Course Materials</h2>
        {isProfessor() && (
          <Button
            color="primary"
            variant="light"
            startContent={<IconPlus size={18} />}
            onPress={addDisclosure.onOpen}
          >
            Add Material
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="md" />
        </div>
      ) : courseItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {courseItems.map((item) => (
            <Card key={item.id} className="border border-default-200">
              <CardBody className="flex flex-row justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="bg-default-100 p-3 rounded-lg">
                    {renderMaterialIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex gap-2 items-center">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Chip size="sm" color="primary">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Chip>
                    </div>
                    {item.description && (
                      <p className="text-sm text-default-600">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-default-500">
                      Due: {formatDueDate(item.due_date)}
                      {item.type !== "document" &&
                        ` · ${item.max_points} points`}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  {isProfessor() && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light">
                          <IconDotsVertical size={18} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Material actions">
                        <DropdownItem
                          key="edit"
                          startContent={<IconPencil size={16} />}
                          onPress={() => handleEditMaterial(item)}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<IconTrash size={16} />}
                          onPress={() => handleDeleteMaterial(item.id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-default-100 rounded-lg p-6 text-center">
          <p className="text-default-600">
            No course materials have been added yet.
          </p>
        </div>
      )}

      {renderAddMaterialModal()}
      {renderEditMaterialModal()}
    </div>
  );
};
