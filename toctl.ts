import { docopt, fs, httpServer as http, safety } from "./deps.ts";
import * as gt from "./governed-template.ts";

const docoptSpec = `
Template Orchestration Controller ${
  determineVersion(import.meta.url, import.meta.main)
}.

Usage:
  toctl server [--port=<port>] [--baseURL=<url>] [--verbose]
  toctl -h | --help
  toctl --version

Options:
  -h --help         Show this screen
  --version         Show version
  --verbose         Be explicit about what's going on
`;

export async function httpServiceHandler(
  ctx: CommandHandlerContext,
): Promise<true | void> {
  const {
    "server": server,
    "--port": portSpec,
    "--baseURL": baseUrlSpec,
  } = ctx.cliOptions;
  if (server) {
    const port = typeof portSpec === "number" ? portSpec : 8163;
    const baseURL = typeof baseUrlSpec === "string"
      ? baseUrlSpec
      : `http://localhost:${port}`;
    const verbose = ctx.isVerbose;
    const s = http.serve({ port: port });
    if (verbose) {
      console.log(`Template Orchestration service running at ${baseURL}`);
    }
    for await (const req of s) {
      const url = new URL(req.url, baseURL);
      if (verbose) console.log(req.method, url.pathname);
      // try with curl -H "Content-Type: application/json" --data @mod_test-00.in.json http://localhost:8163/transform | jq
      if (url.pathname.startsWith("/transform")) {
        req.respond(
          { body: await gt.transformJsonInput(await Deno.readAll(req.body)) },
        );
      }
    }
    return true;
  }
}

export interface CommandHandlerContext {
  readonly calledFromMetaURL: string;
  readonly calledFromMain: boolean;
  readonly cliOptions: docopt.DocOptions;
  readonly isVerbose: boolean;
}

export interface CommandHandler<T extends CommandHandlerContext> {
  (ctx: T): Promise<true | void>;
}

export class TypicalCommandHandlerContext implements CommandHandlerContext {
  constructor(
    readonly calledFromMetaURL: string,
    readonly calledFromMain: boolean,
    readonly cliOptions: docopt.DocOptions,
  ) {
  }

  get isVerbose(): boolean {
    const { "--verbose": verbose } = this.cliOptions;
    return verbose ? true : false;
  }
}

export function determineVersion(
  importMetaURL: string,
  isMain: boolean,
  repoVersionRegExp = /shah\/ts-safe-template\/v?(?<version>\d+\.\d+\.\d+)\//,
): string {
  const fileURL = importMetaURL.startsWith("file://")
    ? importMetaURL.substr("file://".length)
    : importMetaURL;
  if (fs.existsSync(fileURL)) {
    return `v0.0.0-local${isMain ? ".main" : ""}`;
  }
  const matched = importMetaURL.match(repoVersionRegExp);
  if (matched) {
    return `v${matched.groups!["version"]}`;
  }
  return `v0.0.0-remote(no version tag/branch in ${importMetaURL})`;
}

export async function versionHandler(
  ctx: CommandHandlerContext,
): Promise<true | void> {
  const { "--version": version } = ctx.cliOptions;
  if (version) {
    console.log(determineVersion(ctx.calledFromMetaURL, ctx.calledFromMain));
    return true;
  }
}

export const commonHandlers = [versionHandler];

export async function CLI<
  T extends CommandHandlerContext = CommandHandlerContext,
>(
  docoptSpec: string,
  handlers: CommandHandler<T>[],
  prepareContext: (options: docopt.DocOptions) => T,
): Promise<void> {
  try {
    const options = docopt.default(docoptSpec);
    const context = prepareContext(options);
    let handled: true | void;
    for (const handler of handlers) {
      handled = await handler(context);
      if (handled) break;
    }
    if (!handled) {
      for (const handler of commonHandlers) {
        handled = await handler(context);
        if (handled) break;
      }
    }
    if (!handled) {
      console.error("Unable to handle validly parsed docoptSpec:");
      console.dir(options);
    }
  } catch (e) {
    console.error(e.message);
  }
}

if (import.meta.main) {
  CLI(
    docoptSpec,
    [httpServiceHandler],
    (options: docopt.DocOptions): CommandHandlerContext => {
      return new TypicalCommandHandlerContext(
        import.meta.url,
        import.meta.main,
        options,
      );
    },
  );
}
