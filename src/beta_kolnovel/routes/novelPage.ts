import van from "vanjs-core";

const { div, button, span } = van.tags;

const main = () => {
  const isSaved = van.state(false);
  const novelData = getNovelData();

  return div(
    {
      className: "library-manager",
    },
    button(
      {
        className: () => `${isSaved.val ? "primaryButton" : "secondaryButton"}`,
        onclick: () => (isSaved.val = !isSaved.val),
      },
      () => (isSaved.val ? "Saved!" : "Save")
    )
  );
};

function getNovelData() {
  const novelUrl = location.pathname;
  const novelIdElement = document.querySelector<HTMLDivElement>(
    "#post-205938 > div.sertobig > div > div.sertoinfo > div:nth-child(8) > div:nth-child(1) > div.bookmark"
  );
  const novelId = novelIdElement?.getAttribute("data-id");
  if (!novelId || isNaN(Number(novelId))) {
    console.error("Invalid novel ID");
    return null;
  }
  const imgElement = document.querySelector<HTMLImageElement>(
    "#post-205938 > div.sertobig > div > div.sertothumb > img"
  );
  if (!imgElement) {
    console.error("Invalid novel image");
    return null;
  }
  const coverSrc = imgElement.src;

  const novelTitle =
    document.querySelector(
      "#post-205938 > div.sertobig > div > div.sertoinfo > h1"
    )?.textContent ?? "NovelName";
  const AltNovelTitle =
    document.querySelector(
      "#post-205938 > div.sertobig > div > div.sertoinfo > span"
    )?.textContent ?? "Another Novel Name";

  return {
    id: Number(novelId),
    cover: coverSrc,
    title: novelTitle,
    altTitle: AltNovelTitle,
    novelUrl,
  };
}

export default main;
