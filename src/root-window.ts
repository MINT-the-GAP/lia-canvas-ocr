/**
 * Return the highest readable same-origin window.
 *
 * Reading a cross-origin parent returns a WindowProxy; only later property
 * access throws. Probe the document before adopting that parent so registries
 * always remain on an accessible window.
 */
export function getRootWindow(start: Window = window): Window {
  let current = start;

  for (;;) {
    let parent: Window;
    try {
      parent = current.parent;
      if (!parent || parent === current) return current;
      void parent.document;
    } catch (_) {
      return current;
    }
    current = parent;
  }
}
