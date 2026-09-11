import * as React from "react";
import {
  MaybeRTF,
  getThemeColorCssValue,
  normalizeThemeColorToken,
  type MaybeRTFProps,
  type RichText,
  type StyledLinkValue,
  type StyledTextValue,
  type ThemeColor,
} from "@yext/visual-editor";

export type RichTextStyleOverrides = NonNullable<
  MaybeRTFProps["richTextStyleOverrides"]
>;

const isRichText = (value: unknown): value is RichText =>
  Boolean(
    value &&
      typeof value === "object" &&
      (("html" in value && typeof value.html === "string") ||
        ("json" in value && typeof value.json === "string")),
  );

export const renderResolvedRichText = (
  value: unknown,
  className?: string,
  style?: React.CSSProperties,
): React.ReactNode => {
  if (React.isValidElement(value)) {
    const element = value as React.ReactElement<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    return React.cloneElement(element, {
      className: [element.props.className, className].filter(Boolean).join(" "),
      style: { ...element.props.style, ...style },
    });
  }

  return isRichText(value) || typeof value === "string" ? (
    <MaybeRTF data={value} className={className} style={style} />
  ) : null;
};

export const renderRichText = (
  value: unknown,
  richTextStyleOverrides?: MaybeRTFProps["richTextStyleOverrides"],
  className?: string,
): React.ReactNode => {
  if (React.isValidElement(value)) {
    if (!richTextStyleOverrides && !className) {
      return value;
    }

    const element = value as React.ReactElement<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    return React.cloneElement(element, {
      className: [element.props.className, className].filter(Boolean).join(" "),
      style: {
        ...element.props.style,
        ...richTextStyleOverrides,
        color:
          typeof richTextStyleOverrides?.color === "object"
            ? getThemeColorCssValue(richTextStyleOverrides.color)
            : richTextStyleOverrides?.color,
      } as React.CSSProperties,
    });
  }

  return isRichText(value) || typeof value === "string" ? (
    <MaybeRTF
      data={value}
      className={className}
      richTextStyleOverrides={richTextStyleOverrides}
    />
  ) : null;
};

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
  fontColor: ThemeColor | undefined,
  fallbackColor: string,
  fallbackFontFamily: string,
  fallbackFontSize: string,
  fallbackFontWeight: React.CSSProperties["fontWeight"],
  fallbackTextTransform?: React.CSSProperties["textTransform"],
): React.CSSProperties => ({
  color: getThemeColorCssValue(fontColor) ?? fallbackColor,
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
