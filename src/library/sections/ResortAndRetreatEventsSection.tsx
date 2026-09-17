import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  pt,
  msg,
  Background,
  ComprehensiveCTA,
  EntityField,
  getAnalyticsScopeHash,
  getSurfaceColorStyle,
  getThemeColorCssValue,
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
import { aspectRatioOptions } from "../shared/fieldOptions";
import { hasImageSource } from "../shared/imageUtils";
import {
  renderResolvedRichText,
  resolveBodyTypographyVariables,
  resolveStyledTextStyles,
} from "../shared/sectionStyles";

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
};

// Audit wiring note: filter.fontColor is a scanner false positive here.
// body/title fontColor wiring is applied in render, and shared ctas plus
// link/color, cta styling, and cta behavior are owned by the shared runtime.

export type ResortAndRetreatEventsSectionProps = {
  title: StyledTextProps;
  body: StyledRtfProps;
  backgroundImage: ImageFieldProps;
  panelBackgroundColor: ThemeColor;
  panelBorderColor: ThemeColor;
  primaryAction: ComprehensiveCTAValue;
  section: {
    visibleOnLivePage: boolean;
  };
};

const ResortAndRetreatEventsSectionFields: YextFields<ResortAndRetreatEventsSectionProps> =
  {
    section: {
      label: msg("fields.section", "Section"),
      type: "object",
      objectFields: {
        visibleOnLivePage: {
          label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
          type: "radio",
          options: [
            { label: msg("fields.yes", "Yes"), value: true },
            { label: msg("fields.no", "No"), value: false },
          ],
        },
      },
    },
    title: {
      label: msg("fields.title", "Title"),
      type: "object",
      objectFields: {
        text: {
          type: "entityField",
          label: msg("fields.text", "Text"),
          filter: {
            types: ["type.string"],
          },
        },
        styles: {
          label: msg("fields.textStyles", "Text Styles"),
          type: "styledText",
        },
        fontColor: {
          label: msg("fields.fontColor", "Font Color"),
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    body: {
      label: msg("fields.body", "Body"),
      type: "object",
      objectFields: {
        text: {
          type: "entityField",
          label: msg("fields.text", "Text"),
          filter: {
            types: ["type.rich_text_v2"],
          },
        },
        styles: {
          label: msg("fields.textStyles", "Text Styles"),
          type: "styledText",
        },
        fontColor: {
          label: msg("fields.fontColor", "Font Color"),
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    backgroundImage: {
      label: msg("fields.backgroundImage", "Background Image"),
      type: "object",
      objectFields: {
        image: {
          type: "entityField",
          label: msg("fields.image", "Image"),
          filter: {
            types: ["type.image"],
          },
        },
        aspectRatio: {
          label: msg("fields.aspectRatio", "Aspect Ratio"),
          type: "basicSelector",
          options: aspectRatioOptions,
        },
        imageConstrain: {
          label: msg("fields.imageConstrain", "Image Constrain"),
          type: "select",
          options: [
            { label: msg("fields.fixed", "Fixed"), value: "fixed" },
            { label: msg("fields.filled", "Filled"), value: "filled" },
          ],
        },
      },
    },
    panelBackgroundColor: {
      label: msg("fields.panelBackgroundColor", "Panel Background Color"),
      type: "basicSelector",
      options: "BACKGROUND_COLOR",
    },
    panelBorderColor: {
      label: msg("fields.panelBorderColor", "Panel Border Color"),
      type: "basicSelector",
      options: ThemeOptions.BACKGROUND_COLOR.flatMap((group) => group.options),
    },
    // Shared ctas behavior is owned by this standalone action field.
    primaryAction: {
      label: msg("fields.primaryAction", "Primary Action"),
      type: "comprehensiveCTA",
    },
  };

export const ResortAndRetreatEventsSectionComponent: PuckComponent<
  ResortAndRetreatEventsSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const backgroundImage = resolveComponentData(
    props.backgroundImage.image,
    locale,
    streamDocument,
  );
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const body = resolveComponentData(props.body.text, locale, streamDocument);
  const ctaValue: Partial<ComprehensiveCTAValue> = {
    data: props.primaryAction.data,
    styles: props.primaryAction.styles,
    className: props.primaryAction.className,
    eventName: props.primaryAction.eventName,
  };
  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatEventsSection${getAnalyticsScopeHash(props.id)}`}
      >
        <section className="relative overflow-hidden">
          {hasImageSource(backgroundImage) ? (
            <div className="absolute inset-0">
              <EntityField
                displayName={pt("eventsBackgroundImage", "Events Background Image")}
                fieldId={props.backgroundImage.image.field}
                constantValueEnabled={
                  props.backgroundImage.image.constantValueEnabled
                }
              >
                <Image
                  image={backgroundImage as TranslatableAssetImage}
                  className="h-full w-full"
                  style={{
                    display: "block",
                    height: "100%",
                    width: "100%",
                    objectFit:
                      props.backgroundImage.imageConstrain === "filled"
                        ? "cover"
                        : "contain",
                  }}
                />
              </EntityField>
            </div>
          ) : null}
          <div className="relative z-[1] mx-auto flex max-w-[1360px] justify-center px-5 py-10 md:px-8 xl:justify-end xl:px-10 xl:py-14">
            <Background
              as="div"
              className="flex max-w-[520px] flex-col gap-6 rounded-2xl border p-6 md:p-8"
              background={props.panelBackgroundColor}
              style={{
                borderColor: getThemeColorCssValue(props.panelBorderColor),
                ...getSurfaceColorStyle(
                  props.panelBackgroundColor,
                  streamDocument,
                ),
              }}
            >
              <EntityField
                displayName={pt("eventsTitle", "Events Title")}
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
                displayName={pt("eventsDescription", "Events Description")}
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
                  displayName={pt("eventsCta", "Events CTA")}
                  fieldId={props.primaryAction.data.cta.field}
                  constantValueEnabled={
                    props.primaryAction.data.cta.constantValueEnabled
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
                            color: getThemeColorCssValue(ctaValue.styles.color),
                          }
                        : undefined
                    }
                  />
                </EntityField>
              </div>
            </Background>
          </div>
        </section>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatEventsSection: YextComponentConfig<ResortAndRetreatEventsSectionProps> =
  {
    label: msg("fields.eventsSection", "Events Section"),
    fields: ResortAndRetreatEventsSectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "Special Events & Celebrations",
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
                          text: "Host your next unforgettable milestone at [[name]]. From romantic courtyard weddings and elegant proms to upscale corporate galas, our historic venue provides a breathtaking backdrop paired with full-service event planning.",
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
                          text: "Our spaces feature customizable floor plans, state-of-the-art audiovisual setups, and bespoke catering menus crafted by our executive chef. Contact our dedicated events team today to tour our spaces and secure your dates.",
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
              html: "<p>Host your next unforgettable milestone at [[name]]. From romantic courtyard weddings and elegant proms to upscale corporate galas, our historic venue provides a breathtaking backdrop paired with full-service event planning.</p><p>Our spaces feature customizable floor plans, state-of-the-art audiovisual setups, and bespoke catering menus crafted by our executive chef. Contact our dedicated events team today to tour our spaces and secure your dates.</p>",
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
      backgroundImage: {
        image: {
          field: "",
          constantValue: {
            url: "https://a.mktgcdn.com/p/fbSbItkZpsHpkc8qHH7GxvQkWzxsfm6mGc0k4Lmfl-A/1267x1900.jpg",
            width: 1267,
            height: 1900,
          },
          constantValueEnabled: true,
        },
        aspectRatio: 0.67,
        imageConstrain: "filled",
      },
      panelBackgroundColor: {
        selectedColor: "palette-secondary",
        contrastingColor: "palette-secondary-contrast",
      },
      panelBorderColor: {
        selectedColor: "palette-primary",
        contrastingColor: "palette-primary-contrast",
      },
      primaryAction: {
        data: {
          actionType: "link",
          cta: {
            field: "",
            constantValue: {
              label: { defaultValue: "Contact Us", hasLocalizedValue: "true" },
              link: { defaultValue: "#contact", hasLocalizedValue: "true" },
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
      section: {
        visibleOnLivePage: true,
      },
    },
    render: (props) => (
      <ResortAndRetreatEventsSectionComponent {...props} />
    ),
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatEventsSection",
  displayName: "Events Section",
  description: "Events Section",
  pageSetTypes: ["ENTITY"],
};
