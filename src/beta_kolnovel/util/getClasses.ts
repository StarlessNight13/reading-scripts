const getClasses = (doc: Document): string[] => {
  const style = doc.querySelector("article > style:nth-child(2)");
  if (!style?.textContent) return [];

  const classNames = new Set<string>();
  const regex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(style.textContent)) !== null) {
    classNames.add(match[1]);
  }

  return Array.from(classNames);
};

const getAndRemoveClasses = (doc: Document): boolean => {
  const classes = getClasses(doc);
  if (!classes.length) return false;

  classes.forEach((className) => {
    doc.querySelectorAll<HTMLElement>(`.${className}`).forEach((elem) => {
      elem.classList.remove(className);
    });
  });

  return true;
};

export default getAndRemoveClasses;
