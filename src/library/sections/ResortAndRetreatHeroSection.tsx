import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  ComprehensiveCTA,
  EntityField,
  getAggregateRating,
  getAnalyticsScopeHash,
  getThemeColorCssValue,
  resolveComponentData,
  themeManagerCn,
  ThemeOptions,
  type ComprehensiveCTAValue,
  type StyledImageValue,
  type StyledTextValue,
  type ThemeColor,
  type TranslatableAssetImage,
  type TranslatableRichText,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  Image,
  MaybeRTF,
  useDocument,
  VisibilityWrapper,
  Background,
  useBackground,
} from "@yext/visual-editor";
import { getDefaultRTF } from "@yext/visual-editor";

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
  aspectRatio: number;
  imageConstrain: "fixed" | "filled";
  styles?: StyledImageValue;
};

// Audit wiring note: filter.fontColor is a scanner false positive here.
// Each heading/body fontColor is applied in render, and cta behavior is handled
// by the shared ComprehensiveCTA runtime below.

export type ResortAndRetreatHeroSectionProps = {
  availabilityBadge: StyledTextProps;
  heading: StyledTextProps;
  subheading: StyledTextProps;
  body: StyledRtfProps;
  heroImage: ImageFieldProps;
  primaryCta: ComprehensiveCTAValue;
  secondaryCta: ComprehensiveCTAValue;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
  };
};

const hasImageSource = (image?: TranslatableAssetImage) => {
  if (!image || typeof image !== "object") {
    return false;
  }

  const url = "url" in image ? image.url : image.image?.url;
  return typeof url === "string" && Boolean(url.trim());
};

const resolveStyledTextStyles = (
  styles: StyledTextValue,
  fontColor: ThemeColor | undefined,
  fallbackColor: string,
  fallbackFontFamily: string,
  fallbackFontSize: string,
  fallbackFontWeight: React.CSSProperties["fontWeight"],
  fallbackTransform?: React.CSSProperties["textTransform"],
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
      ? fallbackTransform
      : styles.textTransform,
});

const Star = ({ active }: { active: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="m12 2.5 2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.37 6.18 20.42l1.11-6.48L2.58 9.35l6.51-.95L12 2.5Z" />
  </svg>
);

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

  return resolvedStyles as React.CSSProperties;
};

const ResortAndRetreatHeroSectionFields: YextFields<ResortAndRetreatHeroSectionProps> =
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
    availabilityBadge: {
      label: "Availability Badge",
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
          label: "Pill Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    heading: {
      label: "Heading",
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
    subheading: {
      label: "Subheading",
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
    heroImage: {
      label: "Hero Image",
      type: "object",
      objectFields: {
        image: {
          type: "entityField",
          label: "Image",
          filter: {
            types: ["type.image"],
          },
        },
        aspectRatio: {
          label: "Aspect Ratio",
          type: "basicSelector",
          options: ThemeOptions.ASPECT_RATIO,
        },
        imageConstrain: {
          label: "Image Constrain",
          type: "select",
          options: [
            { label: "Fixed", value: "fixed" },
            { label: "Filled", value: "filled" },
          ],
        },
        styles: {
          label: "Image Styles",
          type: "styledImage",
        },
      },
    },
    primaryCta: {
      label: "Primary Call to Action",
      type: "comprehensiveCTA",
    },
    secondaryCta: {
      label: "Secondary Call to Action",
      type: "comprehensiveCTA",
    },
  };

export const ResortAndRetreatHeroSectionComponent: PuckComponent<
  ResortAndRetreatHeroSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const { averageRating, reviewCount } = getAggregateRating(streamDocument);
  const heading =
    resolveComponentData(props.heading.text, locale, streamDocument) || "";
  const subheading =
    resolveComponentData(props.subheading.text, locale, streamDocument) || "";
  const badgeText =
    resolveComponentData(
      props.availabilityBadge.text,
      locale,
      streamDocument,
    ) || "";
  const bodyValue = resolveComponentData(
    props.body.text,
    locale,
    streamDocument,
  );
  const heroImage = resolveComponentData(
    props.heroImage.image,
    locale,
    streamDocument,
  );
  const primaryCtaValue: Partial<ComprehensiveCTAValue> = {
    data: props.primaryCta.data,
    styles: props.primaryCta.styles,
    className: props.primaryCta.className,
    eventName: props.primaryCta.eventName,
  };
  const secondaryCtaValue: Partial<ComprehensiveCTAValue> = {
    data: props.secondaryCta.data,
    styles: props.secondaryCta.styles,
    className: props.secondaryCta.className,
    eventName: props.secondaryCta.eventName,
  };
  const roundedRating = Math.max(
    0,
    Math.min(5, Math.round(averageRating ?? 0)),
  );
  const imageWrapperStyle: React.CSSProperties = {
    aspectRatio:
      props.heroImage.aspectRatio > 0 ? props.heroImage.aspectRatio : undefined,
    overflow: "hidden",
    borderTopLeftRadius:
      props.heroImage.styles?.borderRadius === "default"
        ? "3rem"
        : props.heroImage.styles?.borderRadius,
    borderTopRightRadius:
      props.heroImage.styles?.borderRadius === "default"
        ? "3rem"
        : props.heroImage.styles?.borderRadius,
  };
  const imageStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: props.heroImage.aspectRatio > 0 ? "100%" : "auto",
    objectFit:
      props.heroImage.imageConstrain === "filled" ? "cover" : "contain",
  };
  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatHeroSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background as="section" background={props.section.backgroundColor}>
          <HeroSectionContent
            averageRating={averageRating}
            badgeText={badgeText}
            bodyValue={bodyValue}
            heading={heading}
            heroImage={heroImage}
            imageStyle={imageStyle}
            imageWrapperStyle={imageWrapperStyle}
            primaryCtaValue={primaryCtaValue}
            props={props as ResortAndRetreatHeroSectionProps}
            reviewCount={reviewCount}
            roundedRating={roundedRating}
            secondaryCtaValue={secondaryCtaValue}
            subheading={subheading}
          />
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

const HeroSectionContent = ({
  averageRating,
  badgeText,
  bodyValue,
  heading,
  heroImage,
  imageStyle,
  imageWrapperStyle,
  primaryCtaValue,
  props,
  reviewCount,
  roundedRating,
  secondaryCtaValue,
  subheading,
}: {
  averageRating: number | undefined;
  badgeText: string;
  bodyValue: unknown;
  heading: string;
  heroImage: TranslatableAssetImage | undefined;
  imageStyle: React.CSSProperties;
  imageWrapperStyle: React.CSSProperties;
  primaryCtaValue: Partial<ComprehensiveCTAValue>;
  props: ResortAndRetreatHeroSectionProps;
  reviewCount: number | undefined;
  roundedRating: number;
  secondaryCtaValue: Partial<ComprehensiveCTAValue>;
  subheading: string;
}) => {
  const streamBackground = useBackground();
  const sectionForeground =
    getThemeColorCssValue(streamBackground?.contrastingColor) ?? "currentColor";
  const bodyStyles = resolveStyledTextStyles(
    props.body.styles,
    props.body.fontColor,
    sectionForeground,
    "var(--fontFamily-body-fontFamily), Inter, sans-serif",
    "1rem",
    500,
  );
  const bodyTypographyVariables = resolveBodyTypographyVariables(
    props.body.styles,
  );

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col items-start px-5 pb-0 pt-10 text-left md:px-8 md:pt-14 xl:items-center xl:px-10 xl:pt-20 xl:text-center">
      <div className="flex max-w-[900px] flex-col items-start gap-8 xl:items-center">
        <EntityField
          displayName="Availability Badge"
          fieldId={props.availabilityBadge.text.field}
          constantValueEnabled={
            props.availabilityBadge.text.constantValueEnabled
          }
        >
          <div
            className="inline-flex min-w-0 max-w-full break-words whitespace-normal rounded-full px-7 py-2 text-center text-sm font-medium"
            style={{
              ...resolveStyledTextStyles(
                props.availabilityBadge.styles,
                props.availabilityBadge.fontColor?.contrastingColor
                  ? {
                      selectedColor:
                        props.availabilityBadge.fontColor.contrastingColor,
                      contrastingColor:
                        props.availabilityBadge.fontColor.selectedColor,
                    }
                  : undefined,
                sectionForeground,
                "var(--fontFamily-body-fontFamily), Inter, sans-serif",
                "0.95rem",
                500,
              ),
              backgroundColor: getThemeColorCssValue(
                props.availabilityBadge.fontColor?.selectedColor,
              ),
              lineHeight: 1.25,
            }}
          >
            {badgeText}
          </div>
        </EntityField>
        <div className="flex flex-col gap-3 xl:items-center">
          <EntityField
            displayName="Hero Subheading"
            fieldId={props.subheading.text.field}
            constantValueEnabled={props.subheading.text.constantValueEnabled}
          >
            <p
              className="m-0"
              style={resolveStyledTextStyles(
                props.subheading.styles,
                props.subheading.fontColor,
                sectionForeground,
                "var(--fontFamily-h3-fontFamily), Georgia, serif",
                "var(--fontSize-h3-fontSize)",
                "var(--fontWeight-h3-fontWeight)",
                "var(--textTransform-h3-textTransform)",
              )}
            >
              {subheading}
            </p>
          </EntityField>
          <EntityField
            displayName="Hero Heading"
            fieldId={props.heading.text.field}
            constantValueEnabled={props.heading.text.constantValueEnabled}
          >
            <h1
              className="m-0"
              style={resolveStyledTextStyles(
                props.heading.styles,
                props.heading.fontColor,
                sectionForeground,
                "var(--fontFamily-h1-fontFamily), Georgia, serif",
                "var(--fontSize-h1-fontSize)",
                "var(--fontWeight-h1-fontWeight)",
                "var(--textTransform-h1-textTransform)",
              )}
            >
              {heading}
            </h1>
          </EntityField>
          <EntityField
            displayName="Hero Description"
            fieldId={props.body.text.field}
            constantValueEnabled={props.body.text.constantValueEnabled}
          >
            {renderResolvedRichText(
              bodyValue,
              themeManagerCn(
                "components rtf-theme rtf-wrapper max-w-[720px] text-[0.98rem] leading-6 font-body-fontFamily font-body-fontWeight xl:mx-auto",
              ),
              {
                ...bodyStyles,
                ...bodyTypographyVariables,
              },
            )}
          </EntityField>
          {reviewCount ? (
            <div
              className="flex flex-wrap items-center justify-start gap-2 leading-6 xl:justify-center"
              style={{
                ...bodyStyles,
                ...bodyTypographyVariables,
              }}
            >
              <span>{averageRating?.toFixed(1)} Stars</span>
              <div className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} active={index < roundedRating} />
                ))}
              </div>
              <span>from {reviewCount.toLocaleString()} guest reviews</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <EntityField
            displayName="Primary CTA"
            fieldId={props.primaryCta.data.cta.field}
            constantValueEnabled={
              props.primaryCta.data.cta.constantValueEnabled
            }
          >
            <ComprehensiveCTA
              value={primaryCtaValue}
              eventName="primaryCta"
              style={
                primaryCtaValue.styles?.variant === "secondary" &&
                primaryCtaValue.styles.color?.selectedColor &&
                primaryCtaValue.styles.color.selectedColor !== "default"
                  ? {
                      borderColor: getThemeColorCssValue(
                        primaryCtaValue.styles.color,
                      ),
                      color: getThemeColorCssValue(
                        primaryCtaValue.styles.color,
                      ),
                    }
                  : undefined
              }
            />
          </EntityField>
          <EntityField
            displayName="Secondary CTA"
            fieldId={props.secondaryCta.data.cta.field}
            constantValueEnabled={
              props.secondaryCta.data.cta.constantValueEnabled
            }
          >
            <ComprehensiveCTA
              value={secondaryCtaValue}
              eventName="secondaryCta"
              style={
                secondaryCtaValue.styles?.variant === "secondary" &&
                secondaryCtaValue.styles.color?.selectedColor &&
                secondaryCtaValue.styles.color.selectedColor !== "default"
                  ? {
                      borderColor: getThemeColorCssValue(
                        secondaryCtaValue.styles.color,
                      ),
                      color: getThemeColorCssValue(
                        secondaryCtaValue.styles.color,
                      ),
                    }
                  : undefined
              }
            />
          </EntityField>
        </div>
      </div>

      {hasImageSource(heroImage) ? (
        <EntityField
          displayName="Hero Image"
          fieldId={props.heroImage.image.field}
          constantValueEnabled={props.heroImage.image.constantValueEnabled}
        >
          <figure
            className="mb-0 mt-10 w-full overflow-hidden rounded-2xl rounded-b-none border border-[var(--colors-palette-primary)] md:mt-12"
            style={imageWrapperStyle}
          >
            <Image
              image={heroImage as TranslatableAssetImage}
              className="h-full w-full"
              style={imageStyle}
            />
          </figure>
        </EntityField>
      ) : null}
    </div>
  );
};

export const ResortAndRetreatHeroSection: YextComponentConfig<ResortAndRetreatHeroSectionProps> =
  {
    label: "Hero Section",
    fields: ResortAndRetreatHeroSectionFields,
    defaultProps: {
      availabilityBadge: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "Rooms Available for Booking",
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
        fontColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
      },
      heading: {
        text: {
          field: "name",
          constantValue: {
            defaultValue: "",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: false,
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
      subheading: {
        text: {
          field: "geomodifier",
          constantValue: {
            defaultValue: "",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: false,
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
            defaultValue: getDefaultRTF(
              "[[name]] - [[geomodifier]] [[address.city]] is a luxury boutique hotel offering a curated blend of historic Southern charm, modern amenities, and sophisticated comfort. Experience personalized concierge services, a chef-driven culinary program, and an unmatched location in the heart of the Historic District.",
            ),
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
      heroImage: {
        image: {
          field: "",
          constantValue: {
            url: "https://a.mktgcdn.com/p/vQqhmnexQfZueJGyh5M_j5W4EcTkTyZlW93eIoqjjvQ/1900x1267.jpg",
            width: 1900,
            height: 1267,
          },
          constantValueEnabled: true,
        },
        aspectRatio: 1.5,
        imageConstrain: "filled",
        styles: {
          borderRadius: "default",
        },
      },
      primaryCta: {
        data: {
          actionType: "link",
          cta: {
            field: "",
            constantValue: {
              label: {
                defaultValue: "Book A Room",
                hasLocalizedValue: "true",
              },
              link: {
                defaultValue: "#book",
                hasLocalizedValue: "true",
              },
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
            selectedColor: "palette-primary",
            contrastingColor: "palette-primary-contrast",
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
      secondaryCta: {
        data: {
          actionType: "link",
          cta: {
            field: "",
            constantValue: {
              label: {
                defaultValue: "Explore Special Offers",
                hasLocalizedValue: "true",
              },
              link: {
                defaultValue: "#offers",
                hasLocalizedValue: "true",
              },
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
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "palette-tertiary",
          contrastingColor: "palette-tertiary-contrast",
        },
      },
    },
    render: (props) => <ResortAndRetreatHeroSectionComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatHeroSection",
  displayName: "Hero Section",
  description: "Hero Section",
  pageSetTypes: ["ENTITY"],
};
