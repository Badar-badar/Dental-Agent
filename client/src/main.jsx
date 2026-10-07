import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/base.css";
import "./styles/chat.css";

createRoot(document.getElementById("root")).render(<App />);
