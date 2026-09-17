import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider, useAnalytics } from "@yext/pages-components";
import { ChevronDown } from "lucide-react";
import {
  pt,
  msg,
  getAnalyticsScopeHash,
  getDefaultRTF,
  createItemSource,
  EntityField,
  resolveComponentData,
  themeManagerCn,
  type StyledTextValue,
  type StreamDocument,
  type ThemeColor,
  type TranslatableRichText,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  useDocument,
  VisibilityWrapper,
  Background,
  getThemeColorCssValue,
  useBackground,
} from "@yext/visual-editor";
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

type CardTextStyleProps = {
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type FaqItemDataProps = {
  question: YextEntityField<TranslatableString>;
  answer: YextEntityField<TranslatableRichText>;
};

// Audit wiring note: answer.fontColor and style.fontColor are applied through
// resolveStyledTextStyles in the expanded answer render path below.

const faqItemSource = createItemSource<FaqItemDataProps>({
  label: msg("fields.faqItems", "FAQ Items"),
  mappingFields: {
    question: {
      type: "entityField",
      label: msg("fields.question", "Question"),
      filter: { types: ["type.string"] },
    },
    answer: {
      type: "entityField",
      label: msg("fields.answer", "Answer"),
      filter: { types: ["type.rich_text_v2"] },
    },
  },
  defaultValues: [
    {
      question: {
        field: "",
        constantValue: {
          defaultValue: "What is the cancellation policy at [[name]]?",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      answer: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "We offer free cancellation up to 48 hours prior to your scheduled arrival date for all direct bookings made through our website or reservation desk.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
    {
      question: {
        field: "",
        constantValue: {
          defaultValue: "Is parking available on-site, and what is the cost?",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      answer: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "Valet parking is available 24 hours a day for a nightly fee. Self-parking options may be available nearby; contact the front desk for current rates and availability.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
    {
      question: {
        field: "",
        constantValue: {
          defaultValue: "Does [[name]] allow pets?",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      answer: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "We welcome well-behaved dogs in select pet-friendly rooms. Advance reservations are required and a pet fee applies per stay.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
    {
      question: {
        field: "",
        constantValue: {
          defaultValue: "Do you offer an airport shuttle?",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      answer: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "Complimentary airport shuttle service is not provided. Our concierge team can arrange private car service or rideshare pickup upon request.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
    {
      question: {
        field: "",
        constantValue: {
          defaultValue: "Can I request an early check-in or late check-out?",
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
      answer: {
        field: "",
        constantValue: {
          defaultValue: getDefaultRTF(
            "Early check-in and late check-out are subject to availability. Contact us before arrival and we will do our best to accommodate your schedule.",
          ),
          hasLocalizedValue: "true",
        },
        constantValueEnabled: true,
      },
    },
  ],
});

export type ResortAndRetreatFaqSectionProps = {
  title: StyledTextProps;
  items: typeof faqItemSource.value;
  questionStyles: CardTextStyleProps;
  answerStyles: CardTextStyleProps;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    dividerColor: ThemeColor;
  };
};

const resolveSurfaceForegroundCssValue = (color?: ThemeColor | string) => {
  if (!color) {
    return undefined;
  }

  if (isDarkBackground(color)) {
    return "#FFFFFF";
  }

  return typeof color === "string"
    ? getThemeColorCssValue(color)
    : getThemeColorCssValue(color.contrastingColor as unknown as ThemeColor);
};

const isDarkBackground = (color?: ThemeColor | string) => {
  if (!color) {
    return false;
  }

  if (typeof color === "string") {
    if (color === "white") {
      return false;
    }

    if (color.endsWith("-light")) {
      return false;
    }

    if (color.endsWith("-dark") || color === "black") {
      return true;
    }

    return color.startsWith("palette-");
  }

  if (color.isDarkColor !== undefined) {
    return color.isDarkColor;
  }

  const token = color.selectedColor;
  if (!token || token === "default" || token === "white") {
    return false;
  }

  if (token.endsWith("-light")) {
    return false;
  }

  if (token.endsWith("-dark") || token === "black") {
    return true;
  }

  return color.contrastingColor === "white";
};

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
    styles: { label: msg("fields.textStyles", "Text Styles"), type: "styledText" as const },
    fontColor: {
      label: msg("fields.fontColor", "Font Color"),
      type: "basicSelector" as const,
      options: "SITE_COLOR" as const,
    },
  },
});

const ResortAndRetreatFaqSectionFields: YextFields<ResortAndRetreatFaqSectionProps> =
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
        backgroundColor: {
          label: msg("fields.backgroundColor", "Background Color"),
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
        dividerColor: {
          label: msg("fields.dividerColor", "Divider Color"),
          type: "basicSelector",
          options: "SITE_COLOR",
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
    items: faqItemSource.field,
    questionStyles: createCardTextStyleField("Question Styles"),
    answerStyles: createCardTextStyleField("Answer Styles"),
  };

export const ResortAndRetreatFaqSectionComponent: PuckComponent<
  ResortAndRetreatFaqSectionProps
> = (props) => {
  const analytics = useAnalytics();
  const [openIndex, setOpenIndex] = React.useState(0);
  const streamDocument = useDocument<StreamDocument>();
  const locale = streamDocument?.locale ?? "en";
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatFaqSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background as="section" background={props.section.backgroundColor}>
          <ResortAndRetreatFaqSectionContent
            analytics={analytics}
            locale={locale}
            openIndex={openIndex}
            props={props}
            setOpenIndex={setOpenIndex}
            streamDocument={streamDocument}
            title={title}
          />
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

const ResortAndRetreatFaqSectionContent = ({
  analytics,
  locale,
  openIndex,
  props,
  setOpenIndex,
  streamDocument,
  title,
}: {
  analytics: ReturnType<typeof useAnalytics>;
  locale: string;
  openIndex: number;
  props: ResortAndRetreatFaqSectionProps;
  setOpenIndex: React.Dispatch<React.SetStateAction<number>>;
  streamDocument: StreamDocument;
  title: string;
}) => {
  const sectionBackground = useBackground();
  const sectionForeground =
    resolveSurfaceForegroundCssValue(sectionBackground) ??
    "var(--colors-palette-quaternary)";
  const dividerColor =
    getThemeColorCssValue(props.section.dividerColor) ?? sectionForeground;

  return (
    <section
      style={{
        borderTop: `1px solid ${dividerColor}`,
        borderBottom: `1px solid ${dividerColor}`,
      }}
    >
      <div className="mx-auto flex max-w-[900px] flex-col gap-8 px-5 py-10 md:px-8">
        <EntityField
          displayName={pt("faqTitle", "FAQ Title")}
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
          displayName={pt("faqItems", "FAQ Items")}
          fieldId={props.items.field}
          constantValueEnabled={props.items.constantValueEnabled}
        >
          <div className="flex flex-col gap-6">
            {faqItemSource
              .resolveItems(props.items, streamDocument)
              .map((item, index) => {
                const isOpen = index === openIndex;
                const question = item.question
                  ? resolveComponentData(item.question, locale, streamDocument)
                  : "";
                const answer = item.answer
                  ? resolveComponentData(item.answer, locale, streamDocument)
                  : undefined;

                return (
                  <div
                    key={`${question}-${index}`}
                    className="border-b  pb-4"
                    style={{
                      borderColor: dividerColor,
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() => {
                        const nextOpen = isOpen ? -1 : index;
                        setOpenIndex(nextOpen);
                        analytics?.track({
                          action: nextOpen === index ? "EXPAND" : "COLLAPSE",
                          eventName: `faqToggle${index}`,
                        });
                      }}
                    >
                      <span
                        style={resolveStyledTextStyles(
                          props.questionStyles.styles,
                          props.questionStyles.fontColor,
                          sectionForeground,
                          "var(--fontFamily-h4-fontFamily)",
                          "var(--fontSize-h4-fontSize)",
                          "var(--fontWeight-h4-fontWeight)",
                          "var(--textTransform-h4-textTransform)",
                        )}
                      >
                        {question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen
                      ? renderResolvedRichText(
                          answer,
                          themeManagerCn(
                            "components rtf-theme rtf-wrapper pt-4 font-body-fontFamily font-body-fontWeight",
                          ),
                          {
                            ...resolveStyledTextStyles(
                              props.answerStyles.styles,
                              props.answerStyles.fontColor,
                              sectionForeground,
                              "var(--fontFamily-body-fontFamily)",
                              "1rem",
                              "var(--fontWeight-body-fontWeight)",
                            ),
                            ...resolveBodyTypographyVariables(
                              props.answerStyles.styles,
                            ),
                          },
                        )
                      : null}
                  </div>
                );
              })}
          </div>
        </EntityField>
      </div>
    </section>
  );
};

export const ResortAndRetreatFaqSection: YextComponentConfig<ResortAndRetreatFaqSectionProps> =
  {
    label: msg("fields.faqSection", "Faq Section"),
    fields: ResortAndRetreatFaqSectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "Frequently Asked Questions",
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
      items: faqItemSource.defaultValue,
      questionStyles: createCardTextStyleDefault(),
      answerStyles: createCardTextStyleDefault(),
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
        dividerColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
      },
    },
    render: (props) => <ResortAndRetreatFaqSectionComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatFaqSection",
  displayName: "Faq Section",
  description: "Faq Section",
  pageSetTypes: ["ENTITY"],
};
