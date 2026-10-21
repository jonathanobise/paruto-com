// paruto.com — the Worker in front of the static files (wrangler.jsonc). Its only job: send www.* to the bare domain,
// built from the request so no domain is hard-coded. Everything else is served from the published files as-is.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
