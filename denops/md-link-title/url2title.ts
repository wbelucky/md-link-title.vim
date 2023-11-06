import { DOMParser } from "./deps.ts";

export async function replaceUrlWithTitledMdLink(
  input: string[],
  acceptLanguage: string,
): Promise<{ lines: string[]; detected: number; success: number }> {
  // ref: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
  const regex =
    /[^(]*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))[^)]*/gi;

  let detected = 0;
  let success = 0;
  const lines = await Promise.all(
    input.map(async (s) =>
      (
        await Promise.all(
          [...s.matchAll(regex)].map(async (match) => {
            const url = match[1];
            detected += 1;
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
          const newLine = prev
            .replace(new RegExp(`<${escapedUrl}>`), `[${title}](${url})`)
            .replace(
              new RegExp(`([^()]|^)${escapedUrl}([^()]|$)`),
              `$1[${title}](${url})$2`,
            );
          success += 1;
          return newLine;
        } catch (e) {
          console.error(`url: ${url}, title: ${title}, error: ${e}`);
          return prev;
        }
      }, s)
    ),
  );
  return {
    lines,
    success,
    detected,
  };
}

async function url2title(url: string, acceptLanguage: string): Promise<string> {
  const regex = /^https\:\/\/www\.reddit.com/;
  if (regex.test(url)) {
    return await fetchTitleReddit(url, acceptLanguage);
  }
  return await fetchTitleDefault(url, acceptLanguage);
}

async function fetchTitleDefault(
  url: string,
  acceptLanguage: string,
): Promise<string> {
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
}

async function fetchTitleReddit(url: string, acceptLanguage: string) {
  let response: Response;
  try {
    response = await fetch(url + ".json", {
      headers: {
        Accept: "application/json",
        "Accept-Language": acceptLanguage,
      },
    });
  } catch (e) {
    throw new Error(`failed to fetch the URL: ${url}: error: ${e}`);
  }
  const json = (await response.json()) as any;
  return json[0].data.children[0].data.title;
}
