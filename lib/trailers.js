// Web-sized copies of the trailers, keyed by the Google Drive file they were made from.
// Drive's embedded player barely works on phones, so these play in the native player instead.
// A Drive link that isn't listed here (say, a new one added in admin) still uses Drive's player.
const LOCAL_TRAILERS = {
  "1lzRme0K3fQE13f9DlGwOXPirDXDMS7KW": "/trailers/klaro.mp4",
  "1gyxyb94bWnDJ-mHxkOTSbUlS3zghdysp": "/trailers/overlap.mp4",
  "1eHB31ImfaD-AiK3J8OYQNy6uKxMVVlIF": "/trailers/nexus-soc.mp4",
  "1Ec0Ae3H4tx41RbR-cvTUCEbM9zff81sQ": "/trailers/pulmosight.mp4",
  "1lT51_tOKAzbqspwuunJ5A6szgqC-K_tq": "/trailers/analytica-studio.mp4",
  "1r1VxMLCvk6nI3dcFWn3GEUNNE8Azd3EL": "/trailers/recon-console.mp4",
};

// Accepts a Google Drive share link (…/file/d/<id>/view, …?id=<id>) or a bare file id.
function driveId(link) {
  const match = /\/d\/([\w-]{20,})/.exec(link) || /[?&]id=([\w-]{20,})/.exec(link) || /^([\w-]{20,})$/.exec(link.trim());
  return match?.[1];
}

export function trailerSources(link) {
  const id = link ? driveId(link) : null;
  if (!id) return null;
  return { file: LOCAL_TRAILERS[id] ?? null, embed: `https://drive.google.com/file/d/${id}/preview` };
}
