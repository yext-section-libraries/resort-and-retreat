import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  Background,
  EntityField,
  getAggregateRating,
  getAnalyticsScopeHash,
  getSurfaceColorStyle,
  getThemeColorCssValue,
  resolveComponentData,
  ThemeOptions,
  type StyledTextValue,
  type ThemeColor,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  useDocument,
  useBackground,
  VisibilityWrapper,
} from "@yext/visual-editor";

type StyledTextProps = {
  text: YextEntityField<TranslatableString>;
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type SharedTextStyleProps = {
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type ReviewComment = {
  content?: string;
  commentDate?: string;
};

type ReviewItem = {
  authorName?: string;
  rating?: number;
  content?: string;
  reviewDate?: string;
  comments?: ReviewComment[];
};

type ReviewAggregate = {
  publisher?: string;
  topReviews?: ReviewItem[];
};

type StreamDocumentWithReviews = {
  locale?: string;
  ref_reviewsAgg?: ReviewAggregate[];
};

export type ResortAndRetreatReviewsSectionProps = {
  title: StyledTextProps;
  styles: {
    averageRatingText: SharedTextStyleProps;
    reviewTitle: SharedTextStyleProps;
    reviewDate: SharedTextStyleProps;
    reviewText: SharedTextStyleProps;
    stars: SharedTextStyleProps;
  };
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    cardBackgroundColor: ThemeColor;
    cardBorderColor: ThemeColor;
  };
};

const defaultSharedTextStyles: SharedTextStyleProps = {
  styles: {
    fontFamily: "default",
    fontSize: "default",
    fontWeight: "default",
    fontStyle: "default",
    textTransform: "default",
  },
  fontColor: undefined,
};

const resolveSharedTextStyle = (
  value?: SharedTextStyleProps,
): SharedTextStyleProps => ({
  styles: value?.styles ?? defaultSharedTextStyles.styles,
  fontColor: value?.fontColor,
});

const resolveReviewSectionStyles = (
  value?: ResortAndRetreatReviewsSectionProps["styles"],
) => ({
  averageRatingText: resolveSharedTextStyle(value?.averageRatingText),
  reviewTitle: resolveSharedTextStyle(value?.reviewTitle),
  reviewDate: resolveSharedTextStyle(value?.reviewDate),
  reviewText: resolveSharedTextStyle(value?.reviewText),
  stars: resolveSharedTextStyle(value?.stars),
});

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

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

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

const ResortAndRetreatReviewsSectionFields: YextFields<ResortAndRetreatReviewsSectionProps> =
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
    styles: {
      label: "Styles",
      type: "object",
      objectFields: {
        averageRatingText: {
          label: "Average Rating Text",
          type: "object",
          objectFields: {
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
        reviewTitle: {
          label: "Review Title",
          type: "object",
          objectFields: {
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
        reviewDate: {
          label: "Review Date",
          type: "object",
          objectFields: {
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
        reviewText: {
          label: "Review Text",
          type: "object",
          objectFields: {
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
        stars: {
          label: "Stars",
          type: "object",
          objectFields: {
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
      },
    },
  };

export const ResortAndRetreatReviewsSectionComponent: PuckComponent<
  ResortAndRetreatReviewsSectionProps
> = (props) => {
  const streamDocument = useDocument<StreamDocumentWithReviews>();
  const locale = streamDocument.locale ?? "en";
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const { averageRating, reviewCount } = getAggregateRating(streamDocument);
  const firstPartyAggregate = streamDocument.ref_reviewsAgg?.find(
    (aggregate) => aggregate.publisher === "FIRSTPARTY",
  );
  const reviews = firstPartyAggregate?.topReviews ?? [];

  if (!reviews.length) {
    if (props.puck.isEditing) {
      return (
        <section className="px-5 py-10 text-center">
          No first-party reviews found for this location.
        </section>
      );
    }

    return <></>;
  }

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatReviewsSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          background={props.section.backgroundColor}
          style={getSurfaceColorStyle(
            props.section.backgroundColor,
            streamDocument,
          )}
        >
          <ReviewsSectionContent
            averageRating={averageRating}
            props={props}
            reviewCount={reviewCount}
            reviews={reviews}
            title={title}
          />
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

const ReviewsSectionContent = ({
  averageRating,
  props,
  reviewCount,
  reviews,
  title,
}: {
  averageRating: number | undefined;
  props: ResortAndRetreatReviewsSectionProps;
  reviewCount: number | undefined;
  reviews: ReviewItem[];
  title: string;
}) => {
  const sectionBackground = useBackground();
  const streamDocument = useDocument();
  const sectionForeground =
    getThemeColorCssValue(sectionBackground?.contrastingColor) ??
    "currentColor";
  const cardBackgroundStyle = getSurfaceColorStyle(
    props.section.cardBackgroundColor,
    streamDocument,
  );
  const cardForeground =
    getThemeColorCssValue(props.section.cardBackgroundColor.contrastingColor) ??
    sectionForeground;
  const styles = resolveReviewSectionStyles(props.styles);
  const reviewTitleColor = getThemeColorCssValue(styles.reviewTitle.fontColor);
  const reviewDateColor = getThemeColorCssValue(styles.reviewDate.fontColor);
  const reviewTextColor = getThemeColorCssValue(styles.reviewText.fontColor);
  const starsColor = getThemeColorCssValue(styles.stars.fontColor);
  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 md:px-8 xl:px-10">
      <div className="flex flex-col gap-2 xl:items-center xl:text-center">
        <EntityField
          displayName="Reviews Title"
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
        {typeof averageRating === "number" && reviewCount ? (
          <p
            className="m-0"
            style={resolveStyledTextStyles(
              styles.averageRatingText.styles,
              styles.averageRatingText.fontColor,
              sectionForeground,
              "var(--fontFamily-body-fontFamily)",
              "0.875rem",
              "var(--fontWeight-body-fontWeight)",
            )}
          >
            {averageRating.toFixed(1)} average rating from {reviewCount} reviews
          </p>
        ) : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {reviews.slice(0, 3).map((review, index) => {
          const rating = Math.max(
            0,
            Math.min(5, Math.round(review.rating ?? 0)),
          );
          return (
            <article
              key={`${review.authorName ?? "review"}-${index}`}
              className="flex flex-col gap-5 rounded-2xl border p-6"
              style={{
                ...cardBackgroundStyle,
                color: cardForeground,
                borderColor: getThemeColorCssValue(
                  props.section.cardBorderColor,
                ),
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    className="m-0"
                    style={{
                      ...resolveStyledTextStyles(
                        styles.reviewTitle.styles,
                        styles.reviewTitle.fontColor,
                        cardForeground,
                        "var(--fontFamily-h4-fontFamily)",
                        "var(--fontSize-h4-fontSize)",
                        "var(--fontWeight-h4-fontWeight)",
                        "var(--textTransform-h4-textTransform)",
                      ),
                      color: reviewTitleColor ?? cardForeground,
                    }}
                  >
                    {review.authorName || "Guest"}
                  </p>
                  {review.reviewDate ? (
                    <p
                      className="m-0"
                      style={{
                        ...resolveStyledTextStyles(
                          styles.reviewDate.styles,
                          styles.reviewDate.fontColor,
                          cardForeground,
                          "var(--fontFamily-body-fontFamily)",
                          "0.875rem",
                          "var(--fontWeight-body-fontWeight)",
                        ),
                        color: reviewDateColor ?? cardForeground,
                      }}
                    >
                      {formatDate(review.reviewDate)}
                    </p>
                  ) : null}
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{
                    ...resolveStyledTextStyles(
                      styles.stars.styles,
                      styles.stars.fontColor,
                      cardForeground,
                      "var(--fontFamily-body-fontFamily)",
                      "1rem",
                      500,
                    ),
                    color: starsColor ?? cardForeground,
                  }}
                >
                  <span>
                    {(review.rating ?? averageRating ?? 0).toFixed(1)} Stars
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} active={starIndex < rating} />
                    ))}
                  </div>
                </div>
              </div>
              {review.content ? (
                <p
                  className="m-0 leading-6"
                  style={{
                    ...resolveStyledTextStyles(
                      styles.reviewText.styles,
                      styles.reviewText.fontColor,
                      cardForeground,
                      "var(--fontFamily-body-fontFamily)",
                      "1rem",
                      "var(--fontWeight-body-fontWeight)",
                    ),
                    color: reviewTextColor ?? cardForeground,
                  }}
                >
                  {review.content}
                </p>
              ) : null}
              {review.comments?.[0]?.content ? (
                <div
                  className="border-t pt-4 text-sm opacity-80"
                  style={{ borderColor: cardForeground, color: cardForeground }}
                >
                  <p className="m-0 font-medium">Response</p>
                  <p className="m-0 mt-2">{review.comments[0].content}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export const ResortAndRetreatReviewsSection: YextComponentConfig<ResortAndRetreatReviewsSectionProps> =
  {
    label: "Reviews Section",
    fields: ResortAndRetreatReviewsSectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "What Guests Are Saying",
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
      styles: {
        averageRatingText: defaultSharedTextStyles,
        reviewTitle: defaultSharedTextStyles,
        reviewDate: defaultSharedTextStyles,
        reviewText: defaultSharedTextStyles,
        stars: {
          ...defaultSharedTextStyles,
          fontColor: undefined,
        },
      },
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
      <ResortAndRetreatReviewsSectionComponent {...props} />
    ),
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatReviewsSection",
  displayName: "Reviews Section",
  description: "Reviews Section",
  pageSetTypes: ["ENTITY"],
};
