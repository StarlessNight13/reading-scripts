import * as React from "react";
import { useEffect } from "react";

const DISQUS_INSTANCE = "DISQUS";
const DISQUS_CONFIG = "disqus_config";
const DISQUS_SHORTNAME = "disqus_shortname";
const DISQUS_THREAD = "disqus_thread";
const DISQUS_COMMENT_ELEMENT_ID = "dsq-embed-scr";
const DISQUS_PRELOAD_IFRAME_SELECTOR = "iframe[id^=dsq-app]";

const DEFER_LOADING_MS = 4000;

export interface DisqusCommentProps {
  title: string;
  identifier: string;
  url: string;
  shortname: string;
  defer?: number; // defer loading (ms)
}

interface DisqusWindow extends Window {
  [DISQUS_INSTANCE]?: {
    reset: (config: { reload: boolean; config: () => void }) => void;
  };
  [DISQUS_CONFIG]?: {
    identifier: string;
    url: string;
    title: string;
  };
  [DISQUS_SHORTNAME]?: string;
}

const EMPTY_DISQUS_CONFIG: Pick<
  DisqusCommentProps,
  "identifier" | "url" | "shortname" | "defer"
> = {
  identifier: "",
  url: "",
  shortname: "",
  defer: DEFER_LOADING_MS,
};

export const Comment: React.FC<DisqusCommentProps> = (props) => {
  const disqusConfig = { ...EMPTY_DISQUS_CONFIG, ...props };
  const disqusWindow = window as unknown as DisqusWindow;

  const insertScript = (
    src: string,
    id: string,
    parentElement: HTMLElement
  ): HTMLScriptElement => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.id = id;
    parentElement.appendChild(script);
    return script;
  };

  const removeScript = (id: string, parentElement: HTMLElement): void => {
    const script = document.getElementById(id);
    if (script) {
      parentElement.removeChild(script);
    }
  };

  const removeDisqusThreadElement = (): void => {
    const disqusThread = document.getElementById(DISQUS_THREAD);
    if (disqusThread) {
      while (disqusThread.hasChildNodes() && disqusThread.firstChild) {
        disqusThread.removeChild(disqusThread.firstChild);
      }
    }
  };

  const removeDisqusPreloadFrameElement = (): void => {
    const disqusPreloadFrame = document.querySelectorAll<HTMLIFrameElement>(
      DISQUS_PRELOAD_IFRAME_SELECTOR
    );

    disqusPreloadFrame.forEach((value) => {
      value.parentElement?.removeChild(value);
    });
  };

  const getDisqusConfig = (): (() => void) => {
    return function (this: {
      page: { identifier?: string; url?: string; title?: string };
    }) {
      this.page = {
        identifier: disqusConfig.identifier,
        url: disqusConfig.url,
        title: props.title,
      };
    };
  };

  const loadInstance = (): void => {
    setTimeout(() => {
      if (
        disqusWindow[DISQUS_INSTANCE] &&
        document.getElementById(DISQUS_COMMENT_ELEMENT_ID)
      ) {
        disqusWindow[DISQUS_INSTANCE].reset({
          reload: true,
          config: getDisqusConfig(),
        });
      } else {
        removeDisqusThreadElement();
        const existingDisqusConfig = disqusWindow[DISQUS_CONFIG];
        const existingDisqusShortname = disqusWindow[DISQUS_SHORTNAME];
        if (
          props.shortname &&
          existingDisqusShortname !== props.shortname &&
          !existingDisqusConfig
        ) {
          disqusWindow[DISQUS_CONFIG] = {
            identifier: disqusConfig.identifier,
            url: disqusConfig.url,
            title: props.title,
          };
          disqusWindow[DISQUS_SHORTNAME] = props.shortname;
          insertScript(
            `https://${props.shortname}.disqus.com/embed.js`,
            DISQUS_COMMENT_ELEMENT_ID,
            document.body
          );
        }
      }
    }, disqusConfig.defer);
  };

  const cleanInstance = (): void => {
    removeScript(DISQUS_COMMENT_ELEMENT_ID, document.body);
    if (disqusWindow[DISQUS_INSTANCE]) {
      disqusWindow[DISQUS_INSTANCE].reset({ reload: false, config: () => {} });
      removeDisqusThreadElement();
      removeDisqusPreloadFrameElement();
    }
  };

  useEffect(() => {
    loadInstance();
    return cleanInstance;
  }, [
    props.identifier,
    props.shortname,
    props.url,
    props.title,
    disqusConfig.defer,
  ]);

  return <div id={DISQUS_THREAD} />;
};
