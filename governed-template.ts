import { TemplateLiteral } from "./template-literals.ts";
import { escapeHtml } from "./escape-html.ts";

export interface GovernedTemplatePartial {
  readonly placeholder: string | RegExp;
  readonly content: string;
}

export interface GoverendTemplateOptions {
  readonly bodyPlaceholderText: string;
  readonly escapeBodyContent: boolean;
  readonly partials?: GovernedTemplatePartial[];
}

export function defaultGovernedTemplateOptions(
  override?: Partial<GoverendTemplateOptions>,
): GoverendTemplateOptions {
  return {
    ...override,
    bodyPlaceholderText: override?.bodyPlaceholderText ||
      "<!-- BODY CONTENT GOES HERE -->",
    escapeBodyContent: override?.escapeBodyContent || false,
  };
}

export function governedTemplate(
  layoutSource: string,
  options: GoverendTemplateOptions = defaultGovernedTemplateOptions(),
): TemplateLiteral {
  const source = Deno.readTextFileSync(layoutSource);
  const { bodyPlaceholderText, escapeBodyContent, partials } = options;
  const [bodyStart, bodyEnd] = source.split(bodyPlaceholderText);
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
