import kolnovel from "./beta_kolnovel";
import cenel from "./cenel";
import "./index.css";

(async () => {
  const website = location.hostname;
  if (website === "kolnovel.com") {
    kolnovel();
  } else if (website === "cenele.com") {
    cenel();
  } else {
    console.log("website not found");
  }
})();
