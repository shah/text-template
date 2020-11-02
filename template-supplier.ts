import { safety } from "./deps.ts";

export interface TemplateSupplier {
  readonly template: string;
}

export const isTemplateSupplier = safety.typeGuard<TemplateSupplier>(
  "template",
);

export interface LocalFileTemplateSupplier {
  readonly templateFileName: string;
}

export const isLocalFileTemplateSupplier = safety.typeGuard<
  LocalFileTemplateSupplier
>(
  "templateFileName",
);

export interface UrlTemplateSupplier {
  readonly templateURL: string | URL;
}

export const isUrlTemplateSupplier = safety.typeGuard<UrlTemplateSupplier>(
  "templateURL",
);

export interface ImportTemplateSupplier {
  readonly templateImportURL: string;
}

export const isImportTemplateSupplier = safety.typeGuard<
  ImportTemplateSupplier
>(
  "templateImportURL",
);

export interface TemplateSupplierAcquirer {
  (content: unknown): Promise<TemplateSupplier>;
}

export async function flexibleTemplateAcquirer(
  content:
    | TemplateSupplier
    | LocalFileTemplateSupplier
    | UrlTemplateSupplier
    | ImportTemplateSupplier
    | unknown,
): Promise<TemplateSupplier> {
  if (isTemplateSupplier(content)) return content;

  if (isLocalFileTemplateSupplier(content)) {
    let template = "<unable to obtain local template>";
    try {
      template = Deno.readTextFileSync(content.templateFileName);
    } catch (err) {
      template =
        `Unable to acquire template from local file ${content.templateFileName}: ${err}`;
    }
    const result: TemplateSupplier & LocalFileTemplateSupplier = {
      template: template,
      templateFileName: content.templateFileName,
    };
    return result;
  }

  if (isImportTemplateSupplier(content)) {
    let template = "<unable to import template>";
    try {
      const module = await import(content.templateImportURL);
      if (module.default && typeof module.default === "string") {
        template = module.default;
      } else {
        template =
          `No default string found as template in ${content.templateImportURL}`;
      }
    } catch (err) {
      template =
        `Unable to import template ${content.templateImportURL}: ${err}`;
    }
    const result: TemplateSupplier & ImportTemplateSupplier = {
      template: template,
      templateImportURL: content.templateImportURL,
    };
    return result;
  }

  if (isUrlTemplateSupplier(content)) {
    const result: TemplateSupplier & UrlTemplateSupplier = {
      template:
        `TODO: acquisition from URL not implemented (${content.templateURL}), use templateImportURL for now`,
      templateURL: content.templateURL,
    };
    return result;
  }

  return {
    template:
      `Unable to determine template from content: template, templateFileName, or templateImportURL required`,
  };
}
