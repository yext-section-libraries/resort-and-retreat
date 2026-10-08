import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MaybeRTF,
  getDefaultRTF,
  resolveComponentData,
  type ThemeColor,
} from "@yext/visual-editor";
import { defaultTextStyles } from "../src/library/shared/sectionDefaults";
import {
  renderRichText,
  resolveRichTextStyles,
  resolveStyledTextStyles,
  resolveTextColor,
} from "../src/library/shared/sectionStyles";

const color = (selectedColor: string): ThemeColor => ({
  selectedColor,
  contrastingColor: "default",
});

test("Text Styles color uses the section contrast when no color is selected", async (t) => {
  const cases = [
    {
      name: "explicit selection",
      selected: "palette-primary",
      expected: "palette-primary",
    },
    {
      name: "default selection",
      selected: "default",
      expected: "palette-quaternary",
    },
    {
      name: "no selection",
      selected: undefined,
      expected: "palette-quaternary",
    },
  ];
  for (const { name, selected, expected } of cases) {
    await t.test(name, () => {
      const styles = {
        ...defaultTextStyles,
        color: selected ? color(selected) : undefined,
      };
      assert.equal(
        resolveTextColor(styles, "palette-quaternary")?.selectedColor,
        expected,
      );
      assert.equal(
        resolveStyledTextStyles(
          styles,
          "var(--colors-palette-quaternary)",
          "inherit",
          "16px",
          "400",
        ).color,
        `var(--colors-${expected})`,
      );
    });
  }
  assert.equal(resolveTextColor(defaultTextStyles, "default"), undefined);
  assert.equal(resolveTextColor(defaultTextStyles), undefined);
  assert.deepEqual(
    resolveTextColor(defaultTextStyles, color("palette-secondary")),
    color("palette-secondary"),
  );
});

test("raw and resolved rich text receive body typography variables and selected color", async (t) => {
  const data = {
    html: "<p>Paragraph <strong>bold</strong></p><ul><li>List item</li></ul>",
  };
  const styles = resolveRichTextStyles(
    {
      fontFamily: "Georgia",
      fontSize: "30px",
      fontWeight: "700",
      fontStyle: "italic",
      textTransform: "uppercase",
      color: color("palette-primary"),
    },
    color("palette-secondary"),
  );
  for (const [name, content] of [
    ["raw rich text", data],
    ["resolved rich text", <MaybeRTF data={data} />],
  ] as const) {
    await t.test(name, () => {
      const html = renderToStaticMarkup(
        renderRichText(content, styles, "custom-body"),
      );
      for (const css of [
        "--fontFamily-body-fontFamily:Georgia",
        "--fontSize-body-fontSize:30px",
        "--fontWeight-body-fontWeight:700",
        "--fontStyle-body-fontStyle:italic",
        "--textTransform-body-textTransform:uppercase",
        "color:var(--colors-palette-primary)",
      ])
        assert.ok(html.includes(css), css);
      assert.ok(html.includes("custom-body"));
      assert.ok(html.includes(data.html), "preserves rich text markup");
    });
  }
});

test("default typography inherits the theme and plain text remains renderable", () => {
  const html = renderToStaticMarkup(
    renderRichText({ html: "<p>Default</p>" }, defaultTextStyles),
  );
  assert.ok(!html.includes("--fontSize-body-fontSize"));
  assert.ok(!html.includes("font-size:default"));
  assert.ok(
    renderToStaticMarkup(
      renderRichText("Plain text", defaultTextStyles),
    ).includes("Plain text"),
  );
  assert.equal(
    renderToStaticMarkup(renderRichText(undefined, defaultTextStyles)),
    "",
  );
});

test("rich text overrides inherit the section theme without starting a new theme scope", async (t) => {
  const data = getDefaultRTF("Banner Text");
  const styles = {
    ...defaultTextStyles,
    fontSize: "32px",
    fontWeight: "700",
    textTransform: "uppercase" as const,
  };
  const resolved = resolveComponentData(
    {
      field: "",
      constantValue: { defaultValue: data },
      constantValueEnabled: true,
    },
    "en",
    {},
  );
  for (const [name, value] of [
    ["raw rich text", data],
    ["resolved banner text", resolved],
    ["HTML string", data.html],
  ] as const) {
    await t.test(name, () => {
      const rendered = renderRichText(value, styles);
      assert.ok(React.isValidElement<{ className?: string }>(rendered));
      assert.ok(
        !rendered.props.className?.split(/\s+/).includes("components"),
        "a new .components scope would reset typography variables to !important theme defaults",
      );
      const html = renderToStaticMarkup(rendered);
      assert.ok(html.includes("--fontSize-body-fontSize:32px"));
      assert.ok(html.includes("--fontWeight-body-fontWeight:700"));
      assert.ok(html.includes("--textTransform-body-textTransform:uppercase"));
      assert.ok(html.includes("Banner Text"));
    });
  }
});
