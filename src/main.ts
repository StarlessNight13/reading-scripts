import "./style.css";
import kolnovel from "./routes/kolnovel";
import cenel from "./routes/cenele";

(async () => {
  const website = location.hostname;
  const urlParams = new URLSearchParams(window.location.search);
  const disabled = urlParams.get("disabled");

  if (website === "kolnovel.com") {
    kolnovel(disabled === "true");
  } else if (website === "cenele.com") {
    cenel(disabled === "true");
  } else {
    console.log("website not found");
  }
})();
