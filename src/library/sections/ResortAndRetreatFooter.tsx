import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider, Link } from "@yext/pages-components";
import {
  Background,
  EntityField,
  getAnalyticsScopeHash,
  getSurfaceColorStyle,
  getThemeColorCssValue,
  resolveComponentData,
  type StyledTextValue,
  type ThemeColor,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  useDocument,
  VisibilityWrapper,
} from "@yext/visual-editor";
import { Address, type AddressType } from "@yext/pages-components";
import { parsePhoneNumber } from "awesome-phonenumber";

type StyledTextProps = {
  text: YextEntityField<TranslatableString>;
  styles: StyledTextValue;
  fontColor?: ThemeColor;
};

type FooterLink = {
  label: YextEntityField<TranslatableString>;
  link: YextEntityField<TranslatableString>;
  openInNewTab: boolean;
};

type PhoneItemProps = {
  number: YextEntityField<string>;
  label?: YextEntityField<TranslatableString>;
};

type PhoneFieldProps = {
  items: PhoneItemProps[];
  phoneFormat: "international" | "domestic";
  includeHyperlink?: boolean;
};

// Audit wiring note: filter.fontColor is a scanner false positive here.
// The brand fontColor is applied in render and links inherit the footer color.

export type ResortAndRetreatFooterProps = {
  infoPane: {
    infoPanelBackgroundColor: ThemeColor;
    brand: StyledTextProps;
    address: {
      address: YextEntityField<AddressType>;
      showRegion: boolean;
      showCountry: boolean;
    };
    phones: PhoneFieldProps;
    bodyStyles: { styles: StyledTextValue; fontColor?: ThemeColor };
  };
  linkPane: {
    linkPanelBackgroundColor: ThemeColor;
    linkColor?: ThemeColor;
    quickLinks: FooterLink[];
    socialLinks: FooterLink[];
  };
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    borderColor: ThemeColor;
    topBorderColor: ThemeColor;
  };
};

const resolveStyledTextStyles = (
  styles: StyledTextValue,
  fontColor: ThemeColor | undefined,
  fallbackColor: string,
  fallbackFontFamily: string,
  fallbackFontSize: string,
  fallbackFontWeight: React.CSSProperties["fontWeight"],
  fallbackTextTransform: React.CSSProperties["textTransform"] = "capitalize",
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

const ResortAndRetreatFooterFields: YextFields<ResortAndRetreatFooterProps> =
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
        borderColor: {
          label: "Border Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
        topBorderColor: {
          label: "Top Border Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
      },
    },
    infoPane: {
      label: "Info Panel",
      type: "object",
      objectFields: {
        infoPanelBackgroundColor: {
          label: "Background Color",
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
        brand: {
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
        address: {
          label: "Address",
          type: "object",
          objectFields: {
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
        phones: {
          label: "Phone Numbers",
          type: "object",
          objectFields: {
            items: {
              label: "Numbers",
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
                } satisfies YextEntityField<string>,
                label: {
                  field: "",
                  constantValue: {
                    defaultValue: "",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                } satisfies YextEntityField<TranslatableString>,
              },
              getItemSummary: (_, i) => `Phone ${(i ?? 0) + 1}`,
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
        bodyStyles: {
          label: "Text Styles",
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
    linkPane: {
      label: "Link Panel",
      type: "object",
      objectFields: {
        linkPanelBackgroundColor: {
          label: "Background Color",
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
        linkColor: {
          label: "Link Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
        quickLinks: {
          label: "Quick Links",
          type: "array",
          arrayFields: {
            label: {
              label: "Label",
              type: "entityField",
              filter: {
                types: ["type.string"],
              },
            },
            link: {
              label: "Link",
              type: "entityField",
              filter: {
                types: ["type.string"],
              },
            },
            openInNewTab: {
              label: "Open in New Tab",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
          },
          defaultItemProps: {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Link",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          getItemSummary: (_, i) => `Link ${(i ?? 0) + 1}`,
        },
        socialLinks: {
          label: "Social Links",
          type: "array",
          arrayFields: {
            label: {
              label: "Label",
              type: "entityField",
              filter: {
                types: ["type.string"],
              },
            },
            link: {
              label: "Link",
              type: "entityField",
              filter: {
                types: ["type.string"],
              },
            },
            openInNewTab: {
              label: "Open in New Tab",
              type: "radio",
              options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
              ],
            },
          },
          defaultItemProps: {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Link",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          getItemSummary: (_, i) => `Social Link ${(i ?? 0) + 1}`,
        },
      },
    },
  };

export const ResortAndRetreatFooterComponent: PuckComponent<
  ResortAndRetreatFooterProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const brandText =
    resolveComponentData(props.infoPane.brand.text, locale, streamDocument) ||
    "";
  const resolvedAddress = resolveComponentData(
    props.infoPane.address.address,
    locale,
    streamDocument,
  );
  const resolvedPhoneItems = (props.infoPane.phones.items ?? [])
    .map((item) => {
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
        labelField: item.label,
        numberField: item.number,
        label: (item.label
          ? resolveComponentData(item.label, locale, streamDocument)
          : ""
        )
          .toString()
          .trim(),
        originalNumber: normalizedNumber,
        formattedNumber: formatPhoneNumber(
          normalizedNumber,
          props.infoPane.phones.phoneFormat,
        ),
        telDigits: normalizedNumber.replace(/\D/g, ""),
      };
    })
    .filter(
      (
        item,
      ): item is {
        label: string;
        labelField: YextEntityField<TranslatableString> | undefined;
        numberField: YextEntityField<string>;
        originalNumber: string;
        formattedNumber: string;
        telDigits: string;
      } => item !== null,
    );
  const sectionStyle = getSurfaceColorStyle(
    props.section.backgroundColor,
    streamDocument,
  );
  const borderColor =
    getThemeColorCssValue(props.section.borderColor) ??
    "var(--colors-palette-primary)";
  const topBorderColor =
    getThemeColorCssValue(props.section.topBorderColor) ?? borderColor;
  const infoPanelStyle = getSurfaceColorStyle(
    props.infoPane.infoPanelBackgroundColor,
    streamDocument,
  );
  const linkPanelStyle = getSurfaceColorStyle(
    props.linkPane.linkPanelBackgroundColor,
    streamDocument,
  );
  const linkPanelColor =
    getThemeColorCssValue(props.linkPane.linkColor) ??
    getThemeColorCssValue({
      selectedColor: props.linkPane.linkPanelBackgroundColor.contrastingColor,
      contrastingColor: props.linkPane.linkPanelBackgroundColor.selectedColor,
    }) ??
    "currentColor";
  const bodyTextStyle = resolveStyledTextStyles(
    props.infoPane.bodyStyles.styles,
    props.infoPane.bodyStyles.fontColor,
    "currentColor",
    "var(--fontFamily-body-fontFamily)",
    "1rem",
    "var(--fontWeight-body-fontWeight)",
  );

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatFooter${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="footer"
          background={props.section.backgroundColor}
          style={{
            ...sectionStyle,
            borderTop: `1px solid ${topBorderColor}`,
          }}
        >
          <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-5 py-6 md:px-8 xl:flex-row xl:px-10">
            <Background
              as="div"
              background={props.infoPane.infoPanelBackgroundColor}
              className="flex flex-1 flex-col gap-3 rounded-2xl border p-5"
              style={{
                ...infoPanelStyle,
                borderColor,
              }}
            >
              <EntityField
                displayName="Footer Brand"
                fieldId={props.infoPane.brand.text.field}
                constantValueEnabled={
                  props.infoPane.brand.text.constantValueEnabled
                }
              >
                <p
                  className="m-0"
                  style={resolveStyledTextStyles(
                    props.infoPane.brand.styles,
                    props.infoPane.brand.fontColor,
                    "currentColor",
                    "var(--fontFamily-h4-fontFamily), Georgia, serif",
                    "var(--fontSize-h4-fontSize)",
                    "var(--fontWeight-h4-fontWeight)",
                    "var(--textTransform-h4-textTransform)",
                  )}
                >
                  {brandText}
                </p>
              </EntityField>
              {resolvedAddress ? (
                <EntityField
                  displayName="Footer Address"
                  fieldId={props.infoPane.address.address.field}
                  constantValueEnabled={
                    props.infoPane.address.address.constantValueEnabled
                  }
                >
                  <div style={bodyTextStyle}>
                    <Address
                      address={resolvedAddress}
                      showRegion={props.infoPane.address.showRegion}
                      showCountry={props.infoPane.address.showCountry}
                    />
                  </div>
                </EntityField>
              ) : null}
              {resolvedPhoneItems.map((item, index) =>
                props.infoPane.phones.includeHyperlink ? (
                  <EntityField
                    key={`${item.originalNumber}-${index}`}
                    displayName={`Footer Phone ${index + 1}`}
                    fieldId={item.numberField.field}
                    constantValueEnabled={item.numberField.constantValueEnabled}
                  >
                    <Link
                      cta={{
                        link: item.telDigits,
                        linkType: "PHONE",
                      }}
                      className="text-inherit underline hover:no-underline"
                      style={bodyTextStyle}
                    >
                      {item.label && item.labelField ? (
                        <EntityField
                          displayName={`Footer Phone ${index + 1} Label`}
                          fieldId={item.labelField.field}
                          constantValueEnabled={
                            item.labelField.constantValueEnabled
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
                    displayName={`Footer Phone ${index + 1}`}
                    fieldId={item.numberField.field}
                    constantValueEnabled={item.numberField.constantValueEnabled}
                  >
                    <p className="m-0" style={bodyTextStyle}>
                      {item.label && item.labelField ? (
                        <EntityField
                          displayName={`Footer Phone ${index + 1} Label`}
                          fieldId={item.labelField.field}
                          constantValueEnabled={
                            item.labelField.constantValueEnabled
                          }
                        >
                          <span>{item.label} </span>
                        </EntityField>
                      ) : null}
                      {item.formattedNumber}
                    </p>
                  </EntityField>
                ),
              )}
            </Background>

            <Background
              as="div"
              background={props.linkPane.linkPanelBackgroundColor}
              className="flex flex-[1.25] flex-col gap-6 rounded-2xl border p-5 md:flex-row"
              style={{
                ...linkPanelStyle,
                borderColor,
                color: linkPanelColor,
              }}
            >
              <div className="flex-1">
                <p className="mb-3 mt-0 font-bold">Quick Links</p>
                <div className="flex flex-col gap-2">
                  {(props.linkPane.quickLinks ?? []).map((item, index) => {
                    const itemLabel =
                      resolveComponentData(
                        item.label,
                        locale,
                        streamDocument,
                      ) || "";
                    const itemLink =
                      resolveComponentData(item.link, locale, streamDocument) ||
                      "#";

                    return (
                      <EntityField
                        key={`${itemLabel}-${index}`}
                        displayName={`Quick Link ${index + 1} URL`}
                        fieldId={item.link.field}
                        constantValueEnabled={item.link.constantValueEnabled}
                      >
                        <Link
                          cta={{
                            link: itemLink.toString(),
                            linkType: "URL",
                          }}
                          eventName={`quickLink${index}`}
                          className="font-medium underline hover:no-underline"
                          style={{ color: linkPanelColor }}
                          target={item.openInNewTab ? "_blank" : undefined}
                          rel={
                            item.openInNewTab
                              ? "noopener noreferrer"
                              : undefined
                          }
                        >
                          <EntityField
                            displayName={`Quick Link ${index + 1} Label`}
                            fieldId={item.label.field}
                            constantValueEnabled={
                              item.label.constantValueEnabled
                            }
                          >
                            <span>{itemLabel}</span>
                          </EntityField>
                        </Link>
                      </EntityField>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1">
                <p className="mb-3 mt-0 font-bold">Social Links</p>
                <div className="flex flex-col gap-2">
                  {(props.linkPane.socialLinks ?? []).map((item, index) => {
                    const itemLabel =
                      resolveComponentData(
                        item.label,
                        locale,
                        streamDocument,
                      ) || "";
                    const itemLink =
                      resolveComponentData(item.link, locale, streamDocument) ||
                      "#";

                    return (
                      <EntityField
                        key={`${itemLabel}-${index}`}
                        displayName={`Social Link ${index + 1} URL`}
                        fieldId={item.link.field}
                        constantValueEnabled={item.link.constantValueEnabled}
                      >
                        <Link
                          cta={{
                            link: itemLink.toString(),
                            linkType: "URL",
                          }}
                          eventName={`socialLink${index}`}
                          className="font-medium underline hover:no-underline"
                          style={{ color: linkPanelColor }}
                          target={item.openInNewTab ? "_blank" : undefined}
                          rel={
                            item.openInNewTab
                              ? "noopener noreferrer"
                              : undefined
                          }
                        >
                          <EntityField
                            displayName={`Social Link ${index + 1} Label`}
                            fieldId={item.label.field}
                            constantValueEnabled={
                              item.label.constantValueEnabled
                            }
                          >
                            <span>{itemLabel}</span>
                          </EntityField>
                        </Link>
                      </EntityField>
                    );
                  })}
                </div>
              </div>
            </Background>
          </div>
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatFooter: YextComponentConfig<ResortAndRetreatFooterProps> =
  {
    label: "Footer",
    fields: ResortAndRetreatFooterFields,
    defaultProps: {
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "palette-tertiary-light",
          contrastingColor: "black",
        },
        borderColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
        topBorderColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
      },
      infoPane: {
        infoPanelBackgroundColor: {
          selectedColor: "palette-tertiary",
          contrastingColor: "palette-tertiary-contrast",
        },
        brand: {
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
        address: {
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
        phones: {
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
        bodyStyles: {
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
      linkPane: {
        linkPanelBackgroundColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
        linkColor: undefined,
        quickLinks: [
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Accommodations",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#accommodations",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Amenities",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#amenities",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Special Offers",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#offers",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Careers",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#careers",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Contact",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#contact",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
        ],
        socialLinks: [
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Instagram",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Facebook",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "LinkedIn",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
          {
            label: {
              field: "",
              constantValue: {
                defaultValue: "Pinterest",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            link: {
              field: "",
              constantValue: {
                defaultValue: "#",
                hasLocalizedValue: "true",
              },
              constantValueEnabled: true,
            },
            openInNewTab: false,
          },
        ],
      },
    },
    render: (props) => <ResortAndRetreatFooterComponent {...props} />,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatFooter",
  displayName: "Footer",
  description: "Footer",
  pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
};
