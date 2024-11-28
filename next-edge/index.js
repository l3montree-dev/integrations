'use strict';

var cookie = require('cookie');
var istextorbinary = require('istextorbinary');
var parse = require('set-cookie-parser');
var tldjs = require('tldjs');

function getBaseUrl(options) {
  let baseUrl = options.fallbackToPlayground ? "https://playground.projects.oryapis.com/" : "";
  if (process.env.ORY_SDK_URL) {
    baseUrl = process.env.ORY_SDK_URL;
  }
  if (process.env.ORY_KRATOS_URL) {
    baseUrl = process.env.ORY_KRATOS_URL;
  }
  if (process.env.ORY_SDK_URL && process.env.ORY_KRATOS_URL) {
    throw new Error("Only one of ORY_SDK_URL or ORY_KRATOS_URL can be set.");
  }
  if (options.apiBaseUrlOverride) {
    baseUrl = options.apiBaseUrlOverride;
  }
  return baseUrl.replace(/\/$/, "");
}

const defaultForwardedHeaders = [
  "accept",
  "accept-charset",
  "accept-encoding",
  "accept-language",
  "authorization",
  "cache-control",
  "content-type",
  "cookie",
  "host",
  "user-agent",
  "referer"
];

function processLocationHeader(locationHeaderValue, baseUrl) {
  if (locationHeaderValue.startsWith(baseUrl)) {
    return locationHeaderValue.replace(baseUrl, "/api/.ory");
  }
  if (locationHeaderValue.startsWith("/api/kratos/public/") || locationHeaderValue.startsWith("/self-service/") || locationHeaderValue.startsWith("/ui/")) {
    return "/api/.ory" + locationHeaderValue;
  }
  return locationHeaderValue;
}

function guessCookieDomain(url, options) {
  if (!url || options.forceCookieDomain) {
    return options.forceCookieDomain;
  }
  if (options.dontUseTldForCookieDomain) {
    return void 0;
  }
  const parsed = tldjs.parse(url || "");
  if (!parsed.isValid || parsed.isIp) {
    return void 0;
  }
  if (!parsed.domain) {
    return parsed.hostname;
  }
  return parsed.domain;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}
function filterRequestHeaders(headers, forwardAdditionalHeaders) {
  const filteredHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    const isValid = defaultForwardedHeaders.includes(key) || (forwardAdditionalHeaders ?? []).includes(key);
    if (isValid)
      filteredHeaders.set(key, Array.isArray(value) ? value.join(",") : value);
  });
  return filteredHeaders;
}
const config = {
  api: {
    bodyParser: false
  }
};
function processSetCookieHeader(protocol, originalReq, fetchResponse, options) {
  const isTls = protocol === "https:" || originalReq.headers["x-forwarded-proto"] === "https";
  const secure = options.forceCookieSecure === void 0 ? isTls : options.forceCookieSecure;
  const forwarded = originalReq.rawHeaders.findIndex(
    (h) => h.toLowerCase() === "x-forwarded-host"
  );
  const host = forwarded > -1 ? originalReq.rawHeaders[forwarded + 1] : originalReq.headers.host;
  const domain = guessCookieDomain(host, options);
  return parse(
    parse.splitCookiesString(fetchResponse.headers.get("set-cookie") || "")
  ).map((cookie) => ({
    ...cookie,
    domain,
    secure,
    encode: (v) => v
  })).map(
    ({ value, name, ...options2 }) => cookie.serialize(name, value, options2)
  );
}
function createApiHandler(options) {
  const baseUrl = getBaseUrl(options);
  return async (req, res) => {
    const { paths, ...query } = req.query;
    const searchParams = new URLSearchParams();
    Object.keys(query).forEach((key) => {
      searchParams.set(key, String(query[key]));
    });
    const path = Array.isArray(paths) ? paths.join("/") : paths;
    const url = new URL(path, baseUrl);
    url.search = searchParams.toString();
    if (path === "ui/welcome") {
      res.redirect(303, "../../../");
      return;
    }
    const headers = filterRequestHeaders(
      req.headers,
      options.forwardAdditionalHeaders
    );
    headers.set("X-Ory-Base-URL-Rewrite", "false");
    headers.set("Ory-Base-URL-Rewrite", "false");
    headers.set("Ory-No-Custom-Domain-Redirect", "true");
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await readRawBody(req) : null,
      redirect: "manual"
    });
    for (const [key, value] of response.headers) {
      res.appendHeader(key, value);
    }
    res.removeHeader("set-cookie");
    res.removeHeader("location");
    if (response.headers.get("set-cookie")) {
      const cookies = processSetCookieHeader(
        req.protocol,
        req,
        response,
        options
      );
      cookies.forEach((cookie) => {
        res.appendHeader("Set-Cookie", cookie);
      });
    }
    if (response.headers.get("location")) {
      const location = processLocationHeader(
        response.headers.get("location"),
        baseUrl
      );
      res.setHeader("Location", location);
    }
    res.removeHeader("transfer-encoding");
    res.removeHeader("content-encoding");
    res.removeHeader("content-length");
    res.status(response.status);
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength > 0) {
      if (istextorbinary.isText(null, buf)) {
        res.send(
          buf.toString("utf-8").replace(new RegExp(baseUrl, "g"), "/api/.ory")
        );
      } else {
        res.write(buf);
      }
    }
    res.end();
  };
}

exports.config = config;
exports.createApiHandler = createApiHandler;
exports.filterRequestHeaders = filterRequestHeaders;
//# sourceMappingURL=index.js.map
