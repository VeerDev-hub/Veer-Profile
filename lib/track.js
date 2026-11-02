// A beacon still delivers when the click navigates away from the page.
export function sendEvent(event) {
  const body = new Blob([JSON.stringify(event)], { type: "application/json" });
  navigator.sendBeacon?.("/api/track", body);
}

export function track(name) {
  sendEvent({ type: "click", name, page: location.pathname });
}
