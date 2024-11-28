import { serialize } from 'cookie';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import parse, { splitCookiesString } from 'set-cookie-parser';
import tldjs from 'tldjs';

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

function filterRequestHeaders(forwardAdditionalHeaders) {
  const filteredHeaders = new Headers();
  headers().forEach((value, key) => {
    const isValid = defaultForwardedHeaders.includes(key) || (forwardAdditionalHeaders ?? []).includes(key);
    if (isValid)
      filteredHeaders.set(key, value);
  });
  return filteredHeaders;
}
function processSetCookieHeader(protocol, fetchResponse, options) {
  const requestHeaders = headers();
  const isTls = protocol === "https:" || requestHeaders.get("x-forwarded-proto") === "https";
  const secure = options.forceCookieSecure === void 0 ? isTls : options.forceCookieSecure;
  const forwarded = requestHeaders.get("x-forwarded-host");
  const host = forwarded ? forwarded : requestHeaders.get("host");
  const domain = guessCookieDomain(host, options);
  return parse(
    splitCookiesString(fetchResponse.headers.get("set-cookie") || "")
  ).map((cookie) => ({
    ...cookie,
    domain,
    secure,
    encode: (v) => v
  })).map(
    ({ value, name, ...options2 }) => serialize(name, value, options2)
  );
}
function createApiHandler(options) {
  const baseUrl = getBaseUrl(options);
  const handler = async (request, { params }) => {
    const path = request.nextUrl.pathname.replace("/api/.ory", "");
    const url = new URL(path, baseUrl);
    url.search = request.nextUrl.search;
    if (path === "ui/welcome") {
      redirect("../../../");
    }
    const requestHeaders = filterRequestHeaders(
      options.forwardAdditionalHeaders
    );
    requestHeaders.set("X-Ory-Base-URL-Rewrite", "false");
    requestHeaders.set("Ory-Base-URL-Rewrite", "false");
    requestHeaders.set("Ory-No-Custom-Domain-Redirect", "true");
    try {
      const response = await fetch(url, {
        method: request.method,
        headers: requestHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : null,
        redirect: "manual"
      });
      const responseHeaders = new Headers();
      for (const [key, value] of response.headers) {
        responseHeaders.append(key, value);
      }
      responseHeaders.delete("location");
      responseHeaders.delete("set-cookie");
      if (response.headers.get("set-cookie")) {
        const cookies = processSetCookieHeader(
          request.nextUrl.protocol,
          response,
          options
        );
        cookies.forEach((cookie) => {
          responseHeaders.append("Set-Cookie", cookie);
        });
      }
      if (response.headers.get("location")) {
        const location = processLocationHeader(
          response.headers.get("location"),
          baseUrl
        );
        responseHeaders.set("location", location);
      }
      responseHeaders.delete("transfer-encoding");
      responseHeaders.delete("content-encoding");
      responseHeaders.delete("content-length");
      const buf = Buffer.from(await response.arrayBuffer());
      try {
        return new NextResponse(
          buf.toString("utf-8").replace(new RegExp(baseUrl, "g"), "/api/.ory"),
          {
            status: response.status,
            headers: responseHeaders
          }
        );
      } catch (err) {
        return new NextResponse(response.body, {
          status: response.status,
          headers: responseHeaders
        });
      }
    } catch (error) {
      console.error(error, {
        path,
        url,
        method: request.method,
        headers: requestHeaders
      });
      throw error;
    }
  };
  return {
    GET: handler,
    POST: handler
  };
}

export { createApiHandler, filterRequestHeaders };
//# sourceMappingURL=index.mjs.map
