import React from "react"
import ReactDOM from "react-dom/client"
import Home from "./pages/Home"
import { Toaster } from "sonner"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
    <Toaster richColors position="top-right" />
  </React.StrictMode>,
)
