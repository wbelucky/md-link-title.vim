import { Denops, DOMParser, ensure, fn, is } from "./deps.ts";

export async function main(denops: Denops): Promise<void> {
  // Plugin program starts from here
  denops.dispatcher = {
    async url2title(input: unknown): Promise<unknown> {
      const [mode, start, end] = await Promise.all([
        fn.mode(denops),
        fn.getpos(denops, "'<"),
        fn.getpos(denops, "'>"),
      ]);

      const acceptableModes = ["v", "V"];
      // if (!acceptableModes.includes(mode)) {
      //   return new Error(`${mode} must be ${acceptableModes.join(" or ")}`);
      // }

      const lines = await fn.getbufline(
        denops,
        // await fn.bufname(denops, start[0]),
        "%",
        start[1],
        end[1]
      );

      // ref: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
      const regex =
        /[^(]*(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))[^)]*/gi;

      const newLines = await Promise.all(
        lines.map(async (s) =>
          (
            await Promise.all(
              [...s.matchAll(regex)].map(async (match) => {
                const url = match[1];
                console.log(url);
                try {
                  const title = await url2title(url);
                  return [url, title] as [url: string, title: string];
                } catch (e) {
                  console.error(e);
                  return null;
                }
              })
            )
          ).reduce((prev: string, pair) => {
            if (!pair) return prev;
            const [url, title] = pair;
            const escapedUrl = url.replace(/[-\/\\^$*+?.()|\[\]{}]/g, "\\$&");
            try {
              return prev.replace(
                new RegExp(`${escapedUrl}|<${escapedUrl}>`),
                `[${title}](${url})`
              );
            } catch (e) {
              console.log(`url: ${url}, title: ${title}, error: ${e}`);
              return prev;
            }
          }, s)
        )
      );
      console.log(newLines);

      await fn.setbufline(denops, "%", start[1], newLines);

      return await Promise.resolve();
    },
  };
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
