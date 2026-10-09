import * as React from "react";
import {
  MaybeRTF,
  getThemeColorCssValue,
  normalizeThemeColorToken,
  renderStyledRichText,
  type RichText,
  type StyledLinkValue,
  type StyledTextValue,
  type ThemeColor,
} from "@yext/visual-editor";

const isRichText = (value: unknown): value is RichText =>
  Boolean(
    value &&
    typeof value === "object" &&
    (("html" in value && typeof value.html === "string") ||
      ("json" in value && typeof value.json === "string")),
  );

export const renderRichText = (
  value: unknown,
  text: StyledTextValue,
  className?: string,
): React.ReactNode => {
  const content = isRichText(value) ? (
    <MaybeRTF data={value} />
  ) : React.isValidElement(value) || typeof value === "string" ? (
    value
  ) : null;

  const rendered = renderStyledRichText({ content, text, className });
  if (!React.isValidElement<{ className?: string }>(rendered)) {
    return rendered;
  }

  // A new .components scope resets these variables to !important editor theme
  // defaults. Inherit the section's theme so the selected typography can apply.
  return React.cloneElement(rendered, {
    className: rendered.props.className
      ?.split(/\s+/)
      .filter((name) => name !== "components")
      .join(" "),
  });
};

/** Use the selected text color, otherwise the section's contrasting color. */
export const resolveTextColor = (
  styles: Pick<StyledTextValue, "color">,
  fallbackColor?: ThemeColor | string,
): ThemeColor | undefined => {
  if (normalizeThemeColorToken(styles.color)) {
    return styles.color;
  }
  const fallbackToken = normalizeThemeColorToken(fallbackColor);
  return fallbackToken
    ? typeof fallbackColor === "string"
      ? { selectedColor: fallbackToken, contrastingColor: "default" }
      : fallbackColor
    : undefined;
};

export const resolveRichTextStyles = (
  styles: StyledTextValue,
  fallbackColor?: ThemeColor | string,
): StyledTextValue => ({
  ...styles,
  color: resolveTextColor(styles, fallbackColor),
});

export const isRichTextEmpty = (value: unknown): boolean => {
  if (!value) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (typeof value === "object" && "html" in value) {
    return typeof value.html !== "string" || value.html.trim() === "";
  }
  return false;
};

export const resolveStyledTextStyles = (
  styles: StyledTextValue,
  fallbackColor: string,
  fallbackFontFamily: string,
  fallbackFontSize: string,
  fallbackFontWeight: React.CSSProperties["fontWeight"],
  fallbackTextTransform?: React.CSSProperties["textTransform"],
): React.CSSProperties => ({
  color: getThemeColorCssValue(resolveTextColor(styles)) ?? fallbackColor,
  fontFamily:
    styles.fontFamily === "default" ? fallbackFontFamily : styles.fontFamily,
  fontSize: styles.fontSize === "default" ? fallbackFontSize : styles.fontSize,
  fontWeight:
    styles.fontWeight === "default" ? fallbackFontWeight : styles.fontWeight,
  fontStyle: styles.fontStyle === "default" ? undefined : styles.fontStyle,
  textTransform:
    styles.textTransform === "default"
      ? fallbackTextTransform
      : styles.textTransform,
});

export const resolveBodyTypographyVariables = (
  styles: StyledTextValue,
): React.CSSProperties => {
  const variables: Record<string, string> = {};
  if (styles.fontFamily !== "default") {
    variables["--fontFamily-body-fontFamily"] = styles.fontFamily;
  }
  if (styles.fontSize !== "default") {
    variables["--fontSize-body-fontSize"] = styles.fontSize;
  }
  if (styles.fontWeight !== "default") {
    variables["--fontWeight-body-fontWeight"] = styles.fontWeight;
  }
  if (styles.fontStyle !== "default") {
    variables["--fontStyle-body-fontStyle"] = styles.fontStyle;
  }
  if (styles.textTransform !== "default") {
    variables["--textTransform-body-textTransform"] = styles.textTransform;
  }
  return variables;
};

export const getTextStyles = ({
  color,
  styles,
}: {
  color?: ThemeColor;
  styles: Pick<
    StyledLinkValue,
    | "fontFamily"
    | "fontSize"
    | "fontWeight"
    | "fontStyle"
    | "textTransform"
    | "letterSpacing"
  >;
}): React.CSSProperties => ({
  color: getThemeColorCssValue(color),
  fontFamily: styles.fontFamily === "default" ? undefined : styles.fontFamily,
  fontSize: styles.fontSize === "default" ? undefined : styles.fontSize,
  fontWeight: styles.fontWeight === "default" ? undefined : styles.fontWeight,
  fontStyle: styles.fontStyle === "default" ? undefined : styles.fontStyle,
  textTransform:
    styles.textTransform === "default" ? undefined : styles.textTransform,
  letterSpacing:
    styles.letterSpacing === "default" ? undefined : styles.letterSpacing,
});

export const hasExplicitThemeColor = (
  color?: ThemeColor,
): color is ThemeColor => Boolean(normalizeThemeColorToken(color));

export const resolveBorderRadius = (value?: string): string | undefined =>
  !value || value === "default" ? undefined : value;
