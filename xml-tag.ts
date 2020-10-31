import { escapeHtml } from "./escape-html.ts";
import { TemplateLiteral } from "./template-literals.ts";

export function htmlTag(
  tagName: string,
  escapeResult = false,
): TemplateLiteral {
  return (literals: TemplateStringsArray, ...placeholders: string[]) => {
    let result = "";
    for (let i = 0; i < placeholders.length; i++) {
      result += literals[i];
      result += placeholders[i];
    }
    result += literals[literals.length - 1];
    return `<${tagName}>` + (escapeResult ? escapeHtml(result) : result) +
      `</${tagName}>`;
  };
}
