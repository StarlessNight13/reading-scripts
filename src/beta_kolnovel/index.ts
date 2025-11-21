import van from "vanjs-core";
import chapterPage from "./routes/chapterPage";
import novelPage from "./routes/novelPage";
// import "./style.css";
type PageType = "user-library" | "reader" | "page" | "chapter" | "home";

export default function main() {
  console.clear();
  console.log("kolnovel Initial");
  document.body.setAttribute("host", "kolnovel");

  addLibraryNavLink();
  const currentPage = findCurrentPage();
  document.body.setAttribute("page", currentPage);

  if (currentPage === "chapter") {
    chapterPage(removeBaseStyles);
  } else if (currentPage === "page") {
    const sertoinfo = document.querySelector<HTMLDivElement>(".sertoinfo");
    if (!sertoinfo) return;
    van.add(sertoinfo, novelPage());
  } else if (currentPage === "reader") {
  } else {
    console.log("🚀 ~ currentPage:", currentPage);
  }
}

function addLibraryNavLink() {
  const nav = document.querySelector('[role="navigation"] ul');
  const libraryLink = document.createElement("li");
  libraryLink.innerHTML = `<a href="/user-library">مكتبة شخصية</a>`;
  libraryLink.classList.add(
    "menu-item",
    "menu-item-type-custom",
    "menu-item-object-custom"
  );
  nav?.appendChild(libraryLink);
  document.querySelector("#menu-item-185962")?.remove();
  document.querySelector("#menu-item-185963")?.remove();
}

function findCurrentPage(): PageType {
  if (document.querySelector("#Top_Up")) return "chapter";
  if (location.pathname.includes("/series")) return "page";
  if (location.pathname === "/user-library") return "user-library";
  if (location.pathname === "/reader") return "reader";
  return "home";
}

function removeBaseStyles() {
  const selectors = [
    "#style-css",
    "#wp-custom-css",
    "head > style:not([type='text/css'])",
  ];

  let stylesCount = 0;
  selectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((e) => {
      e.remove();
      stylesCount++;
    });
  });

  document.head.querySelectorAll("head > style").forEach((e) => {
    const content = e.textContent;
    if (content && !content.includes("KEEP_STYLE")) {
      e.remove();
      stylesCount++;
    }
  });

  cleanupHeadScriptsAndStyles();
  console.log("Removed", stylesCount, "styles");
  // van.add(document.head, van.tags.style({ innerHTML: css }));
}

function cleanupHeadScriptsAndStyles(): void {
  const selectorsToRemove = [
    "#bootstrap-css",
    "#bootstrap-js",
    "#jquery-js",
    "#jquery-css",
    "#fontawesome-css",
    "#fontawesome-js",
    "#toastr-js",
    "#toastr-css",
    "#madara-css-css",
    "#child-style-css",
    "#slick-theme-css",
    "#slick-css",
    "#ionicons-css",
    "#madara-icons-css",
    "#loaders-css",
    "#wp-pagenavi-css",
    "#jquery-core-js",
    "#jquery-migrate-js",
    "#wp-custom-css",
  ];

  selectorsToRemove.forEach((selector) => {
    document.head.querySelector(selector)?.remove();
  });
  console.log("Removed legacy scripts and styles.");
}
