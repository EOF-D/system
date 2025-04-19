import { Card } from "@heroui/react";
import RichTextEditor from "reactjs-tiptap-editor";
import {
  BaseKit,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Color,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  Italic,
} from "reactjs-tiptap-editor/extension-bundle";
import "reactjs-tiptap-editor/style.css";

const extensions = [
  BaseKit.configure({
    characterCount: {
      limit: 9_000,
    },
  }),
  Bold,
  Italic,
  Color,
  Highlight,
  FontFamily,
  FontSize,
  Heading,
  BulletList,
  Code,
  CodeBlock,
];

/**
 * TextEditor props interface.
 */
export interface TextEditorProps {
  /**
   * Indicates if the editor is in read-only mode.
   * @type {boolean}
   */
  isReadOnly?: boolean;

  /**
   * The content of the editor.
   * @type {string}
   */
  content: string;

  /**
   * Additional props for the editor.
   * @type {object}
   */
  [key: string]: any;
}

/**
 * TextEditor component to render a rich text editor. Utility for shared extensions.
 * @param {object} props - The props for the TextEditor component.
 * @returns {JSX.Element} The TextEditor component.
 */
export function TextEditor(props: TextEditorProps): JSX.Element {
  const { isReadOnly, content, ...restProps } = props;

  // Use a key to force re-render when content changes in read-only mode.
  const contentKey = isReadOnly ? content : "editor";

  // Editor props with read-only behavior.
  const editorProps = isReadOnly
    ? {
        handleClick: () => true,
        handleKeyDown: () => true,
        handleKeyPress: () => true,
        handlePaste: () => true,
        handleDrop: () => true,
        handleDOMEvents: {
          mousedown: () => isReadOnly,
          focus: () => isReadOnly,
          blur: () => isReadOnly,
          input: () => isReadOnly,
        },
      }
    : {};

  const useEditorOptions = {
    editable: !isReadOnly,
    editorProps: editorProps,
  };

  const readOnlyProps = isReadOnly
    ? {
        hideToolbar: true,
        disableBubble: true,
        hideBubble: true,
      }
    : {};

  return (
    <div>
      {isReadOnly ? (
        <Card className="border-2 border-default-20 shadow-md">
          <RichTextEditor
            key={contentKey}
            output="html"
            extensions={extensions}
            content={content}
            useEditorOptions={useEditorOptions}
            {...readOnlyProps}
            {...restProps}
          />
        </Card>
      ) : (
        <RichTextEditor
          output="html"
          extensions={extensions}
          content={content}
          useEditorOptions={useEditorOptions}
          {...readOnlyProps}
          {...restProps}
        />
      )}
    </div>
  );
}
