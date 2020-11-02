# Template Literal based TypeScript Text Templates

This library provides a convenient way to create a single layout file with some partials that can then be replaced using either regular expressions, simple strings, or [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) variables/placeholders (regular JavaScript styles).

## Template Sources

A template source is a regular text file that includes at least one "body placeholder" with an optional number of arbitrary "partials". Below is a sample template with a body and a head (see [mod_test-00.tmpl.html](mod_test-00.tmpl.html)). Templates can have as many partials but only one body may be present. The default body replacement variable is `<!-- BODY CONTENT GOES HERE -->` because that's a common HTML convention but the replacement variable may be any arbitrary text.

```html
<html>

<head>
    <!-- HEAD PARTIAL CONTENT -->
</head>

<body>
    <!-- BODY CONTENT GOES HERE -->
</body>

</html>
```

## Generating text from template sources without partials

Assuming the content in [mod_test-00.tmpl.html](mod_test-00.tmpl.html), this is how you would generate text:

```typescript
  const template = mod.governedTemplate("my-template.html");
  const content = "variable";
  const generated = template`This is my body content, which can contain a ${content} or anything else that can go into a TypeScript template literal.`;
```

Note that once you create the [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) called `template` you can use it to generate as many different variations of the file attached to that template literal as you'd like. 

After executing the code above, `generated` will contain:

```html
<html>

<head>
    <!-- HEAD PARTIAL CONTENT -->
</head>

<body>
    This is my body content, which can contain a variable or anything else that can go into a TypeScript template literal.
</body>

</html>
```

## Generating text from template sources with partials

Assuming the content in [mod_test-00.tmpl.html](mod_test-00.tmpl.html), this is how you would generate text with reusable partials:

```typescript
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
  const generated = template`This is my body content, which can contain a ${content} or anything else that can go into a TypeScript template literal.`;
```

Note that once you create the [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) called `template` you can use it to generate as many different variations of the file attached to that template literal as you'd like. 

After executing the code above, `generated` will contain:

```html
<html>

<head>
    <title>Page Title</title>
</head>

<body>
    This is my body content, which can contain a variable or anything else that can go into a TypeScript template literal.
</body>

</html>
```

# HTTP Service Usage

Start the Template Orchestration server:

```bash
deno-run toctl.ts server --verbose
```

In a separate window, try the service using [mod_test-00.in.json](mod_test-00.in.json) as the HTTP request body:

```bash
cd $HOME/workspaces/github.com/shah/ts-safe-template
curl -H "Content-Type: application/json" --data @mod_test-00.in.json http://localhost:8163/transform
```

The output should be:

```html
<html>

<head>
    <title>Page Title</title>
</head>

<body>
    This is my body content, which can contain a variable or anything else that can go into a TypeScript template literal.
</body>

</html>
```