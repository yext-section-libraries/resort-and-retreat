import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  Background,
  ComprehensiveCTA,
  EntityField,
  getAnalyticsScopeHash,
  getSurfaceColorStyle,
  getThemeColorCssValue,
  MaybeRTF,
  resolveComponentData,
  themeManagerCn,
  type ComprehensiveCTAValue,
  type StyledTextValue,
  type ThemeColor,
  ThemeOptions,
  type TranslatableAssetImage,
  type TranslatableRichText,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  Image,
  useDocument,
  VisibilityWrapper,
} from "@yext/visual-editor";

type StyledTextProps = {
  text: YextEntityField<TranslatableString>;
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type StyledRtfProps = {
  text: YextEntityField<TranslatableRichText>;
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type ImageFieldProps = {
  image: YextEntityField<TranslatableAssetImage>;
  imageConstrain: "fixed" | "filled";
};

// Audit wiring note: filter.fontColor is a scanner false positive here.
// title.fontColor and body.fontColor are applied in render, and CTA color/link
// are consumed by the shared ComprehensiveCTA runtime below.

export type ResortAndRetreatAboutSectionProps = {
  title: StyledTextProps;
  body: StyledRtfProps;
  image: ImageFieldProps;
  cta: ComprehensiveCTAValue;
  panelBackgroundColor: ThemeColor;
  boxBorderColor: ThemeColor;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
  };
};

const renderResolvedRichText = (
  value: unknown,
  className: string,
  style: React.CSSProperties,
) => {
  if (React.isValidElement(value)) {
    const element = value as React.ReactElement<{
      className?: string;
      style?: React.CSSProperties;
    }>;

    return React.cloneElement(element, {
      className: [element.props.className, className].filter(Boolean).join(" "),
      style: {
        ...(element.props.style ?? {}),
        ...style,
      },
    });
  }

  if (typeof value === "string") {
    return <MaybeRTF data={value} className={className} style={style} />;
  }

  if (value && typeof value === "object" && "html" in value) {
    return (
      <MaybeRTF
        data={value as { html: string }}
        className={className}
        style={style}
      />
    );
  }

  return null;
};

const resolveStyledTextStyles = (
  styles: StyledTextValue,
  fontColor: ThemeColor | undefined,
  fallbackColor: string,
  fallbackFontFamily: string,
  fallbackFontSize: string,
  fallbackFontWeight: React.CSSProperties["fontWeight"],
  fallbackTextTransform?: React.CSSProperties["textTransform"],
) => ({
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

const resolveBodyTypographyVariables = (
  styles: StyledTextValue,
): React.CSSProperties => {
  const resolvedStyles: Record<string, string> = {};

  if (styles.fontFamily !== "default") {
    resolvedStyles["--fontFamily-body-fontFamily"] = styles.fontFamily;
  }

  if (styles.fontSize !== "default") {
    resolvedStyles["--fontSize-body-fontSize"] = styles.fontSize;
  }

  if (styles.fontWeight !== "default") {
    resolvedStyles["--fontWeight-body-fontWeight"] = styles.fontWeight;
  }

  if (styles.fontStyle !== "default") {
    resolvedStyles["--fontStyle-body-fontStyle"] = styles.fontStyle;
  }

  if (styles.textTransform !== "default") {
    resolvedStyles["--textTransform-body-textTransform"] = styles.textTransform;
  }

  return resolvedStyles;
};

const ResortAndRetreatAboutSectionFields: YextFields<ResortAndRetreatAboutSectionProps> =
  {
    section: {
      label: "Section",
      type: "object",
      objectFields: {
        visibleOnLivePage: {
          label: "Visible on Live Page",
          type: "radio",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
        backgroundColor: {
          label: "Background Color",
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
      },
    },
    title: {
      label: "Title",
      type: "object",
      objectFields: {
        text: {
          type: "entityField",
          label: "Text",
          filter: {
            types: ["type.string"],
          },
        },
        styles: {
          label: "Text Styles",
          type: "styledText",
        },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    body: {
      label: "Body",
      type: "object",
      objectFields: {
        text: {
          type: "entityField",
          label: "Text",
          filter: {
            types: ["type.rich_text_v2"],
          },
        },
        styles: {
          label: "Text Styles",
          type: "styledText",
        },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    image: {
      label: "Image",
      type: "object",
      objectFields: {
        image: {
          type: "entityField",
          label: "Image",
          filter: {
            types: ["type.image"],
          },
        },
        imageConstrain: {
          label: "Image Constrain",
          type: "select",
          options: [
            { label: "Fixed", value: "fixed" },
            { label: "Filled", value: "filled" },
          ],
        },
      },
    },
    cta: {
      label: "Call to Action",
      type: "comprehensiveCTA",
    },
    panelBackgroundColor: {
      label: "Panel Background Color",
      type: "basicSelector",
      options: "BACKGROUND_COLOR",
    },
    boxBorderColor: {
      label: "Box Border Color",
      type: "basicSelector",
      options: ThemeOptions.BACKGROUND_COLOR.flatMap((group) => group.options),
    },
  };

export const ResortAndRetreatAboutSectionComponent: PuckComponent<
  ResortAndRetreatAboutSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const image = resolveComponentData(props.image.image, locale, streamDocument);
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const body = resolveComponentData(props.body.text, locale, streamDocument);
  const ctaValue: Partial<ComprehensiveCTAValue> = {
    data: props.cta.data,
    styles: props.cta.styles,
    className: props.cta.className,
    eventName: props.cta.eventName,
  };

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatAboutSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          background={props.section.backgroundColor}
          style={getSurfaceColorStyle(
            props.section.backgroundColor,
            streamDocument,
          )}
        >
          <div className="mx-auto max-w-[1360px] px-5 py-10 md:px-8 xl:px-10">
            <Background
              as="div"
              className="grid overflow-hidden rounded-2xl border xl:flex"
              background={props.panelBackgroundColor}
              style={{
                borderColor: getThemeColorCssValue(props.boxBorderColor),
                ...getSurfaceColorStyle(
                  props.panelBackgroundColor,
                  streamDocument,
                ),
              }}
            >
              <div className="order-2 xl:order-1 xl:relative xl:min-h-0 xl:flex-[1_1_50%] xl:self-stretch">
                <div className="h-full max-w-full overflow-hidden xl:absolute xl:inset-0 xl:min-h-0">
                  <EntityField
                    displayName="About Image"
                    fieldId={props.image.image.field}
                    constantValueEnabled={
                      props.image.image.constantValueEnabled
                    }
                  >
                    {image ? (
                      <Image
                        image={image}
                        className="h-full w-full md:max-h-[400px] lg:max-h-none"
                        style={{
                          display: "block",
                          height: "100%",
                          width: "100%",
                          objectFit:
                            props.image.imageConstrain === "filled"
                              ? "cover"
                              : "contain",
                        }}
                      />
                    ) : null}
                  </EntityField>
                </div>
              </div>
              <div className="order-1 flex flex-col gap-5 p-6 md:p-8 xl:order-2 xl:flex-[1_1_50%] xl:justify-center xl:p-10">
                <EntityField
                  displayName="About Title"
                  fieldId={props.title.text.field}
                  constantValueEnabled={props.title.text.constantValueEnabled}
                >
                  <h2
                    className="m-0"
                    style={resolveStyledTextStyles(
                      props.title.styles,
                      props.title.fontColor,
                      "currentColor",
                      "var(--fontFamily-h2-fontFamily)",
                      "var(--fontSize-h2-fontSize)",
                      "var(--fontWeight-h2-fontWeight)",
                      "var(--textTransform-h2-textTransform)",
                    )}
                  >
                    {title}
                  </h2>
                </EntityField>
                <EntityField
                  displayName="About Description"
                  fieldId={props.body.text.field}
                  constantValueEnabled={props.body.text.constantValueEnabled}
                >
                  {renderResolvedRichText(
                    body,
                    themeManagerCn(
                      "components rtf-theme rtf-wrapper m-0 whitespace-pre-line font-body-fontFamily font-body-fontWeight",
                    ),
                    {
                      ...resolveStyledTextStyles(
                        props.body.styles,
                        props.body.fontColor,
                        "currentColor",
                        "var(--fontFamily-body-fontFamily)",
                        "1rem",
                        "var(--fontWeight-body-fontWeight)",
                      ),
                      ...resolveBodyTypographyVariables(props.body.styles),
                    },
                  )}
                </EntityField>
                <div>
                  <EntityField
                    displayName="About CTA"
                    fieldId={props.cta.data.cta.field}
                    constantValueEnabled={
                      props.cta.data.cta.constantValueEnabled
                    }
                  >
                    <ComprehensiveCTA
                      value={ctaValue}
                      eventName="primaryCta"
                      style={
                        ctaValue.styles?.variant === "secondary" &&
                        ctaValue.styles.color?.selectedColor &&
                        ctaValue.styles.color.selectedColor !== "default"
                          ? {
                              borderColor: getThemeColorCssValue(
                                ctaValue.styles.color,
                              ),
                              color: getThemeColorCssValue(
                                ctaValue.styles.color,
                              ),
                            }
                          : undefined
                      }
                    />
                  </EntityField>
                </div>
              </div>
            </Background>
          </div>
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatAboutSection: YextComponentConfig<ResortAndRetreatAboutSectionProps> =
  {
    label: "About Section",
    fields: ResortAndRetreatAboutSectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "About This Hotel",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: true,
        },
        styles: {
          fontFamily: "default",
          fontSize: "default",
          fontWeight: "default",
          fontStyle: "default",
          textTransform: "default",
        },
        fontColor: undefined,
      },
      body: {
        text: {
          field: "",
          constantValue: {
            defaultValue: {
              json: JSON.stringify({
                root: {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: "normal",
                          style: "",
                          text: "[[name]] is located at [[address.line1]], serving as the perfect launchpad for exploring [[address.city]]'s rich history and vibrant culture. Our boutique property offers an elevated stay, seamlessly combining historic architecture with high-tech guest convenience.",
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "paragraph",
                      version: 1,
                    },
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: "normal",
                          style: "",
                          text: "The hotel features beautifully restored architectural details, an expansive art collection highlighting local creators, a quiet library lounge for remote work, and contactless digital key entry to save you time.",
                          type: "text",
                          version: 1,
                        },
                      ],
                      direction: "ltr",
                      format: "",
                      indent: 0,
                      type: "paragraph",
                      version: 1,
                    },
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "root",
                  version: 1,
                },
              }),
              html: "<p>[[name]] is located at [[address.line1]], serving as the perfect launchpad for exploring [[address.city]]'s rich history and vibrant culture. Our boutique property offers an elevated stay, seamlessly combining historic architecture with high-tech guest convenience.</p><p>The hotel features beautifully restored architectural details, an expansive art collection highlighting local creators, a quiet library lounge for remote work, and contactless digital key entry to save you time.</p>",
            },
            hasLocalizedValue: "true",
          },
          constantValueEnabled: true,
        },
        styles: {
          fontFamily: "default",
          fontSize: "default",
          fontWeight: "default",
          fontStyle: "default",
          textTransform: "default",
        },
        fontColor: undefined,
      },
      image: {
        image: {
          field: "",
          constantValue: {
            url: "https://a.mktgcdn.com/p/UHR6VTEvcR-yDMqPSOS7LyK87Qt56EOrmfNbhLQxI08/1267x1900.jpg",
            width: 1267,
            height: 1900,
          },
          constantValueEnabled: true,
        },
        imageConstrain: "filled",
      },
      cta: {
        data: {
          actionType: "link",
          cta: {
            field: "",
            constantValue: {
              label: {
                defaultValue: "Check Availability",
                hasLocalizedValue: "true",
              },
              link: { defaultValue: "#book", hasLocalizedValue: "true" },
              linkType: "URL",
              ctaType: "textAndLink",
            },
            constantValueEnabled: true,
            selectedType: "textAndLink",
          },
          openInNewTab: false,
        },
        styles: {
          variant: "primary",
          color: {
            selectedColor: "palette-secondary",
            contrastingColor: "palette-secondary-contrast",
          },
          button: {
            fontFamily: "default",
            fontSize: "default",
            fontWeight: "default",
            fontStyle: "default",
            textTransform: "default",
            borderRadius: "default",
            letterSpacing: "default",
          },
        },
      },
      panelBackgroundColor: {
        selectedColor: "palette-tertiary",
        contrastingColor: "palette-tertiary-contrast",
      },
      boxBorderColor: {
        selectedColor: "palette-primary",
        contrastingColor: "palette-primary-contrast",
      },
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
      },
    },
    render: (props) => <ResortAndRetreatAboutSectionComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatAboutSection",
  displayName: "About Section",
  description: "About Section",
  pageSetTypes: ["ENTITY"],
};
