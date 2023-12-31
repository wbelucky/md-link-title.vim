import { PredicateType } from "https://deno.land/x/unknownutil@v3.9.0/is.ts";
import { Denops, ensure, fn, helper, is } from "./deps.ts";
import { replaceUrlWithTitledMdLink } from "./url2title.ts";

const isOptions = is.ObjectOf({ acceptLanguage: is.OptionalOf(is.String) });

type Options = PredicateType<typeof isOptions>;

export async function main(denops: Denops): Promise<void> {
  let options: Options = {};
  denops.dispatcher = {
    async setGlobal(_options): Promise<void> {
      options = ensure(_options, isOptions);
      return await Promise.resolve();
    },
    async replace(_afirstline, _alastline): Promise<void> {
      const afirstline = ensure(_afirstline, is.Number);
      const alastline = ensure(_alastline, is.Number);

      const lines = await fn.getbufline(denops, "%", afirstline, alastline);
      const result = await replaceUrlWithTitledMdLink(
        lines,
        options.acceptLanguage ?? "en-US",
      );

      await fn.setbufline(denops, "%", afirstline, result.lines);
      await helper.echo(
        denops,
        `md_link_title#replace: detected urls: ${result.detected}, success: ${result.success}`,
      );

      return await Promise.resolve();
    },
  };
}
