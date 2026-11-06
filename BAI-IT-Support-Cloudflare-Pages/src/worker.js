const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 AS ok").first();
        if (result?.ok !== 1) {
          return json({ ok: false, worker: true, database: false, error: "D1 health query returned an unexpected result" }, 503);
        }

        return json({
          ok: true,
          service: "BAI IT Support API",
          worker: true,
          database: true,
          checked_at: new Date().toISOString()
        });
      } catch (error) {
        return json({
          ok: false,
          service: "BAI IT Support API",
          worker: true,
          database: false,
          error: error instanceof Error ? error.message : "D1 connection failed"
        }, 503);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "API route not implemented yet" }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
