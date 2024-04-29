import { PredicateType } from "https://deno.land/x/unknownutil@v3.9.0/is.ts";
import { Denops, ensure, fn, helper, is } from "./deps.ts";
import { replaceUrlWithTitledMdLink } from "./url2title.ts";

const isOptions = is.ObjectOf({
  acceptLanguage: is.OptionalOf(is.String),
});

type Options = PredicateType<typeof isOptions>;

export function main(denops: Denops) {
  let options: Options = {};
  denops.dispatcher = {
    async setGlobal(_options: unknown): Promise<void> {
      options = ensure(_options, isOptions);
      return await Promise.resolve();
    },
    async replace(_afirstline: unknown, _alastline: unknown): Promise<void> {
      const afirstline = ensure(_afirstline, is.Number);
      const alastline = ensure(_alastline, is.Number);

      const lines = await fn.getbufline(denops, "%", afirstline, alastline);
      const result = await replaceUrlWithTitledMdLink(
        lines,
        options.acceptLanguage ?? "en-US",
      );

      await fn.setbufline(denops, "%", afirstline, result.lines);
      if (result.detected > 0) {
        await helper.echo(
          denops,
          `md_link_title#replace: detected urls: ${result.detected}, success: ${result.success}`,
        );
      }

      return await Promise.resolve();
    },
  };
}
