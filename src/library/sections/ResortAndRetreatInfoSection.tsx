import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import {
  Address,
  AnalyticsScopeProvider,
  HoursTable,
  Link,
  type AddressType,
  type DayOfWeekNames,
  type HoursType,
} from "@yext/pages-components";
import {
  Background,
  ComprehensiveCTA,
  EntityField,
  getAnalyticsScopeHash,
  getDefaultRTF,
  getThemeColorCssValue,
  MaybeRTF,
  resolveComponentData,
  type ComprehensiveCTAValue,
  type StyledTextValue,
  type ThemeColor,
  ThemeOptions,
  type TranslatableRichText,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  useBackground,
  useDocument,
  VisibilityWrapper,
} from "@yext/visual-editor";
import { parsePhoneNumber } from "awesome-phonenumber";

type PhoneItemProps = {
  number: YextEntityField<string>;
  label?: YextEntityField<TranslatableString>;
};

type PhoneFieldProps = {
  items: PhoneItemProps[];
  phoneFormat: "international" | "domestic";
  includeHyperlink?: boolean;
};

type HoursStyles = {
  startOfWeek: keyof DayOfWeekNames | "today";
  collapseDays: boolean;
  showAdditionalHoursText: boolean;
  alignment: "items-start" | "items-center" | "items-end";
};

type SharedTextStyles = {
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type RichTextStyleOverrides = NonNullable<
  React.ComponentProps<typeof MaybeRTF>["richTextStyleOverrides"]
>;

const defaultSharedTextStyles: SharedTextStyles = {
  styles: {
    fontFamily: "default",
    fontSize: "default",
    fontWeight: "default",
    fontStyle: "default",
    textTransform: "default",
  },
  fontColor: undefined,
};

const resolveSharedTextStyles = (
  value: SharedTextStyles | undefined,
): SharedTextStyles => ({
  styles: value?.styles ?? defaultSharedTextStyles.styles,
  fontColor: value?.fontColor,
});

const resolveInfoSectionStyles = (
  value: ResortAndRetreatInfoSectionProps["styles"] | undefined,
): ResortAndRetreatInfoSectionProps["styles"] => ({
  headings: resolveSharedTextStyles(value?.headings),
  subheadings: resolveSharedTextStyles(value?.subheadings),
  body: resolveSharedTextStyles(value?.body),
});

export type ResortAndRetreatInfoSectionProps = {
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    cardBorderColor: ThemeColor;
  };
  summaryCard: {
    summaryHeading: YextEntityField<TranslatableString>;
    address: {
      subheading: YextEntityField<TranslatableString>;
      address: YextEntityField<AddressType>;
      showRegion: boolean;
      showCountry: boolean;
    };
    phone: {
      subheading: YextEntityField<TranslatableString>;
      phoneNumbers: PhoneFieldProps;
    };
    checkIn: {
      subheading: YextEntityField<TranslatableString>;
      checkInOutText: YextEntityField<TranslatableRichText>;
    };
    other: {
      subheading: YextEntityField<TranslatableString>;
      accessibilityText: YextEntityField<TranslatableRichText>;
    };
    primaryCta: ComprehensiveCTAValue;
    secondaryCta: ComprehensiveCTAValue;
  };
  hoursCard: {
    deskHeading: YextEntityField<TranslatableString>;
    hours: YextEntityField<HoursType>;
    hoursStyles: HoursStyles;
  };
  servicesCard: {
    complimentaryHeading: YextEntityField<TranslatableString>;
    complimentaryItems: YextEntityField<TranslatableString[]>;
  };
  styles: {
    headings: SharedTextStyles;
    subheadings: SharedTextStyles;
    body: SharedTextStyles;
  };
};

const renderResolvedRichText = (
  value: unknown,
  richTextStyleOverrides: RichTextStyleOverrides,
) => {
  if (React.isValidElement(value)) {
    return value;
  }

  if (typeof value === "string") {
    return (
      <MaybeRTF data={value} richTextStyleOverrides={richTextStyleOverrides} />
    );
  }

  if (value && typeof value === "object" && "html" in value) {
    return (
      <MaybeRTF
        data={value as { html: string }}
        richTextStyleOverrides={richTextStyleOverrides}
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

const formatPhoneNumber = (
  phoneNumberString: string,
  format: "international" | "domestic",
) => {
  const cleanedPhoneNumberString = phoneNumberString.replace(
    /(?!^\+)\+|[^\d+]/g,
    "",
  );

  const parsedPhoneNumber = parsePhoneNumber(cleanedPhoneNumberString);
  if (!parsedPhoneNumber.valid || parsedPhoneNumber.number === undefined) {
    return phoneNumberString;
  }

  return format === "international"
    ? parsedPhoneNumber.number.international
    : parsedPhoneNumber.number.national;
};

const cardTitleClassName = "m-0";

const ResortAndRetreatInfoSectionFields: YextFields<ResortAndRetreatInfoSectionProps> =
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
        cardBorderColor: {
          label: "Card Border Color",
          type: "basicSelector",
          options: ThemeOptions.BACKGROUND_COLOR.flatMap(
            (group) => group.options,
          ),
        },
      },
    },
    summaryCard: {
      label: "Summary Card",
      type: "object",
      objectFields: {
        summaryHeading: {
          type: "entityField",
          label: "Summary Heading",
          filter: {
            types: ["type.string"],
          },
        },
        address: {
          label: "Address",
          type: "object",
          objectFields: {
            subheading: {
              type: "entityField",
              label: "Subheading",
              filter: {
                types: ["type.string"],
              },
            },
            address: {
              type: "entityField",
              label: "Address",
              filter: {
                types: ["type.address"],
              },
            },
            showRegion: {
              label: "Show Region",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            showCountry: {
              label: "Show Country",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
          },
        },
        phone: {
          label: "Phone",
          type: "object",
          objectFields: {
            subheading: {
              type: "entityField",
              label: "Subheading",
              filter: {
                types: ["type.string"],
              },
            },
            phoneNumbers: {
              label: "Phone Numbers",
              type: "object",
              objectFields: {
                items: {
                  label: "Items",
                  type: "array",
                  arrayFields: {
                    number: {
                      type: "entityField",
                      label: "Number",
                      filter: {
                        types: ["type.phone"],
                      },
                    },
                    label: {
                      label: "Label",
                      type: "entityField",
                      filter: {
                        types: ["type.string"],
                      },
                    },
                  },
                  defaultItemProps: {
                    number: {
                      field: "",
                      constantValue: "",
                      constantValueEnabled: true,
                    } as YextEntityField<string>,
                    label: {
                      field: "",
                      constantValue: {
                        defaultValue: "",
                        hasLocalizedValue: "true",
                      },
                      constantValueEnabled: true,
                    } as YextEntityField<TranslatableString>,
                  },
                  getItemSummary: (item) => item.number?.field || "Phone",
                },
                phoneFormat: {
                  label: "Phone Format",
                  type: "radio",
                  options: [
                    { label: "Domestic", value: "domestic" },
                    { label: "International", value: "international" },
                  ],
                },
                includeHyperlink: {
                  label: "Include Hyperlink",
                  type: "radio",
                  options: [
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ],
                },
              },
            },
          },
        },
        checkIn: {
          label: "Check In/Out",
          type: "object",
          objectFields: {
            subheading: {
              type: "entityField",
              label: "Subheading",
              filter: {
                types: ["type.string"],
              },
            },
            checkInOutText: {
              type: "entityField",
              label: "Check In/Out Text",
              filter: {
                types: ["type.rich_text_v2"],
              },
            },
          },
        },
        other: {
          label: "Other",
          type: "object",
          objectFields: {
            subheading: {
              type: "entityField",
              label: "Subheading",
              filter: {
                types: ["type.string"],
              },
            },
            accessibilityText: {
              type: "entityField",
              label: "Accessibility Text",
              filter: {
                types: ["type.rich_text_v2"],
              },
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
      },
    },
    hoursCard: {
      label: "Hours Card",
      type: "object",
      objectFields: {
        deskHeading: {
          type: "entityField",
          label: "Subheading",
          filter: {
            types: ["type.string"],
          },
        },
        hours: {
          label: "Hours",
          type: "entityField",
          filter: {
            types: ["type.hours"],
          },
          disableConstantValueToggle: true,
        },
        hoursStyles: {
          label: "Hours Styles",
          type: "object",
          objectFields: {
            startOfWeek: {
              label: "Start Of Week",
              type: "select",
              options: [
                { label: "Monday", value: "monday" },
                { label: "Tuesday", value: "tuesday" },
                { label: "Wednesday", value: "wednesday" },
                { label: "Thursday", value: "thursday" },
                { label: "Friday", value: "friday" },
                { label: "Saturday", value: "saturday" },
                { label: "Sunday", value: "sunday" },
                { label: "Today", value: "today" },
              ],
            },
            collapseDays: {
              label: "Collapse Days",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            showAdditionalHoursText: {
              label: "Show Additional Hours Text",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
            alignment: {
              label: "Alignment",
              type: "select",
              options: [
                { label: "Start", value: "items-start" },
                { label: "Center", value: "items-center" },
                { label: "End", value: "items-end" },
              ],
            },
          },
        },
      },
    },
    servicesCard: {
      label: "Services Card",
      type: "object",
      objectFields: {
        complimentaryHeading: {
          type: "entityField",
          label: "Subheading",
          filter: {
            types: ["type.string"],
          },
        },
        complimentaryItems: {
          type: "entityField",
          label: "Services",
          filter: {
            types: ["type.string"],
            includeListsOnly: true,
          },
        },
      },
    },
    styles: {
      label: "Styles",
      type: "object",
      objectFields: {
        headings: {
          label: "Headings",
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
        subheadings: {
          label: "Subheadings",
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
        body: {
          label: "Body",
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

export const ResortAndRetreatInfoSectionComponent: PuckComponent<
  ResortAndRetreatInfoSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const styles = resolveInfoSectionStyles(props.styles);
  const bodyRichTextStyleOverrides: RichTextStyleOverrides = {
    ...styles.body.styles,
    color:
      getThemeColorCssValue(styles.body.fontColor) ??
      getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
      "currentColor",
  };
  const summaryHeading =
    resolveComponentData(
      props.summaryCard.summaryHeading,
      locale,
      streamDocument,
    ) || "";
  const addressSubheading =
    resolveComponentData(
      props.summaryCard.address.subheading,
      locale,
      streamDocument,
    ) || "";
  const resolvedAddress = resolveComponentData(
    props.summaryCard.address.address,
    locale,
    streamDocument,
  );
  const phoneSubheading =
    resolveComponentData(
      props.summaryCard.phone.subheading,
      locale,
      streamDocument,
    ) || "";
  const checkInSubheading =
    resolveComponentData(
      props.summaryCard.checkIn.subheading,
      locale,
      streamDocument,
    ) || "";
  const checkInOutText = resolveComponentData(
    props.summaryCard.checkIn.checkInOutText,
    locale,
    streamDocument,
    {
      richTextStyleOverrides: bodyRichTextStyleOverrides,
    },
  );
  const otherSubheading =
    resolveComponentData(
      props.summaryCard.other.subheading,
      locale,
      streamDocument,
    ) || "";
  const accessibilityText = resolveComponentData(
    props.summaryCard.other.accessibilityText,
    locale,
    streamDocument,
    {
      richTextStyleOverrides: bodyRichTextStyleOverrides,
    },
  );
  const deskHeading =
    resolveComponentData(props.hoursCard.deskHeading, locale, streamDocument) ||
    "";
  const complimentaryHeading =
    resolveComponentData(
      props.servicesCard.complimentaryHeading,
      locale,
      streamDocument,
    ) || "";
  const resolvedHours = resolveComponentData(
    props.hoursCard.hours,
    locale,
    streamDocument,
  );
  const additionalHoursText =
    typeof streamDocument.additionalHoursText === "string"
      ? streamDocument.additionalHoursText.trim()
      : "";
  const resolvedComplimentaryItems = (
    resolveComponentData(
      props.servicesCard.complimentaryItems,
      locale,
      streamDocument,
    ) ?? []
  ).filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
  const resolvedPhoneItems = (props.summaryCard.phone.phoneNumbers.items ?? [])
    .map((item, sourceIndex) => {
      const resolvedNumber = resolveComponentData(
        item.number,
        locale,
        streamDocument,
      );
      const normalizedNumber =
        typeof resolvedNumber === "string" ? resolvedNumber.trim() : "";

      if (!normalizedNumber) {
        return null;
      }

      return {
        sourceIndex,
        label: (item.label
          ? resolveComponentData(item.label, locale, streamDocument)
          : ""
        )
          .toString()
          .trim(),
        originalNumber: normalizedNumber,
        formattedNumber: formatPhoneNumber(
          normalizedNumber,
          props.summaryCard.phone.phoneNumbers.phoneFormat,
        ),
        telDigits: normalizedNumber.replace(/\D/g, ""),
      };
    })
    .filter(
      (
        item,
      ): item is {
        sourceIndex: number;
        label: string;
        originalNumber: string;
        formattedNumber: string;
        telDigits: string;
      } => item !== null,
    );
  const primaryCtaValue: Partial<ComprehensiveCTAValue> = {
    data: props.summaryCard.primaryCta.data,
    styles: props.summaryCard.primaryCta.styles,
    className: props.summaryCard.primaryCta.className,
    eventName: props.summaryCard.primaryCta.eventName,
  };
  const secondaryCtaValue: Partial<ComprehensiveCTAValue> = {
    data: props.summaryCard.secondaryCta.data,
    styles: props.summaryCard.secondaryCta.styles,
    className: props.summaryCard.secondaryCta.className,
    eventName: props.summaryCard.secondaryCta.eventName,
  };

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatInfoSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background as="section" background={props.section.backgroundColor}>
          <ResortAndRetreatInfoSectionContent
            additionalHoursText={additionalHoursText}
            accessibilityText={accessibilityText}
            addressSubheading={addressSubheading}
            bodyRichTextStyleOverrides={bodyRichTextStyleOverrides}
            checkInOutText={checkInOutText}
            checkInSubheading={checkInSubheading}
            complimentaryHeading={complimentaryHeading}
            comingSoon={streamDocument.comingSoon}
            deskHeading={deskHeading}
            entityFieldProps={{
              summaryCard: {
                summaryHeading: props.summaryCard.summaryHeading,
                address: props.summaryCard.address,
                phone: props.summaryCard.phone,
                checkIn: props.summaryCard.checkIn,
                other: props.summaryCard.other,
              },
              primaryCta: props.summaryCard.primaryCta.data.cta,
              secondaryCta: props.summaryCard.secondaryCta.data.cta,
              hoursCard: props.hoursCard,
              servicesCard: props.servicesCard,
            }}
            hoursStyles={props.hoursCard.hoursStyles}
            otherSubheading={otherSubheading}
            phoneIncludeHyperlink={
              props.summaryCard.phone.phoneNumbers.includeHyperlink
            }
            phoneSubheading={phoneSubheading}
            primaryCtaValue={primaryCtaValue}
            resolvedAddress={resolvedAddress}
            resolvedComplimentaryItems={resolvedComplimentaryItems}
            resolvedHours={resolvedHours}
            resolvedPhoneItems={resolvedPhoneItems}
            secondaryCtaValue={secondaryCtaValue}
            sectionForegroundFallback="var(--colors-palette-quaternary)"
            cardBorderColor={props.section.cardBorderColor}
            showCountry={props.summaryCard.address.showCountry}
            showRegion={props.summaryCard.address.showRegion}
            styles={styles}
            summaryHeading={summaryHeading}
          />
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

const ResortAndRetreatInfoSectionContent = ({
  additionalHoursText,
  accessibilityText,
  addressSubheading,
  bodyRichTextStyleOverrides,
  checkInOutText,
  checkInSubheading,
  cardBorderColor,
  complimentaryHeading,
  comingSoon,
  deskHeading,
  entityFieldProps,
  hoursStyles,
  otherSubheading,
  phoneIncludeHyperlink,
  phoneSubheading,
  primaryCtaValue,
  resolvedAddress,
  resolvedComplimentaryItems,
  resolvedHours,
  resolvedPhoneItems,
  secondaryCtaValue,
  sectionForegroundFallback,
  showCountry,
  showRegion,
  styles,
  summaryHeading,
}: {
  additionalHoursText: string;
  accessibilityText: unknown;
  addressSubheading: string;
  bodyRichTextStyleOverrides: RichTextStyleOverrides;
  checkInOutText: unknown;
  checkInSubheading: string;
  cardBorderColor: ThemeColor;
  complimentaryHeading: string;
  comingSoon: boolean;
  deskHeading: string;
  entityFieldProps: {
    summaryCard: Pick<
      ResortAndRetreatInfoSectionProps["summaryCard"],
      "summaryHeading" | "address" | "phone" | "checkIn" | "other"
    >;
    primaryCta: Pick<
      ComprehensiveCTAValue["data"]["cta"],
      "field" | "constantValueEnabled"
    >;
    secondaryCta: Pick<
      ComprehensiveCTAValue["data"]["cta"],
      "field" | "constantValueEnabled"
    >;
    hoursCard: ResortAndRetreatInfoSectionProps["hoursCard"];
    servicesCard: ResortAndRetreatInfoSectionProps["servicesCard"];
  };
  hoursStyles: HoursStyles;
  otherSubheading: string;
  phoneIncludeHyperlink: boolean | undefined;
  phoneSubheading: string;
  primaryCtaValue: Partial<ComprehensiveCTAValue>;
  resolvedAddress: AddressType | undefined;
  resolvedComplimentaryItems: string[];
  resolvedHours: HoursType | undefined;
  resolvedPhoneItems: Array<{
    sourceIndex: number;
    label: string;
    originalNumber: string;
    formattedNumber: string;
    telDigits: string;
  }>;
  secondaryCtaValue: Partial<ComprehensiveCTAValue>;
  sectionForegroundFallback: string;
  showCountry: boolean;
  showRegion: boolean;
  styles: ResortAndRetreatInfoSectionProps["styles"];
  summaryHeading: string;
}) => {
  const sectionBackground = useBackground();
  const sectionForeground =
    getThemeColorCssValue(sectionBackground?.contrastingColor) ??
    sectionForegroundFallback;
  const cardStyle = {
    borderColor: getThemeColorCssValue(cardBorderColor),
    color: sectionForeground,
  };
  const headingTextStyles = resolveStyledTextStyles(
    styles.headings.styles,
    styles.headings.fontColor,
    sectionForeground,
    "var(--fontFamily-h2-fontFamily)",
    "var(--fontSize-h2-fontSize)",
    "var(--fontWeight-h2-fontWeight)",
    "var(--textTransform-h2-textTransform)",
  );
  const subheadingTextStyles = resolveStyledTextStyles(
    styles.subheadings.styles,
    styles.subheadings.fontColor,
    sectionForeground,
    "var(--fontFamily-body-fontFamily)",
    "1rem",
    600,
  );
  const bodyTextStyles = resolveStyledTextStyles(
    styles.body.styles,
    styles.body.fontColor,
    sectionForeground,
    "var(--fontFamily-body-fontFamily)",
    "0.98rem",
    "var(--fontWeight-body-fontWeight)",
  );

  return (
    <div className="mx-auto grid max-w-[1360px] gap-5 px-5 py-8 md:px-8 xl:grid-cols-3 xl:px-10">
      <style>{`
        .HoursTable,
        .HoursTable-row {
          width: 100%;
        }
        .HoursTable-day {
          flex: unset;
        }
      `}</style>
      <article
        className="flex min-w-0 flex-col gap-8 overflow-hidden rounded-2xl border border-[var(--colors-palette-primary-contrast)] p-5"
        style={cardStyle}
      >
        <EntityField
          displayName="Summary Heading"
          fieldId={entityFieldProps.summaryCard.summaryHeading.field}
          constantValueEnabled={
            entityFieldProps.summaryCard.summaryHeading.constantValueEnabled
          }
        >
          <h2 className={cardTitleClassName} style={headingTextStyles}>
            {summaryHeading}
          </h2>
        </EntityField>
        <div
          className="flex min-w-0 flex-col gap-5 leading-6"
          style={bodyTextStyles}
        >
          <div className="flex flex-col gap-1">
            <EntityField
              displayName="Address Heading"
              fieldId={entityFieldProps.summaryCard.address.subheading.field}
              constantValueEnabled={
                entityFieldProps.summaryCard.address.subheading
                  .constantValueEnabled
              }
            >
              <p className="m-0" style={subheadingTextStyles}>
                {addressSubheading}
              </p>
            </EntityField>
            {resolvedAddress ? (
              <EntityField
                displayName="Address"
                fieldId={entityFieldProps.summaryCard.address.address.field}
                constantValueEnabled={
                  entityFieldProps.summaryCard.address.address
                    .constantValueEnabled
                }
              >
                <Address
                  address={resolvedAddress}
                  showRegion={showRegion}
                  showCountry={showCountry}
                />
              </EntityField>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <EntityField
              displayName="Phone Heading"
              fieldId={entityFieldProps.summaryCard.phone.subheading.field}
              constantValueEnabled={
                entityFieldProps.summaryCard.phone.subheading
                  .constantValueEnabled
              }
            >
              <p className="m-0" style={subheadingTextStyles}>
                {phoneSubheading}
              </p>
            </EntityField>
            {resolvedPhoneItems.map((item, index) => {
              const sourceItem =
                entityFieldProps.summaryCard.phone.phoneNumbers.items[
                  item.sourceIndex
                ];

              return phoneIncludeHyperlink ? (
                <EntityField
                  key={`${item.originalNumber}-${index}`}
                  displayName={`Phone ${index + 1}`}
                  fieldId={sourceItem.number.field}
                  constantValueEnabled={sourceItem.number.constantValueEnabled}
                >
                  <Link
                    className="underline underline-offset-4 hover:no-underline"
                    style={{ color: "inherit" }}
                    cta={{
                      link: item.telDigits,
                      linkType: "PHONE",
                    }}
                  >
                    {item.label && sourceItem.label ? (
                      <EntityField
                        displayName={`Phone ${index + 1} Label`}
                        fieldId={sourceItem.label.field}
                        constantValueEnabled={
                          sourceItem.label.constantValueEnabled
                        }
                      >
                        <span>{item.label} </span>
                      </EntityField>
                    ) : null}
                    {item.formattedNumber}
                  </Link>
                </EntityField>
              ) : (
                <EntityField
                  key={`${item.originalNumber}-${index}`}
                  displayName={`Phone ${index + 1}`}
                  fieldId={sourceItem.number.field}
                  constantValueEnabled={sourceItem.number.constantValueEnabled}
                >
                  <p className="m-0">
                    {item.label && sourceItem.label ? (
                      <EntityField
                        displayName={`Phone ${index + 1} Label`}
                        fieldId={sourceItem.label.field}
                        constantValueEnabled={
                          sourceItem.label.constantValueEnabled
                        }
                      >
                        <span>{item.label} </span>
                      </EntityField>
                    ) : null}
                    {item.formattedNumber}
                  </p>
                </EntityField>
              );
            })}
          </div>
          <div className="flex flex-col gap-1">
            <EntityField
              displayName="Check-In Heading"
              fieldId={entityFieldProps.summaryCard.checkIn.subheading.field}
              constantValueEnabled={
                entityFieldProps.summaryCard.checkIn.subheading
                  .constantValueEnabled
              }
            >
              <p className="m-0" style={subheadingTextStyles}>
                {checkInSubheading}
              </p>
            </EntityField>
            <EntityField
              displayName="Check-In and Check-Out Details"
              fieldId={
                entityFieldProps.summaryCard.checkIn.checkInOutText.field
              }
              constantValueEnabled={
                entityFieldProps.summaryCard.checkIn.checkInOutText
                  .constantValueEnabled
              }
            >
              {renderResolvedRichText(
                checkInOutText,
                bodyRichTextStyleOverrides,
              )}
            </EntityField>
          </div>
          <div className="flex flex-col gap-1">
            <EntityField
              displayName="Additional Information Heading"
              fieldId={entityFieldProps.summaryCard.other.subheading.field}
              constantValueEnabled={
                entityFieldProps.summaryCard.other.subheading
                  .constantValueEnabled
              }
            >
              <p className="m-0" style={subheadingTextStyles}>
                {otherSubheading}
              </p>
            </EntityField>
            <EntityField
              displayName="Accessibility Information"
              fieldId={
                entityFieldProps.summaryCard.other.accessibilityText.field
              }
              constantValueEnabled={
                entityFieldProps.summaryCard.other.accessibilityText
                  .constantValueEnabled
              }
            >
              {renderResolvedRichText(
                accessibilityText,
                bodyRichTextStyleOverrides,
              )}
            </EntityField>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <EntityField
            displayName="Primary CTA"
            fieldId={entityFieldProps.primaryCta.field}
            constantValueEnabled={
              entityFieldProps.primaryCta.constantValueEnabled
            }
          >
            <ComprehensiveCTA
              value={primaryCtaValue}
              eventName="summaryCta0"
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
            fieldId={entityFieldProps.secondaryCta.field}
            constantValueEnabled={
              entityFieldProps.secondaryCta.constantValueEnabled
            }
          >
            <ComprehensiveCTA
              value={secondaryCtaValue}
              eventName="summaryCta1"
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
      </article>

      <article
        className="flex min-w-0 flex-col gap-8 overflow-hidden rounded-2xl border border-[var(--colors-palette-primary-contrast)] p-5"
        style={cardStyle}
      >
        <EntityField
          displayName="Front Desk Heading"
          fieldId={entityFieldProps.hoursCard.deskHeading.field}
          constantValueEnabled={
            entityFieldProps.hoursCard.deskHeading.constantValueEnabled
          }
        >
          <h2 className={cardTitleClassName} style={headingTextStyles}>
            {deskHeading}
          </h2>
        </EntityField>
        {resolvedHours ? (
          <EntityField
            displayName="Front Desk Hours"
            fieldId={entityFieldProps.hoursCard.hours.field}
            constantValueEnabled={
              entityFieldProps.hoursCard.hours.constantValueEnabled
            }
          >
            <div
              className={`flex flex-col gap-5 leading-6 ${hoursStyles.alignment}`}
              style={bodyTextStyles}
            >
              <HoursTable
                hours={resolvedHours}
                comingSoon={comingSoon}
                startOfWeek={hoursStyles.startOfWeek}
                collapseDays={hoursStyles.collapseDays}
              />
              {hoursStyles.showAdditionalHoursText && additionalHoursText ? (
                <p className="m-0">{additionalHoursText}</p>
              ) : null}
            </div>
          </EntityField>
        ) : null}
      </article>

      <article
        className="flex min-w-0 flex-col gap-8 overflow-hidden rounded-2xl border border-[var(--colors-palette-primary-contrast)] p-5"
        style={cardStyle}
      >
        <EntityField
          displayName="Complimentary Services Heading"
          fieldId={entityFieldProps.servicesCard.complimentaryHeading.field}
          constantValueEnabled={
            entityFieldProps.servicesCard.complimentaryHeading
              .constantValueEnabled
          }
        >
          <h2 className={cardTitleClassName} style={headingTextStyles}>
            {complimentaryHeading}
          </h2>
        </EntityField>
        <EntityField
          displayName="Complimentary Services"
          fieldId={entityFieldProps.servicesCard.complimentaryItems.field}
          constantValueEnabled={
            entityFieldProps.servicesCard.complimentaryItems
              .constantValueEnabled
          }
        >
          <ul className="m-0 list-disc space-y-4 pl-5" style={bodyTextStyles}>
            {resolvedComplimentaryItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </EntityField>
      </article>
    </div>
  );
};

export const ResortAndRetreatInfoSection: YextComponentConfig<ResortAndRetreatInfoSectionProps> =
  {
    label: "Info Section",
    fields: ResortAndRetreatInfoSectionFields,
    defaultProps: {
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
        cardBorderColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
      },
      summaryCard: {
        summaryHeading: {
          field: "",
          constantValue: {
            defaultValue: "Hotel Summary",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: true,
        },
        address: {
          subheading: {
            field: "",
            constantValue: {
              defaultValue: "Address",
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
          address: {
            field: "address",
            constantValue: {
              line1: "",
              city: "",
              postalCode: "",
              countryCode: "",
              region: "",
            },
            constantValueEnabled: false,
          },
          showRegion: true,
          showCountry: false,
        },
        phone: {
          subheading: {
            field: "",
            constantValue: {
              defaultValue: "Main Reservations",
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
          phoneNumbers: {
            items: [
              {
                number: {
                  field: "mainPhone",
                  constantValue: "",
                  constantValueEnabled: false,
                },
                label: {
                  field: "",
                  constantValue: {
                    defaultValue: "",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
            ],
            phoneFormat: "domestic",
            includeHyperlink: true,
          },
        },
        checkIn: {
          subheading: {
            field: "",
            constantValue: {
              defaultValue: "Check-In/Out",
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
          checkInOutText: {
            field: "",
            constantValue: {
              defaultValue: getDefaultRTF(
                "Standard Check-In: 4:00 PM | Standard Check-Out: 11:00 AM",
              ),
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
        },
        other: {
          subheading: {
            field: "",
            constantValue: {
              defaultValue: "Accessibility",
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
          accessibilityText: {
            field: "",
            constantValue: {
              defaultValue: getDefaultRTF(
                "Step-free main entrance, ADA-compliant accessible rooms, elevator access to all floors, braille signage",
              ),
              hasLocalizedValue: "true",
            },
            constantValueEnabled: true,
          },
        },
        primaryCta: {
          data: {
            actionType: "link",
            cta: {
              field: "",
              constantValue: {
                label: {
                  defaultValue: "Visit Website",
                  hasLocalizedValue: "true",
                },
                link: { defaultValue: "#", hasLocalizedValue: "true" },
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
        secondaryCta: {
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
            variant: "secondary",
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
      },
      hoursCard: {
        deskHeading: {
          field: "",
          constantValue: {
            defaultValue: "Hours",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: true,
        },
        hours: {
          field: "hours",
          constantValue: {},
          constantValueEnabled: false,
        } as YextEntityField<HoursType>,
        hoursStyles: {
          startOfWeek: "monday",
          collapseDays: false,
          showAdditionalHoursText: false,
          alignment: "items-start",
        },
      },
      servicesCard: {
        complimentaryHeading: {
          field: "",
          constantValue: {
            defaultValue: "Complimentary Services",
            hasLocalizedValue: "true",
          },
          constantValueEnabled: true,
        },
        complimentaryItems: {
          field: "",
          constantValue: [
            "High-Speed Wi-Fi (Property-Wide)",
            "Morning Artisanal Coffee & Tea Station",
            "Evening Social Hour (Local Wine & Cheese)",
            "Digital Concierge App Access",
            "Luxury Bicycle Rentals",
            "Free cancellation up to 48 hours prior to arrival for direct bookings",
          ],
          constantValueEnabled: true,
        },
      },
      styles: {
        headings: {
          styles: {
            fontFamily: "default",
            fontSize: "default",
            fontWeight: "default",
            fontStyle: "default",
            textTransform: "default",
          },
          fontColor: undefined,
        },
        subheadings: {
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
          styles: {
            fontFamily: "default",
            fontSize: "default",
            fontWeight: "default",
            fontStyle: "default",
            textTransform: "default",
          },
          fontColor: undefined,
        },
      },
    },
    render: (props) => <ResortAndRetreatInfoSectionComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatInfoSection",
  displayName: "Info Section",
  description: "Info Section",
  pageSetTypes: ["ENTITY"],
};
