import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  Background,
  ComprehensiveCTA,
  createItemSource,
  EntityField,
  getAnalyticsScopeHash,
  getDefaultRTF,
  getSurfaceColorStyle,
  getThemeColorCssValue,
  MaybeRTF,
  resolveComponentData,
  themeManagerCn,
  ThemeOptions,
  type ComprehensiveCTAValue,
  type StyledTextValue,
  type ThemeColor,
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

type CardTextStyleProps = {
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type BlogCardItem = {
  title: YextEntityField<TranslatableString>;
  description: YextEntityField<TranslatableRichText>;
  image: YextEntityField<TranslatableAssetImage>;
  ctaLabel: YextEntityField<TranslatableString>;
  ctaLink: YextEntityField<TranslatableString>;
};

const createBlogCta = (): ComprehensiveCTAValue =>
  ({
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
  }) satisfies ComprehensiveCTAValue;

const blogCardSource = createItemSource<BlogCardItem>({
  label: "Blog Cards",
  mappingFields: {
    title: {
      type: "entityField",
      label: "Title",
      filter: { types: ["type.string"] },
    },
    description: {
      type: "entityField",
      label: "Description",
      filter: { types: ["type.rich_text_v2"] },
    },
    image: {
      type: "entityField",
      label: "Image",
      filter: { types: ["type.image"] },
    },
    ctaLabel: {
      type: "entityField",
      label: "CTA Label",
      filter: { types: ["type.string"] },
    },
    ctaLink: {
      type: "entityField",
      label: "CTA Link",
      filter: { types: ["type.string"] },
    },
  },
  defaultValues: [
    {
      title: {
        field: "",
        constantValue: {
          defaultValue:
            "48 Hours in [[address.city]]: The Ultimate Weekend Itinerary",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      description: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "Discover how to make the most of a short trip, from sunrise walks under moss-draped oaks to candlelit southern dinners.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      image: {
        field: "",
        constantValue: {
          url: "https://a.mktgcdn.com/p/Qdlacb36DqN5Lt3q6V9jw-qSMmbPyl_AeMEI_CyDkHc/1267x1900.jpg",
          width: 1267,
          height: 1900,
        },
        constantValueEnabled: true,
      },
      ctaLabel: {
        field: "",
        constantValue: {
          defaultValue: "Check Availability",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      ctaLink: {
        field: "",
        constantValue: {
          defaultValue: "#book",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
    {
      title: {
        field: "",
        constantValue: {
          defaultValue:
            "Hidden Gems: The Best Boutique Shops And Cafes Near [[geomodifier]]",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      description: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "Skip the tourist traps. Our local concierge team shares their favorite local boutiques, bookstores, and artisan coffee shops.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      image: {
        field: "",
        constantValue: {
          url: "https://a.mktgcdn.com/p/UHR6VTEvcR-yDMqPSOS7LyK87Qt56EOrmfNbhLQxI08/1267x1900.jpg",
          width: 1267,
          height: 1900,
        },
        constantValueEnabled: true,
      },
      ctaLabel: {
        field: "",
        constantValue: {
          defaultValue: "Check Availability",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      ctaLink: {
        field: "",
        constantValue: {
          defaultValue: "#book",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
  ],
});

export type ResortAndRetreatBlogSectionProps = {
  title: StyledTextProps;
  entries: typeof blogCardSource.value;
  entryAction: Partial<ComprehensiveCTAValue>;
  entryTitleStyles: CardTextStyleProps;
  entryDescriptionStyles: CardTextStyleProps;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    cardBackgroundColor: ThemeColor;
    cardBorderColor: ThemeColor;
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

const createStyledTextDefault = (defaultValue: string): StyledTextProps => ({
  text: {
    field: "",
    constantValue: { defaultValue, hasLocalizedValue: "true" },
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
});

const createCardTextStyleDefault = (): CardTextStyleProps => ({
  styles: {
    fontFamily: "default",
    fontSize: "default",
    fontWeight: "default",
    fontStyle: "default",
    textTransform: "default",
  },
  fontColor: undefined,
});

const createCardTextStyleField = (label: string) => ({
  label,
  type: "object" as const,
  objectFields: {
    styles: { label: "Text Styles", type: "styledText" as const },
    fontColor: {
      label: "Font Color",
      type: "basicSelector" as const,
      options: "SITE_COLOR" as const,
    },
  },
});

// Audit wiring note: style.fontColor is applied through the shared entry style
// groups in render, and shared ctas styling is merged into each entry cta.

const ResortAndRetreatBlogSectionFields: YextFields<ResortAndRetreatBlogSectionProps> =
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
        cardBackgroundColor: {
          label: "Card Background Color",
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
        cardBorderColor: {
          label: "Card Border Color",
          type: "basicSelector",
          options: ThemeOptions.BACKGROUND_COLOR.flatMap(
            (group) => group.options,
          ),
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
          filter: { types: ["type.string"] },
        },
        styles: { label: "Text Styles", type: "styledText" },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    entries: blogCardSource.field,
    // Shared ctas styling is merged into each rendered cta below.
    entryAction: {
      label: "Entry Action",
      type: "comprehensiveCTA",
    },
    entryTitleStyles: createCardTextStyleField("Entry Title Styles"),
    entryDescriptionStyles: createCardTextStyleField(
      "Entry Description Styles",
    ),
  };

export const ResortAndRetreatBlogSectionComponent: PuckComponent<
  ResortAndRetreatBlogSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const sectionStyle = getSurfaceColorStyle(
    props.section.backgroundColor,
    streamDocument,
  );
  const sectionForeground =
    getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
    "currentColor";
  const cardStyle = getSurfaceColorStyle(
    props.section.cardBackgroundColor,
    streamDocument,
  );
  const cardForeground =
    getThemeColorCssValue(props.section.cardBackgroundColor.contrastingColor) ??
    "var(--colors-palette-quaternary)";
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatBlogSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          background={props.section.backgroundColor}
          style={sectionStyle}
        >
          <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 md:px-8 xl:px-10">
            <EntityField
              displayName="Blog Title"
              fieldId={props.title.text.field}
              constantValueEnabled={props.title.text.constantValueEnabled}
            >
              <h2
                className="m-0 text-left xl:text-center"
                style={resolveStyledTextStyles(
                  props.title.styles,
                  props.title.fontColor,
                  sectionForeground,
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
              displayName="Blog Cards"
              fieldId={props.entries.field}
              constantValueEnabled={props.entries.constantValueEnabled}
            >
              <div className="grid gap-8 xl:grid-cols-2">
                {blogCardSource
                  .resolveItems(props.entries, streamDocument)
                  .map((card, index) => {
                    const image = card.image
                      ? resolveComponentData(card.image, locale, streamDocument)
                      : undefined;
                    const cardTitle = card.title
                      ? resolveComponentData(card.title, locale, streamDocument)
                      : "";
                    const description = card.description
                      ? resolveComponentData(
                          card.description,
                          locale,
                          streamDocument,
                        )
                      : undefined;
                    const ctaLabel = card.ctaLabel
                      ? resolveComponentData(
                          card.ctaLabel,
                          locale,
                          streamDocument,
                        )
                      : "";
                    const ctaLink = card.ctaLink
                      ? resolveComponentData(
                          card.ctaLink,
                          locale,
                          streamDocument,
                        )
                      : "#";
                    const ctaValue: Partial<ComprehensiveCTAValue> = {
                      ...props.entryAction,
                      data: {
                        ...props.entryAction.data,
                        cta: {
                          field: "",
                          constantValueEnabled: true,
                          constantValue: {
                            ctaType: "textAndLink",
                            label: {
                              defaultValue: ctaLabel?.toString() || "",
                              hasLocalizedValue: "true",
                            },
                            link: {
                              defaultValue: ctaLink?.toString() || "#",
                              hasLocalizedValue: "true",
                            },
                            linkType: "URL",
                          },
                          selectedType: "textAndLink",
                        },
                      },
                    } as Partial<ComprehensiveCTAValue>;
                    return (
                      <Background
                        as="div"
                        key={index}
                        className="flex flex-col overflow-hidden rounded-2xl border"
                        style={{
                          ...cardStyle,
                          color: cardForeground,
                          borderColor: getThemeColorCssValue(
                            props.section.cardBorderColor,
                          ),
                        }}
                        background={props.section.cardBackgroundColor}
                      >
                        <div className="overflow-hidden">
                          {image ? (
                            <Image
                              image={image}
                              className="h-full w-full"
                              style={{
                                display: "block",
                                height: "338px",
                                width: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col gap-5 p-6">
                          <h3
                            className="m-0"
                            style={resolveStyledTextStyles(
                              props.entryTitleStyles.styles,
                              props.entryTitleStyles.fontColor,
                              cardForeground,
                              "var(--fontFamily-h4-fontFamily)",
                              "var(--fontSize-h4-fontSize)",
                              "var(--fontWeight-h4-fontWeight)",
                              "var(--textTransform-h4-textTransform)",
                            )}
                          >
                            {cardTitle}
                          </h3>
                          {renderResolvedRichText(
                            description,
                            themeManagerCn(
                              "components rtf-theme rtf-wrapper m-0 flex-1 font-body-fontFamily font-body-fontWeight",
                            ),
                            {
                              ...resolveStyledTextStyles(
                                props.entryDescriptionStyles.styles,
                                props.entryDescriptionStyles.fontColor,
                                cardForeground,
                                "var(--fontFamily-body-fontFamily)",
                                "1rem",
                                "var(--fontWeight-body-fontWeight)",
                              ),
                              ...resolveBodyTypographyVariables(
                                props.entryDescriptionStyles.styles,
                              ),
                            },
                          )}
                          {ctaLabel ? (
                            <div>
                              <ComprehensiveCTA
                                value={ctaValue}
                                eventName={`cardCta${index}`}
                                style={
                                  ctaValue.styles?.variant === "secondary" &&
                                  ctaValue.styles.color?.selectedColor &&
                                  ctaValue.styles.color.selectedColor !==
                                    "default"
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
                            </div>
                          ) : null}
                        </div>
                      </Background>
                    );
                  })}
              </div>
            </EntityField>
          </div>
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatBlogSection: YextComponentConfig<ResortAndRetreatBlogSectionProps> =
  {
    label: "Blog Section",
    fields: ResortAndRetreatBlogSectionFields,
    defaultProps: {
      title: createStyledTextDefault(
        "From the Blog: [[address.city]] Travel Guide",
      ),
      entries: blogCardSource.defaultValue,
      entryAction: createBlogCta(),
      entryTitleStyles: createCardTextStyleDefault(),
      entryDescriptionStyles: createCardTextStyleDefault(),
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
        cardBackgroundColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
        cardBorderColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
      },
    },
    render: (props) => <ResortAndRetreatBlogSectionComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatBlogSection",
  displayName: "Blog Section",
  description: "Blog Section",
  pageSetTypes: ["ENTITY"],
};
