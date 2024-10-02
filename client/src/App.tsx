import React, { useState } from "react";
import axios from "axios";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [catImages, setCatImages] = useState<string[]>([]);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    // Add user message to chat
    setMessages([...messages, { sender: "user", text: input }]);

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        message: input,
      });
      const botMessage = response.data.response;

      // Add bot message to chat
      setMessages((prev) => [...prev, { sender: "bot", text: botMessage }]);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
  };

  const requestCat = async () => {
    try {
      const response = await axios.post("http://localhost:8000/get_cats", {
        count: 3,
      });
      const images = response.data.map((cat: any) => cat.url);
      setCatImages(images);
    } catch (error) {
      console.error("Error fetching cats:", error);
    }
  };

  return (
    <div>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={requestCat}>Show Cats</button>
      </div>

      <div className="cat-images">
        {catImages.map((url, index) => (
          <img key={index} src={url} alt="A cute cat" />
        ))}
      </div>
    </div>
  );
};

export default App;
