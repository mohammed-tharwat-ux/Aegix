import type { PageMeta } from "./types";

type PageMetaMessage =
  | { type: "aegix-page-meta"; payload: PageMeta }
  | { type: "aegix-page-threats"; payload: string[] };

function getPageMeta() {
  const url = location.href;
  const title = document.title;
  const forms = Array.from(document.querySelectorAll("input, form, button")).length;
  const loginHints = document.body.innerText.toLowerCase().includes("sign in") || document.body.innerText.toLowerCase().includes("login");
  return {
    url,
    title,
    forms,
    loginHints,
  };
}

chrome.runtime.onMessage.addListener((message: PageMetaMessage, _sender: any, sendResponse: any) => {
  if (message?.type === "aegix-page-meta") {
    sendResponse(getPageMeta());
  }
  return false;
});

const observer = new MutationObserver(() => {
  if (document.visibilityState !== "visible") return;
  chrome.runtime.sendMessage({ type: "page-meta-update", payload: getPageMeta() }).catch(() => {});
});

observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
