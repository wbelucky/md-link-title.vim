import { DOMParser } from "./deps.ts";

export async function replaceUrlWithTitledMdLink(
  lines: string[],
  acceptLanguage: string,
): Promise<string[]> {
  // ref: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
  const regex =
    /[^(]*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))[^)]*/gi;

  return await Promise.all(
    lines.map(async (s) =>
      (
        await Promise.all(
          [...s.matchAll(regex)].map(async (match) => {
            const url = match[1];
            try {
              const title = await url2title(url, acceptLanguage ?? "en-US");
              return [url, title] as [url: string, title: string];
            } catch (e) {
              console.error(`url: ${url}, error: ${e}`);
              return null;
            }
          }),
        )
      ).reduce((prev: string, pair) => {
        if (!pair) return prev;
        const [url, title] = pair;
        const escapedUrl = url.replace(/[-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
        try {
          return prev.replace(
            new RegExp(`<${escapedUrl}>|([^()]|^)${escapedUrl}([^()]|$)`),
            `[${title}](${url})`,
          );
        } catch (e) {
          console.error(`url: ${url}, title: ${title}, error: ${e}`);
          return prev;
        }
      }, s)
    ),
  );
}

const url2title = async (
  url: string,
  acceptLanguage: string,
): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/html", "Accept-Language": acceptLanguage },
    });
  } catch (e) {
    throw new Error(`failed to fetch the URL: ${url}: error: ${e}`);
  }

  // Error detected while processing function denops#request[1]..denops#server#request[4]..denops#_internal#server#chan#request[4]..denops#_internal#rpc#nvim#request:

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) {
    throw new Error(`dom parse failed: url: ${url}`);
  }
  const title = doc.querySelector("title");
  if (!title) {
    throw new Error(`failed to select title by query: url: ${url}`);
  }
  return title.textContent;
};
