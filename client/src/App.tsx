import {
  Run,
  RunSubmitToolOutputsParams,
} from "openai/resources/beta/threads/runs/runs.mjs";
import React, { useState, useEffect, useRef } from "react";

const API_URL = "http://localhost:8000";

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [catImageUrl, setCatImageUrl] = useState<string>("");

  // Append a message to the chat history
  const appendMessage = (message: any) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  // Update the latest message with the actual response from the backend
  const updateLastMessage = (updatedMessage: any) => {
    setMessages((prevMessages) => [
      ...prevMessages.slice(0, -1),
      updatedMessage,
    ]);
  };

  // Automatically scroll to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFunctionCall = async (run: Run) => {
    const toolOutputs: RunSubmitToolOutputsParams.ToolOutput[] = [];
    const toolCalls = run.required_action?.submit_tool_outputs.tool_calls ?? [];
    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "getCatImage") {
        const catImage = await fetch(
          "https://api.thecatapi.com/v1/images/search"
        );
        const catImageData = await catImage.json();
        const imageUrl = catImageData[0].url;
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: imageUrl,
        });
        setCatImageUrl(imageUrl);
      }
    }

    if (toolOutputs.length > 0) {
      const response = await fetch(
        `${API_URL}/submit_tool_outputs?thread_id=${threadId}&run_id=${run.id}`,
        {
          method: "POST",
          body: JSON.stringify({ toolOutputs }),
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        pollRunStatus(threadId, run.id);
      } else {
        setIsLoading(false);
        alert("Function call failed");
      }
    }
  };

  // Polling function to check the run status
  const pollRunStatus = async (threadId: string, runId: string) => {
    try {
      const pollInterval = setInterval(async () => {
        const response = await fetch(
          `${API_URL}/retrieve_status?thread_id=${threadId}&run_id=${runId}`
        );
        const result = await response.json();

        if (result.run.status === "completed") {
          clearInterval(pollInterval);
          const response = await fetch(`${API_URL}/list_messages/${threadId}`);
          const result = await response.json();
          console.log(result.messages);
          setMessages(result.messages.data);
          setIsLoading(false);
        } else if (result.run.status === "failed") {
          clearInterval(pollInterval);
          setIsLoading(false);
          alert("Failed to get response from the assistant");
        } else if (
          result.run.status === "requires_action" &&
          result.run.required_action.type === "submit_tool_outputs"
        ) {
          // Function calling to handle the action
          clearInterval(pollInterval);
          handleFunctionCall(result.run);
        }
      }, 500);
    } catch (error) {
      console.error("Error while polling:", error);
      alert("Unknown error occurred");
    }
  };

  // Sending the message and starting polling for the assistant's response
  const sendMessage = async (text: string) => {
    // Add the user message immediately to the chat UI
    const tempMessage = {
      id: new Date().toISOString(),
      role: "user",
      content: [{ text: { value: text } }],
      created_at: new Date().toISOString(),
    };
    appendMessage(tempMessage);

    try {
      const response = await fetch(`${API_URL}/add_message/${threadId}`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
        headers: { "Content-Type": "application/json" },
      });

      const { runId, message } = await response.json();
      updateLastMessage(message); // Update the temporary message with the real message object
      pollRunStatus(threadId, runId);
    } catch (error) {
      console.error("Error while sending the message:", error);
      alert("Unknown error occurred");
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    if (!input.trim()) return;
    setIsLoading(true);
    const userMessage = input;
    setInput(""); // Clear the input field
    sendMessage(userMessage);
    scrollToBottom();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a new thread when the chat component is mounted
  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`${API_URL}/create_thread`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  return (
    <div className="flex flex-row justify-center items-center h-screen w-screen bg-gray-100">
      {catImageUrl && (
        <img
          src={catImageUrl}
          className="flex object-cover w-80 h-auto rounded-lg mx-4"
        ></img>
      )}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col space-y-3 max-h-96 overflow-y-auto mb-4">
          {messages.length > 0 &&
            messages
              .sort((a, b) => {
                return (
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime()
                );
              })
              .map((message) => (
                <div
                  key={message.id}
                  className={`mx-1 p-2 rounded-lg max-w-xs ${
                    message.role === "user"
                      ? "bg-blue-500 text-white self-end"
                      : "bg-gray-300 text-black self-start"
                  }`}
                >
                  {message.content[0].text.value}
                </div>
              ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            className="flex-grow p-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "" : "Type your message..."}
            disabled={isLoading}
          />
          <button
            className="p-3 bg-blue-500 text-white rounded-lg"
            type="submit"
            disabled={isLoading}
          >
            {isLoading || !threadId ? (
              <div className="w-5 h-5 border-2 border-t-transparent border-white-400 rounded-full animate-spin"></div>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
