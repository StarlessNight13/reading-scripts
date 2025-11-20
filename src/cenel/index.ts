import App from "./app";
import "./style.css";

export default function () {
  document.body.setAttribute("host", "cenel");
  console.clear();
  const readerEnabled = localStorage.getItem("readerEnabled") === "true";
  App(readerEnabled);
}
