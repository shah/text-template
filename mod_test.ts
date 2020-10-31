import { path, testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./mod.ts";

function testFilePath(relTestFileName: string): string {
  return path.join(
    path.relative(
      Deno.cwd(),
      path.dirname(import.meta.url).substr("file://".length),
    ),
    relTestFileName,
  );
}

Deno.test(`HTML escaped string literal`, async () => {
  const escaped = mod.htmlEscape`This should be <escaped>`;
  ta.assertEquals(escaped, "This should be &lt;escaped&gt;");
});

Deno.test(`Non-HTML escaped string literal with HTML escaped placeholders`, async () => {
  const escaped = "<be escaped>";
  const phe = mod.htmlEscapePlaceholders
    `This should be <not be escaped> ${escaped}`;
  ta.assertEquals(phe, "This should be <not be escaped> &lt;be escaped&gt;");
});

Deno.test(`HTML tag raw`, async () => {
  const div = mod.xmlTag("div");
  const phe = div`This should be in a div with <no escapes>`;
  ta.assertEquals(phe, "<div>This should be in a div with <no escapes></div>");
});

Deno.test(`HTML tag with results escaped`, async () => {
  const div = mod.xmlTag(
    "div",
    { style: "color: white" },
    { escapeResult: true },
  );
  const phe = div`This should be in a div with <escaped tag>`;
  ta.assertEquals(
    phe,
    `<div style="color: white">This should be in a div with &lt;escaped tag&gt;</div>`,
  );
});

Deno.test(`HTML template 00 (basic)`, async () => {
  const template = mod.governedTemplate(
    testFilePath("mod_test-00.tmpl.html"),
    mod.defaultGovernedTemplateOptions({
      bodyPlaceholderText: "<!-- BODY CONTENT GOES HERE -->",
      partials: [{
        placeholder: "<!-- HEAD PARTIAL CONTENT -->",
        content: "<title>Page Title</title>",
      }],
    }),
  );

  const content = "variable";
  const generated = template
    `This is my body content, which can contain a ${content} or anything else that can go into a TypeScript template literal.`;

  const golden = Deno.readTextFileSync(
    testFilePath("mod_test-00.html.golden"),
  );
  ta.assertStrictEquals(generated, golden);
});

Deno.test(`HTML template 01 (complex)`, async () => {
  const template = mod.governedTemplate(
    testFilePath("mod_test-01.tmpl.html"),
    mod.defaultGovernedTemplateOptions({
      bodyPlaceholderText: "<!-- BODY CONTENT GOES HERE -->",
      partials: [{
        placeholder: "<!-- SIGNATURE PARTIAL CONTENT GOES HERE -->",
        content: "Regards,<br> Medigy Team",
      }],
    }),
  );
  const generated = template`<p>Hi</p>

                                                        Click below to create your new password.

                                                        </p>
                                                        <p>
                                                        <table style="width:200px;height:40px;">
                                                            <tbody>
                                                                <tr>
                                                                    <td
                                                                        style="background-color:#1a4e7a;height:30px;width:475px;text-align: center;vertical-align: middle;border-radius: 5px;">
                                                                        <a href="{{url}}"
                                                                            style="color:#FFF;height:30px;width:200px;text-decoration:none !important; font-size:15px;text-decoration:none;">Create
                                                                            Password</a>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        </p>
                                                        <p>
                                                            If you find any difficulty in clicking the above link,
                                                            please copy and paste the below url into your browser.
                                                        </p>
                                                        <p>{{url}}</p>`;
  const golden = Deno.readTextFileSync(
    testFilePath("mod_test-01.html.golden"),
  );
  ta.assertStrictEquals(generated, golden);
});
