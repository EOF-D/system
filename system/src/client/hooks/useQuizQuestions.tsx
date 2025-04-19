import { getQuizQuestions } from "@/client/services/quizService";
import { QuizQuestionWithOptions } from "@/shared/types/models/quiz";
import { useEffect, useState } from "react";

/**
 * Custom hook to manage quiz questions.
 * @param {number} itemId - The ID of the course item (quiz).
 */
export const useQuizQuestions = (itemId: number) => {
  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches quiz questions from the server.
   */
  const fetchQuizQuestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getQuizQuestions(itemId);

      if (response.success && response.data) {
        setQuestions(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      } else {
        setError(response.message || "Failed to load quiz questions");
      }
    } catch (error) {
      console.error(`Error fetching quiz questions: ${error}`);
      setError("Failed to load quiz questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions on mount.
  useEffect(() => {
    fetchQuizQuestions();
  }, [itemId]);

  return {
    questions,
    setQuestions,
    isLoading,
    error,
    setError,
    fetchQuizQuestions,
  };
};
