import App from "./App";
import { createRoot } from "react-dom/client";

const newDiv = document.createElement("div");
newDiv.id = "jltwp-spotlight";

document.body.appendChild(newDiv);

// if (WPSPOTLIGHT_CORE?.is_premium) {
//   if (WPSPOTLIGHT_CORE?.is_frontend && WPSPOTLIGHT_CORE?.is_plan) {
//   } else {
const root = document.getElementById("jltwp-spotlight");
createRoot(root).render(<App />);
//   }
// }
