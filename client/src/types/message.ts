export interface Message {
  id: string; // The identifier for the message
  object: string; // Always "thread.message"
  created_at: number; // Unix timestamp for when the message was created (in seconds)
  thread_id: string; // The ID of the thread this message belongs to
  status?: string; // The status of the message (in_progress, incomplete, or completed)
  incomplete_details?: object | null; // Details about why the message is incomplete
  completed_at?: number | null; // Unix timestamp for when the message was completed (nullable)
  incomplete_at?: number | null; // Unix timestamp for when the message was marked incomplete (nullable)
  role: "user" | "assistant"; // The entity that produced the message
  content: Array<Content>; // Array of content, including text, images, etc.
  assistant_id?: string | null; // The assistant ID that authored this message (nullable)
  run_id?: string | null; // The ID of the run associated with this message (nullable)
  attachments?: Array<Attachment> | null; // A list of files attached to the message (nullable)
  metadata?: {
    // Set of metadata key-value pairs
    [key: string]: string;
  };
}

// Content Types
type Content =
  | TextContent
  | ImageFileContent
  | ImageUrlContent
  | RefusalContent;

interface TextContent {
  type: "text";
  text: {
    value: string; // Text content of the message
    annotations: Array<object>; // Annotations, if any, else []
  };
}

interface ImageFileContent {
  type: "image_file";
  image_file: {
    file_id: string; // ID referencing an image file
    detail: string;
  };
}

interface ImageUrlContent {
  type: "image_url";
  image_url: {
    url: string; // URL to the image
    detail: string;
  };
}

interface RefusalContent {
  type: "refusal";
  refusal: string; // Refusal content generated by the assistant
}

// Attachments
interface Attachment {
  file_id: string; // The ID of the file attached to the message
  tools: Array<AttachmentTool>; // The tools that this file is associated with
}

// Tools that can be added to attachments
type AttachmentTool = CodeInterpreterTool | FileSearchTool;

interface CodeInterpreterTool {
  type: "code_interpreter";
}

interface FileSearchTool {
  type: "file_search";
}
