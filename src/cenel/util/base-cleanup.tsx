export default function cleanupHeadScriptsAndStyles(): void {
  const selectorsToRemove: string[] = [
    "#bootstrap-css",
    "#bootstrap-js",
    "#jquery-js",
    "#jquery-css", // Note: original code had #jquery-css twice, removed duplicate selector
    "#fontawesome-css",
    "#fontawesome-js",
    "#toastr-js",
    "#toastr-css", // Note: original code had #toastr-css twice
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
    // Add any other specific selectors if needed
  ];

  selectorsToRemove.forEach((selector) => {
    document.head.querySelector(selector)?.remove();
  });
  console.log("Removed legacy scripts and styles.");
}
