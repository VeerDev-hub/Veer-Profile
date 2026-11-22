// Any component can open the resume viewer, the same way open-chat works for the chat widget.
export const openResume = () => window.dispatchEvent(new Event("open-resume"));
