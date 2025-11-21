import kolnovel from "./kolnovel";
import cenel from "./cenel";
import "./index.css";
import tailwindcss from "./tailwind.css?raw";

(async () => {
  const website = location.hostname;
  if (website === "kolnovel.com") {
    kolnovel(tailwindcss);
  } else if (website === "cenele.com") {
    cenel();
  } else {
    console.log("website not found");
  }
})();
