import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider, useAnalytics } from "@yext/pages-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  type ComprehensiveCTAValue,
  type RichText,
  type StyledTextValue,
  type StreamDocument,
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

type SharedTextStylesProps = {
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type SharedCardAction = Pick<
  ComprehensiveCTAValue,
  "data" | "styles" | "className" | "eventName"
>;

type RichTextStyleOverrides = NonNullable<
  React.ComponentProps<typeof MaybeRTF>["richTextStyleOverrides"]
>;
type AccommodationCardItem = {
  title: YextEntityField<TranslatableString>;
  description: YextEntityField<TranslatableRichText>;
  image: YextEntityField<TranslatableAssetImage>;
  ctaLabel: YextEntityField<TranslatableString>;
  ctaLink: YextEntityField<TranslatableString>;
};

type AccommodationCardRenderItem = {
  title?: TranslatableString;
  description?: TranslatableRichText;
  image?: TranslatableAssetImage;
  ctaLabel?: TranslatableString;
  ctaLink?: TranslatableString;
};

export type ResortAndRetreatAccommodationsSectionProps = {
  title: StyledTextProps;
  description: StyledRtfProps;
  cardTitle: SharedTextStylesProps;
  cardDescription: SharedTextStylesProps;
  cardAction: SharedCardAction;
  entries: typeof accommodationCardSource.value;
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
  richTextStyleOverrides: RichTextStyleOverrides,
) => {
  if (React.isValidElement(value)) {
    return value;
  }

  if (typeof value === "string") {
    return (
      <MaybeRTF
        data={value}
        className={className}
        richTextStyleOverrides={richTextStyleOverrides}
      />
    );
  }

  if (isRichTextValue(value)) {
    return (
      <MaybeRTF
        data={value}
        className={className}
        richTextStyleOverrides={richTextStyleOverrides}
      />
    );
  }

  return null;
};

const isRichTextValue = (value: unknown): value is RichText =>
  (() => {
    if (!value || typeof value !== "object") {
      return false;
    }

    return (
      ("html" in value && typeof value.html === "string") ||
      ("json" in value && typeof value.json === "string")
    );
  })();

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

const createStyledRtfDefault = (defaultValue: string): StyledRtfProps => ({
  text: {
    field: "",
    constantValue: {
      defaultValue: getDefaultRTF(defaultValue),
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
});

const createStringFieldDefault = (
  defaultValue: string,
): YextEntityField<TranslatableString> => ({
  field: "",
  constantValue: {
    defaultValue,
    hasLocalizedValue: "true",
  },
  constantValueEnabled: true,
});

const createRichTextFieldDefault = (
  defaultValue: string,
): YextEntityField<TranslatableRichText> => ({
  field: "",
  constantValue: {
    defaultValue: getDefaultRTF(defaultValue),
    hasLocalizedValue: "true",
  },
  constantValueEnabled: true,
});

const createImageFieldDefault = (
  url: string,
  width: number,
  height: number,
): YextEntityField<TranslatableAssetImage> => ({
  field: "",
  constantValue: {
    url,
    width,
    height,
  },
  constantValueEnabled: true,
});

function createAccommodationCta(): ComprehensiveCTAValue {
  return {
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
  };
}

const createSharedTextStylesDefault = (): SharedTextStylesProps => ({
  styles: {
    fontFamily: "default",
    fontSize: "default",
    fontWeight: "default",
    fontStyle: "default",
    textTransform: "default",
  },
  fontColor: undefined,
});

const defaultAccommodationCta = createAccommodationCta();

const defaultAccommodationEntries: AccommodationCardItem[] = [
  {
    title: createStringFieldDefault("Deluxe King Room"),
    description: createRichTextFieldDefault(
      "A spacious, light-filled room featuring a plush king-size bed, a dedicated workspace, and a spa-inspired marble bathroom.",
    ),
    image: createImageFieldDefault(
      "https://a.mktgcdn.com/p/fbSbItkZpsHpkc8qHH7GxvQkWzxsfm6mGc0k4Lmfl-A/1267x1900.jpg",
      1267,
      1900,
    ),
    ctaLabel: createStringFieldDefault("Check Availability"),
    ctaLink: createStringFieldDefault("#book"),
  },
  {
    title: createStringFieldDefault("Executive Double Queen"),
    description: createRichTextFieldDefault(
      "Perfect for families or small groups, offering two queen-size beds, a comfortable seating area, and luxury bath amenities.",
    ),
    image: createImageFieldDefault(
      "https://a.mktgcdn.com/p/Qdlacb36DqN5Lt3q6V9jw-qSMmbPyl_AeMEI_CyDkHc/1267x1900.jpg",
      1267,
      1900,
    ),
    ctaLabel: createStringFieldDefault("Check Availability"),
    ctaLink: createStringFieldDefault("#book"),
  },
  {
    title: createStringFieldDefault("The [[name]] King Suite"),
    description: createRichTextFieldDefault(
      "Our signature penthouse suite featuring a separate living parlor, a private balcony overlooking the skyline, and a soaking tub.",
    ),
    image: createImageFieldDefault(
      "https://a.mktgcdn.com/p/UHR6VTEvcR-yDMqPSOS7LyK87Qt56EOrmfNbhLQxI08/1267x1900.jpg",
      1267,
      1900,
    ),
    ctaLabel: createStringFieldDefault("Check Availability"),
    ctaLink: createStringFieldDefault("#book"),
  },
];

const accommodationCardSource = createItemSource<AccommodationCardItem>({
  label: "Accommodation Cards",
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
  defaultValues: defaultAccommodationEntries,
});

const defaultSharedTextStyles = createSharedTextStylesDefault();

const resolveSharedTextStyles = (
  value: SharedTextStylesProps | undefined,
): SharedTextStylesProps => ({
  styles: value?.styles ?? defaultSharedTextStyles.styles,
  fontColor: value?.fontColor,
});

const ResortAndRetreatAccommodationsSectionFields: YextFields<ResortAndRetreatAccommodationsSectionProps> =
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
    description: {
      label: "Description",
      type: "object",
      objectFields: {
        text: {
          type: "entityField",
          label: "Text",
          filter: { types: ["type.rich_text_v2"] },
        },
        styles: { label: "Text Styles", type: "styledText" },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    cardTitle: {
      label: "Card Title",
      type: "object",
      objectFields: {
        styles: { label: "Text Styles", type: "styledText" },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    cardDescription: {
      label: "Card Description",
      type: "object",
      objectFields: {
        styles: { label: "Text Styles", type: "styledText" },
        fontColor: {
          label: "Font Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    cardAction: {
      label: "Card Action Styles",
      type: "comprehensiveCTA",
    },
    entries: accommodationCardSource.field,
  };

const AccommodationCardView = ({
  card,
  locale,
  streamDocument,
  cardTitle,
  cardDescription,
  cardAction,
  cardBackgroundColor,
  index,
  borderColor,
}: {
  card: AccommodationCardRenderItem;
  locale: string;
  streamDocument: StreamDocument;
  cardTitle: SharedTextStylesProps;
  cardDescription: SharedTextStylesProps;
  cardAction: SharedCardAction;
  cardBackgroundColor: ThemeColor;
  index: number;
  borderColor: string | undefined;
}) => {
  const resolvedCardTitle = resolveSharedTextStyles(cardTitle);
  const resolvedCardDescription = resolveSharedTextStyles(cardDescription);
  const image = card.image
    ? resolveComponentData(card.image, locale, streamDocument)
    : undefined;
  const title = card.title
    ? (resolveComponentData(card.title, locale, streamDocument) ?? "")
    : "";
  const cardDescriptionRichTextStyleOverrides: RichTextStyleOverrides = {
    ...resolvedCardDescription.styles,
    color:
      getThemeColorCssValue(resolvedCardDescription.fontColor) ??
      getThemeColorCssValue(cardBackgroundColor.contrastingColor) ??
      "currentColor",
  };
  const description = card.description
    ? resolveComponentData(card.description, locale, streamDocument, {
        richTextStyleOverrides: cardDescriptionRichTextStyleOverrides,
      })
    : undefined;
  const ctaLabel = card.ctaLabel
    ? resolveComponentData(card.ctaLabel, locale, streamDocument)
    : "";
  const ctaLink = card.ctaLink
    ? resolveComponentData(card.ctaLink, locale, streamDocument)
    : "#";
  const ctaValue: Partial<ComprehensiveCTAValue> = {
    ...cardAction,
    data: {
      ...defaultAccommodationCta.data,
      ...(cardAction.data ?? {}),
      cta: {
        field: "",
        constantValueEnabled: true,
        constantValue: {
          ctaType: "textAndLink",
          label: {
            defaultValue: ctaLabel || "",
            hasLocalizedValue: "true",
          },
          link: {
            defaultValue: ctaLink || "#",
            hasLocalizedValue: "true",
          },
          linkType: "URL",
        },
        selectedType: "textAndLink",
      },
    },
  };
  const cardStyle = getSurfaceColorStyle(cardBackgroundColor, streamDocument);
  const cardForeground =
    getThemeColorCssValue(cardBackgroundColor.contrastingColor) ??
    "var(--colors-palette-quaternary)";

  return (
    <Background
      as="div"
      className="grid h-full overflow-hidden rounded-2xl border  md:grid-cols-[1fr_1fr]"
      style={{
        ...cardStyle,
        color: cardForeground,
        borderColor,
      }}
      background={cardBackgroundColor}
    >
      <div className="order-2 flex flex-col justify-between gap-6 p-6 md:order-1 md:p-8">
        <div className="flex flex-col gap-3">
          <h3
            className="m-0"
            style={resolveStyledTextStyles(
              resolvedCardTitle.styles,
              resolvedCardTitle.fontColor,
              cardForeground,
              "var(--fontFamily-h4-fontFamily)",
              "var(--fontSize-h4-fontSize)",
              "var(--fontWeight-h4-fontWeight)",
              "var(--textTransform-h4-textTransform)",
            )}
          >
            {title}
          </h3>
          {renderResolvedRichText(
            description,
            "m-0",
            cardDescriptionRichTextStyleOverrides,
          )}
        </div>
        <div>
          <ComprehensiveCTA
            value={ctaValue}
            eventName={`cardCta${index}`}
            style={
              ctaValue.styles?.variant === "secondary" &&
              ctaValue.styles.color?.selectedColor &&
              ctaValue.styles.color.selectedColor !== "default"
                ? {
                    borderColor: getThemeColorCssValue(ctaValue.styles.color),
                    color: getThemeColorCssValue(ctaValue.styles.color),
                  }
                : undefined
            }
          />
        </div>
      </div>
      <div className="order-1 overflow-hidden md:order-2">
        {image ? (
          <Image
            image={image}
            className="h-full w-full"
            style={{
              display: "block",
              height: "100%",
              width: "100%",
              aspectRatio: 1.1,
              objectFit: "cover",
            }}
          />
        ) : null}
      </div>
    </Background>
  );
};

export const ResortAndRetreatAccommodationsSectionComponent: PuckComponent<
  ResortAndRetreatAccommodationsSectionProps
> = (props) => {
  const analytics = useAnalytics();
  const cardsViewportRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const isAutoScrollingRef = React.useRef(false);
  const autoScrollTimeoutRef = React.useRef<number | null>(null);
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const sectionDescriptionRichTextStyleOverrides: RichTextStyleOverrides = {
    ...props.description.styles,
    color:
      getThemeColorCssValue(props.description.fontColor) ??
      getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
      "currentColor",
  };
  const description = resolveComponentData(
    props.description.text,
    locale,
    streamDocument,
    { richTextStyleOverrides: sectionDescriptionRichTextStyleOverrides },
  );
  const entries = accommodationCardSource.resolveItems(
    props.entries,
    streamDocument,
  );
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);
  const sectionStyle = getSurfaceColorStyle(
    props.section.backgroundColor,
    streamDocument,
  );
  const sectionForeground =
    getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
    "currentColor";
  const titleColor =
    getThemeColorCssValue(props.title.fontColor) ??
    "var(--colors-palette-primary)";

  React.useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const viewport = cardsViewportRef.current;
    const activeCard = cardRefs.current[activeCardIndex];
    if (!viewport || !activeCard) {
      return;
    }

    isAutoScrollingRef.current = true;
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current);
    }
    autoScrollTimeoutRef.current = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
      autoScrollTimeoutRef.current = null;
    }, 450);

    viewport.scrollTo({
      left: activeCard.offsetLeft,
      behavior: "smooth",
    });
  }, [activeCardIndex]);

  const updateActiveCardFromScroll = () => {
    const viewport = cardsViewportRef.current;
    if (!viewport || isAutoScrollingRef.current) {
      return;
    }

    const nextIndex = cardRefs.current.reduce((closestIndex, card, index) => {
      if (!card) {
        return closestIndex;
      }

      const currentCard = cardRefs.current[closestIndex];
      if (!currentCard) {
        return index;
      }

      const currentDistance = Math.abs(
        currentCard.offsetLeft - viewport.scrollLeft,
      );
      const nextDistance = Math.abs(card.offsetLeft - viewport.scrollLeft);

      return nextDistance < currentDistance ? index : closestIndex;
    }, 0);

    setActiveCardIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex,
    );
  };

  const scrollCards = (direction: -1 | 1) => {
    if (!entries.length) {
      return;
    }

    setActiveCardIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      return Math.max(0, Math.min(entries.length - 1, nextIndex));
    });
  };

  const moveBackward = () => {
    if (!entries.length) {
      return;
    }

    analytics?.track({
      action: "BACKWARD_PAGINATE",
      eventName: "carouselPrev",
    });
    scrollCards(-1);
  };

  const moveForward = () => {
    if (!entries.length) {
      return;
    }

    analytics?.track({ action: "FORWARD_PAGINATE", eventName: "carouselNext" });
    scrollCards(1);
  };

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatAccommodationsSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          className="border-y border-[var(--colors-palette-primary)]"
          background={props.section.backgroundColor}
          style={sectionStyle}
        >
          <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 md:px-8 xl:px-10">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-[900px]">
                <EntityField
                  displayName="Accommodations Title"
                  fieldId={props.title.text.field}
                  constantValueEnabled={props.title.text.constantValueEnabled}
                >
                  <h2
                    className="m-0"
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
                  displayName="Accommodations Description"
                  fieldId={props.description.text.field}
                  constantValueEnabled={
                    props.description.text.constantValueEnabled
                  }
                >
                  {renderResolvedRichText(
                    description,
                    "mt-4",
                    sectionDescriptionRichTextStyleOverrides,
                  )}
                </EntityField>
              </div>
              <div className="hidden items-center gap-3 xl:flex">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border bg-white "
                  style={{
                    borderColor: titleColor,
                    color: titleColor,
                  }}
                  aria-label="Previous accommodation"
                  onClick={moveBackward}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border bg-white "
                  style={{
                    borderColor: titleColor,
                    color: titleColor,
                  }}
                  aria-label="Next accommodation"
                  onClick={moveForward}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <EntityField
              displayName="Accommodation Cards"
              fieldId={props.entries.field}
              constantValueEnabled={props.entries.constantValueEnabled}
            >
              <div
                ref={cardsViewportRef}
                className="flex items-stretch snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth pb-2 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onScroll={updateActiveCardFromScroll}
              >
                {entries.map((card, cardIndex) => (
                  <div
                    key={`${cardIndex}`}
                    ref={(element) => {
                      cardRefs.current[cardIndex] = element;
                    }}
                    data-accommodation-card
                    className="flex min-w-[88%] snap-start xl:min-w-[65%]"
                  >
                    <AccommodationCardView
                      card={card}
                      locale={locale}
                      streamDocument={streamDocument}
                      cardTitle={props.cardTitle}
                      cardDescription={props.cardDescription}
                      cardAction={{
                        data: props.cardAction.data,
                        styles: props.cardAction.styles,
                        className: props.cardAction.className,
                        eventName: props.cardAction.eventName,
                      }}
                      cardBackgroundColor={props.section.cardBackgroundColor}
                      index={cardIndex}
                      borderColor={getThemeColorCssValue(
                        props.section.cardBorderColor,
                      )}
                    />
                  </div>
                ))}
              </div>
            </EntityField>

            <div className="flex justify-center gap-3 xl:hidden">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--colors-palette-primary)] bg-white text-[var(--colors-palette-primary)]"
                aria-label="Previous accommodation"
                onClick={moveBackward}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--colors-palette-primary)] bg-white text-[var(--colors-palette-primary)]"
                aria-label="Next accommodation"
                onClick={moveForward}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatAccommodationsSection: YextComponentConfig<ResortAndRetreatAccommodationsSectionProps> =
  {
    label: "Accommodations Section",
    fields: ResortAndRetreatAccommodationsSectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "Featured Accommodations",
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
      description: {
        ...createStyledRtfDefault(
          "Explore our beautifully appointed guest rooms and suites, designed with custom furnishings and plush bedding for ultimate relaxation.",
        ),
        fontColor: undefined,
      },
      cardTitle: createSharedTextStylesDefault(),
      cardDescription: createSharedTextStylesDefault(),
      cardAction: defaultAccommodationCta,
      entries: accommodationCardSource.defaultValue,
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
    render: (props) => (
      <ResortAndRetreatAccommodationsSectionComponent {...props} />
    ),
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatAccommodationsSection",
  displayName: "Accommodations Section",
  description: "Accommodations Section",
  pageSetTypes: ["ENTITY"],
};
