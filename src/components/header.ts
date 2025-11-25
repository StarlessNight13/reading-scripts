import { ChapterData } from "@/types";
import van from "vanjs-core";

const { header, div, a } = van.tags;

const createScrollHeader = ({
  initialData,
}: {
  initialData: ChapterData;
}) => {
  const isHeaderVisible = van.state(true);
  let lastScrollY = 0;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      isHeaderVisible.val = false;
    } else if (currentScrollY < lastScrollY) {
      isHeaderVisible.val = true;
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", handleScroll);

  return header(
    {
      style: () =>
        `position: fixed; top: 0; width: 100%; transition: transform 0.3s ease-in-out; transform: translateY(${
          isHeaderVisible.val ? "0" : "-100%"
        });`,
    },
    div(
      {
        class: "chpater-header",
      },
      div(
        { id: "current-chapter-title" },
        a(
          {
            id: "chapter-link",
            href: initialData.url + "?reader-disabled=true",
          },
          initialData.title
        )
      )
    )
  );
};

export default createScrollHeader;
