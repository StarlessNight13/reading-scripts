import cenel from "./cenel";
import konovel from "./konovel";
import "./index.css";
import tailwindcss from "./tailwind.css?inline";

(async () => {
  const website = location.hostname;
  if (website === "kolnovel.com") {
    konovel(tailwindcss);
  } else if (website === "cenele.com") {
    cenel(tailwindcss);
  } else {
    console.log("website not found");
  }
})();
