import { Denops, DOMParser, ensure, fn, helper, is, outdent } from "./deps.ts";

export async function main(denops: Denops): Promise<void> {
  // Plugin program starts from here
  denops.dispatcher = {
    async url2title(...args): Promise<unknown> {
      const afirstline = args[0] as number;
      const alastline = args[1] as number;

      const lines = await fn.getbufline(denops, "%", afirstline, alastline);

      // ref: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
      const regex =
        /[^(]*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))[^)]*/gi;

      const newLines = await Promise.all(
        lines.map(async (s) =>
          (
            await Promise.all(
              [...s.matchAll(regex)].map(async (match) => {
                const url = match[1];
                try {
                  const title = await url2title(url);
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

      await fn.setbufline(denops, "%", afirstline, newLines);

      return await Promise.resolve();
    },
  };
  await helper.execute(
    denops,
    outdent`
    function! MdLinkTitle() range abort
      call denops#notify("${denops.name}", "url2title", [a:firstline, a:lastline])
    endfunction
    command! -nargs=0 -range MdLinkTitle <line1>,<line2>call MdLinkTitle()
    `,
  );
}

const url2title = async (url: string): Promise<string> => {
  // const url = ensure(input, is.String);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/html" },
    });
  } catch (e) {
    throw new Error(`failed to fetch the URL: ${url}: error: ${e}`);
  }

  // Error detected while processing function denops#request[1]..denops#server#request[4]..denops#_internal#server#chan#request[4]..denops#_internal#rpc#nvim#request:

  const html = await response.text();
  // HTMLを解析してタイトルを抽出
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
