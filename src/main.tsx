import cenel from "./cenel";
import kolnovel from "./kolnovel";
import "./index.css";
import tailwindcss from "./tailwind.css?inline";

(async () => {
  const website = location.hostname;
  if (website === "kolnovel.com") {
    kolnovel(tailwindcss);
  } else if (website === "cenele.com") {
    cenel(tailwindcss);
  } else {
    console.log("website not found");
  }
})();
