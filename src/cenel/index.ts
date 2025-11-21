import App from "./app";

export default function () {
  document.body.setAttribute("host", "cenel");
  console.clear();
  const readerEnabled = localStorage.getItem("readerEnabled") === "true";
  App(readerEnabled);
}
