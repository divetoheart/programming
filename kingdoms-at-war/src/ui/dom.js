export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
export const html = (element, content) => { element.innerHTML = content; return element; };
export const listen = (root, eventName, selector, handler) => root.addEventListener(eventName, (event) => {
  const target = event.target.closest(selector);
  if (target && root.contains(target)) handler(event, target);
});
export const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
