import { interpolate as interp, safety } from "./deps.ts";
import { escapeHtml } from "./escape-html.ts";
import { TemplateLiteral } from "./template-literal.ts";
import * as ts from "./template-supplier.ts";

export interface GovernedTemplatePartial {
  readonly placeholder: string | RegExp;
  readonly content: string;
}

export const isGovernedTemplatePartial = safety.typeGuard<
  GovernedTemplatePartial
>("placeholder", "content");

export const isGovernedTemplatePartialsArray = safety.typeGuardArrayOf<
  GovernedTemplatePartial,
  GovernedTemplatePartial[]
>("placeholder", "content");

export interface GovernedTemplateOptions {
  readonly bodyPlaceholderText: string;
  readonly escapeBodyContent: boolean;
  readonly partials?: GovernedTemplatePartial[];
}

export const isGovernedTemplateOptions = safety.typeGuard<
  GovernedTemplateOptions
>("bodyPlaceholderText", "escapeBodyContent");

export function isGovernedTemplatePartials(
  o: unknown,
): o is { partials: GovernedTemplatePartial[] } {
  if (o && typeof o === "object" && "partials" in o) {
    const psupplier = (o as { partials: GovernedTemplatePartial[] });
    return isGovernedTemplatePartialsArray(psupplier.partials);
  }
  return false;
}

export interface GovernedTemplateOptionsSupplier {
  readonly templateOptions: GovernedTemplateOptions;
}

export const isGovernedTemplateOptionsSupplier = safety.typeGuard<
  GovernedTemplateOptionsSupplier
>("templateOptions");

export function defaultGovernedTemplateOptions(
  override?: Partial<GovernedTemplateOptions>,
): GovernedTemplateOptions {
  return {
    ...override,
    bodyPlaceholderText: override?.bodyPlaceholderText ||
      "<!-- BODY CONTENT GOES HERE -->",
    escapeBodyContent: override?.escapeBodyContent || false,
  };
}

export function governedTemplate(
  supplier: string | ts.TemplateSupplier,
  options: GovernedTemplateOptions = defaultGovernedTemplateOptions(),
): TemplateLiteral {
  const { bodyPlaceholderText, escapeBodyContent, partials } = options;
  const template = typeof supplier === "string" ? supplier : supplier.template;
  const [bodyStart, bodyEnd] = template.split(bodyPlaceholderText);
  return (literals: TemplateStringsArray, ...tmplLiteralArg: string[]) => {
    let result = "";
    for (let i = 0; i < tmplLiteralArg.length; i++) {
      result += literals[i];
      result += tmplLiteralArg[i];
    }
    result += literals[literals.length - 1];
    result = bodyStart +
      (escapeBodyContent ? escapeHtml(result) : result) +
      bodyEnd;

    if (partials) {
      for (const partial of partials) {
        result = result.replaceAll(partial.placeholder, partial.content);
      }
    }
    return result;
  };
}

export const isBodySupplier = safety.typeGuard<{ body: string }>("body");
export const isInterpolationSupplier = safety.typeGuard<
  { interpolate: Record<string, unknown> }
>("interpolate");

export async function transformJsonInput(
  input: string | Uint8Array,
): Promise<string> {
  try {
    const content = JSON.parse(
      typeof input === "string" ? input : new TextDecoder().decode(input),
    );
    const template = await ts.flexibleTemplateAcquirer(content);
    let options: GovernedTemplateOptions;
    if (isGovernedTemplateOptionsSupplier(content)) {
      options = content.templateOptions;
    } else if (isGovernedTemplateOptions(content)) {
      options = content;
    } else {
      options = defaultGovernedTemplateOptions();
    }
    const tmplLiteral = governedTemplate(template, options);
    let bodySupplier = { body: "No body property supplied " };
    if (isBodySupplier(content)) bodySupplier = content;
    const result = tmplLiteral`${bodySupplier.body}`;
    if (isInterpolationSupplier(content)) {
      const interpolationOptions: interp.InterpolationOptions = {
        bracketPrefixes: ["$"],
        openBracket: "{",
        closeBracket: "}",
      };
      return interp.interpolate(
        result,
        (src: string, bracketPrefix?: string): string => {
          const value = content.interpolate[src];
          if (typeof value === "string") return value;
          return JSON.stringify(value);
        },
        interpolationOptions,
      );
    }
    return result;
  } catch (err) {
    return err;
  }
}
