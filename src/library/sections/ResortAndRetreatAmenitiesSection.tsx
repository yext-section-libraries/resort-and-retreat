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
  isDarkColor,
  MaybeRTF,
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
  useDocument,
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

type SharedCardAction = Pick<
  ComprehensiveCTAValue,
  "data" | "styles" | "className" | "eventName"
>;

type ImageFieldProps = {
  image: YextEntityField<TranslatableAssetImage>;
  imageConstrain: "fixed" | "filled";
  borderColor: ThemeColor;
};

type AmenityIconImageProps = {
  image: YextEntityField<TranslatableAssetImage>;
  aspectRatio: number;
  imageConstrain: "fixed" | "filled";
  styles?: StyledImageValue;
};

type AmenityIconPresentation = Omit<AmenityIconImageProps, "image">;

type AmenityItem = {
  iconImage: YextEntityField<TranslatableAssetImage>;
  title: YextEntityField<TranslatableString>;
  description: YextEntityField<TranslatableRichText>;
  ctaLabel: YextEntityField<TranslatableString>;
  ctaLink: YextEntityField<TranslatableString>;
};

export type ResortAndRetreatAmenitiesSectionProps = {
  title: StyledTextProps;
  featureStyles: {
    itemTitle: SharedTextStyleProps;
    itemDescription: SharedTextStyleProps;
    iconBorderColor?: ThemeColor;
    iconBackgroundColor?: ThemeColor;
    iconImage: AmenityIconPresentation;
    action: SharedCardAction;
  };
  image: ImageFieldProps;
  features: typeof amenityItemSource.value;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
  };
};

const defaultImageStyles: StyledImageValue = {
  borderRadius: "default",
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

const defaultIconBorderColor: ThemeColor = {
  selectedColor: "palette-primary",
  contrastingColor: "palette-primary-contrast",
};

const defaultIconBackgroundColor: ThemeColor = {
  selectedColor: "palette-secondary",
  contrastingColor: "palette-secondary-contrast",
};

const defaultAmenityIconPresentation: AmenityIconPresentation = {
  aspectRatio: 1,
  imageConstrain: "fixed",
  styles: defaultImageStyles,
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

const hasImageSource = (image: TranslatableAssetImage | undefined): boolean => {
  if (!image || typeof image !== "object") {
    return false;
  }

  const url =
    "url" in image
      ? image.url
      : "image" in image
        ? image.image?.url
        : undefined;

  return typeof url === "string" && Boolean(url.trim());
};

const getImageUrl = (image: TranslatableAssetImage): string | undefined => {
  if ("url" in image) {
    return typeof image.url === "string" ? image.url : undefined;
  }

  if ("image" in image) {
    return typeof image.image?.url === "string" ? image.image.url : undefined;
  }

  return undefined;
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

const resolveBorderRadius = (value?: string): string | undefined => {
  if (!value || value === "default") {
    return undefined;
  }

  return value;
};

const resolveSharedTextStyle = (
  value?: SharedTextStyleProps,
): SharedTextStyleProps => ({
  styles: value?.styles ?? defaultSharedTextStyles.styles,
  fontColor: value?.fontColor ?? defaultSharedTextStyles.fontColor,
});

const resolveAmenitiesStyles = (
  value?: Omit<
    ResortAndRetreatAmenitiesSectionProps["featureStyles"],
    "action"
  >,
) => ({
  itemTitle: resolveSharedTextStyle(value?.itemTitle),
  itemDescription: resolveSharedTextStyle(value?.itemDescription),
  iconBorderColor: value?.iconBorderColor ?? defaultIconBorderColor,
  iconBackgroundColor: value?.iconBackgroundColor ?? defaultIconBackgroundColor,
  iconImage: value?.iconImage ?? defaultAmenityIconPresentation,
});

const resolveAmenityIconImage = (
  value?: AmenityIconPresentation,
): AmenityIconPresentation => ({
  aspectRatio: value?.aspectRatio ?? defaultAmenityIconPresentation.aspectRatio,
  imageConstrain:
    value?.imageConstrain ?? defaultAmenityIconPresentation.imageConstrain,
  styles: value?.styles ?? defaultAmenityIconPresentation.styles,
});

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

const createStringFieldDefault = (
  defaultValue: string,
): YextEntityField<TranslatableString> => ({
  field: "",
  constantValue: { defaultValue, hasLocalizedValue: "true" },
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
  url = "",
  width = 0,
  height = 0,
): YextEntityField<TranslatableAssetImage> => ({
  field: "",
  constantValue: { url, width, height },
  constantValueEnabled: true,
});

const createTextCta = (label: string): ComprehensiveCTAValue =>
  ({
    data: {
      actionType: "link",
      cta: {
        field: "",
        constantValue: {
          label: { defaultValue: label, hasLocalizedValue: "true" },
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
      variant: "link",
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
  }) as ComprehensiveCTAValue;

const amenityItemSource = createItemSource<AmenityItem>({
  label: "Amenities",
  mappingFields: {
    iconImage: {
      type: "entityField",
      label: "Icon Image",
      filter: { types: ["type.image"] },
    },
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
      iconImage: createImageFieldDefault(),
      title: createStringFieldDefault("The Courtyard Lounge & Bar"),
      description: createRichTextFieldDefault(
        "Sip masterfully crafted cocktails, local craft beers, and small plates in our intimate, open-air garden courtyard.",
      ),
      ctaLabel: createStringFieldDefault("View Drinks Menu"),
      ctaLink: createStringFieldDefault("#"),
    },
    {
      iconImage: createImageFieldDefault(),
      title: createStringFieldDefault("Elite Fitness Center"),
      description: createRichTextFieldDefault(
        "Maintain your routine with state-of-the-art cardio machines, free weights, Peloton bikes, and complimentary yoga mats.",
      ),
      ctaLabel: createStringFieldDefault("See Equipment List"),
      ctaLink: createStringFieldDefault("#"),
    },
    {
      iconImage: createImageFieldDefault(),
      title: createStringFieldDefault("Rooftop Oasis Pool"),
      description: createRichTextFieldDefault(
        "Relax and unwind by our heated outdoor pool, featuring premium lounge chairs, private cabanas, and poolside beverage service.",
      ),
      ctaLabel: createStringFieldDefault("Reserve a Cabana"),
      ctaLink: createStringFieldDefault("#"),
    },
  ],
});

const AmenityMartiniIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M23.25 12C22.8094 12 22.3828 11.9484 21.975 11.8453L20.9109 13.0875C21.6375 13.3547 22.425 13.5047 23.2453 13.5047C26.9719 13.5047 29.9953 10.4813 29.9953 6.75469C29.9953 3.02813 26.9766 0 23.25 0C20.6016 0 18.3047 1.52812 17.2031 3.75H18.9422C19.8891 2.39062 21.4688 1.5 23.25 1.5C26.1516 1.5 28.5 3.84844 28.5 6.75C28.5 9.65156 26.1516 12 23.25 12ZM3.75 6H3V7.77656L3.18281 7.9875L12 18.2766V25.5H7.5V27H18V25.5H13.5V18.2766L22.3172 7.9875L22.5 7.77656V6H3.75ZM20.7609 7.5L12.75 16.8469L4.73906 7.5H20.7609Z"
      fill="currentColor"
    />
  </svg>
);

const AmenityDumbbellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M22.125 6C23.1703 6 24.0703 6.61406 24.4922 7.5H25.5L25.8047 7.51406C27.3187 7.66875 28.5 8.94844 28.5 10.5V14.25H29.25C29.6625 14.25 30 14.5875 30 15C30 15.4125 29.6625 15.75 29.25 15.75H28.5V19.5L28.4859 19.8047C28.3406 21.2156 27.2203 22.3406 25.8094 22.4813L25.5047 22.4953H24.5016C24.0797 23.3812 23.1797 23.9953 22.1297 23.9953C20.7703 23.9953 19.65 22.9641 19.5187 21.6375L19.5047 21.3703V15.7453H10.5047V21.3703L10.4906 21.6375C10.3547 22.9594 9.23906 23.9953 7.87969 23.9953C6.83438 23.9953 5.92969 23.3812 5.50781 22.4953H4.50469L4.2 22.4813C2.78906 22.3359 1.66406 21.2156 1.52344 19.8047L1.50938 19.5V15.75H0.759375C0.346875 15.75 0.009375 15.4125 0.009375 15C0.009375 14.5875 0.346875 14.25 0.759375 14.25H1.50938V10.5C1.50938 8.94844 2.69063 7.66875 4.20469 7.51406L4.50938 7.5H5.51719C5.93906 6.61406 6.83906 6 7.88438 6C9.33281 6 10.5094 7.17656 10.5094 8.625V14.25H19.5094V8.625C19.5094 7.17656 20.6859 6 22.1344 6H22.125ZM22.125 7.5C21.5016 7.5 21 8.00156 21 8.625V21.375C21 21.9984 21.5016 22.5 22.125 22.5C22.7484 22.5 23.25 21.9984 23.25 21.375V8.625C23.25 8.00156 22.7484 7.5 22.125 7.5ZM7.875 7.5C7.25156 7.5 6.75 8.00156 6.75 8.625V21.375C6.75 21.9984 7.25156 22.5 7.875 22.5C8.49844 22.5 9 21.9984 9 21.375V8.625C9 8.00156 8.49844 7.5 7.875 7.5ZM4.5 9C3.67031 9 3 9.67031 3 10.5V19.5C3 20.3297 3.67031 21 4.5 21H5.25V9H4.5ZM24.75 21H25.5C26.3297 21 27 20.3297 27 19.5V10.5C27 9.72187 26.4094 9.08437 25.6547 9.00937L25.5 9H24.75V21Z"
      fill="currentColor"
    />
  </svg>
);

const AmenityPoolIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M24.375 8.625C24.375 8.00156 23.8734 7.5 23.25 7.5C22.6266 7.5 22.125 8.00156 22.125 8.625C22.125 9.24844 22.6266 9.75 23.25 9.75C23.8734 9.75 24.375 9.24844 24.375 8.625ZM20.625 8.625C20.625 7.17656 21.8016 6 23.25 6C24.6984 6 25.875 7.17656 25.875 8.625C25.875 10.0734 24.6984 11.25 23.25 11.25C21.8016 11.25 20.625 10.0734 20.625 8.625ZM21.2906 14.6344C20.7703 14.6063 20.2453 14.6344 19.7297 14.7141C19.2516 13.4719 18.4641 12.3609 17.4188 11.4891C17.1094 11.2313 16.7813 10.9969 16.4344 10.7906L11.4984 15.0281C10.8937 14.8172 10.2703 14.6906 9.6375 14.6437L14.9437 10.0969C14.8125 10.05 14.6766 10.0078 14.5453 9.97031L12.3797 9.35156C11.7469 9.16875 11.0625 9.27656 10.5141 9.64219L7.16719 11.8734C6.82031 12.1031 6.35625 12.0094 6.12656 11.6672C5.89687 11.325 5.99063 10.8562 6.33281 10.6266L9.67969 8.39531C10.5937 7.78594 11.7328 7.60781 12.7922 7.90781L14.9531 8.52656C16.2094 8.88281 17.3766 9.50156 18.375 10.3359C19.7438 11.4797 20.7469 12.975 21.2859 14.6344H21.2906ZM22.9266 19.0266C21.7078 18.1547 20.0625 18.1547 18.8438 19.0266C17.6438 19.8844 16.3641 20.625 15 20.625C13.6359 20.625 12.3562 19.8844 11.1562 19.0266C9.9375 18.1547 8.29219 18.1547 7.07344 19.0266C5.91562 19.8516 4.51406 20.6062 3 20.5969C2.09531 20.5922 1.19063 20.3156 0.31875 19.6922C-0.01875 19.4531 -0.0984375 18.9844 0.145312 18.6469C0.389062 18.3094 0.853125 18.2297 1.19062 18.4734C1.81875 18.9234 2.42812 19.0969 3.00937 19.0969C4.04062 19.1016 5.11875 18.5812 6.20625 17.8078C7.94531 16.5656 10.2891 16.5656 12.0328 17.8078C13.2188 18.6562 14.1563 19.125 15.0094 19.125C15.8625 19.125 16.7953 18.6516 17.9859 17.8078C19.725 16.5656 22.0688 16.5656 23.8125 17.8078C24.6656 18.4172 25.5234 18.8766 26.3625 19.0359C27.1688 19.1906 27.9844 19.0734 28.8281 18.4734C29.1656 18.2344 29.6344 18.3094 29.8734 18.6469C30.1125 18.9844 30.0375 19.4531 29.7 19.6922C28.5 20.5453 27.2625 20.7328 26.0813 20.5078C24.9328 20.2875 23.8688 19.6875 22.9406 19.0266H22.9266ZM1.5 22.875C2.12344 22.875 2.625 23.3766 2.625 24C2.625 24.6234 2.12344 25.125 1.5 25.125C0.876563 25.125 0.375 24.6234 0.375 24C0.375 23.3766 0.876563 22.875 1.5 22.875ZM8.25 22.875C8.87344 22.875 9.375 23.3766 9.375 24C9.375 24.6234 8.87344 25.125 8.25 25.125C7.62656 25.125 7.125 24.6234 7.125 24C7.125 23.3766 7.62656 22.875 8.25 22.875ZM20.625 24C20.625 23.3766 21.1266 22.875 21.75 22.875C22.3734 22.875 22.875 23.3766 22.875 24C22.875 24.6234 22.3734 25.125 21.75 25.125C21.1266 25.125 20.625 24.6234 20.625 24ZM28.5 22.875C29.1234 22.875 29.625 23.3766 29.625 24C29.625 24.6234 29.1234 25.125 28.5 25.125C27.8766 25.125 27.375 24.6234 27.375 24C27.375 23.3766 27.8766 22.875 28.5 22.875ZM13.875 24C13.875 23.3766 14.3766 22.875 15 22.875C15.6234 22.875 16.125 23.3766 16.125 24C16.125 24.6234 15.6234 25.125 15 25.125C14.3766 25.125 13.875 24.6234 13.875 24Z"
      fill="currentColor"
    />
  </svg>
);

const amenityIcons = [
  AmenityMartiniIcon,
  AmenityDumbbellIcon,
  AmenityPoolIcon,
] as const;

const ResortAndRetreatAmenitiesSectionFields: YextFields<ResortAndRetreatAmenitiesSectionProps> =
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
    features: amenityItemSource.field,
    featureStyles: {
      label: "Feature Styles",
      type: "object",
      objectFields: {
        itemTitle: {
          label: "Item Title",
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
        itemDescription: {
          label: "Item Description",
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
        iconBorderColor: {
          label: "Icon Border Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
        iconBackgroundColor: {
          label: "Icon Background Color",
          type: "basicSelector",
          options: "SITE_COLOR",
        },
        iconImage: {
          label: "Icon Image Styles",
          type: "object",
          objectFields: {
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
        action: {
          label: "Action Styles",
          type: "comprehensiveCTA",
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
          filter: { types: ["type.image"] },
        },
        imageConstrain: {
          label: "Image Constrain",
          type: "select",
          options: [
            { label: "Fixed", value: "fixed" },
            { label: "Filled", value: "filled" },
          ],
        },
        borderColor: {
          label: "Image Border Color",
          type: "basicSelector",
          options: ThemeOptions.BACKGROUND_COLOR.flatMap(
            (group) => group.options,
          ),
        },
      },
    },
  };

const renderAmenityIcon = ({
  iconImage,
  iconImageProps,
  fallbackIcon,
}: {
  iconImage?: TranslatableAssetImage;
  iconImageProps: AmenityIconPresentation;
  fallbackIcon: React.ReactNode;
}) => {
  if (!iconImage || !hasImageSource(iconImage)) {
    return fallbackIcon;
  }

  const iconUrl = getImageUrl(iconImage);
  if (!iconUrl) {
    return fallbackIcon;
  }

  const iconHeight = 30;
  const iconAspectRatio =
    iconImageProps.aspectRatio > 0 ? iconImageProps.aspectRatio : 1;
  const resolvedBorderRadius = resolveBorderRadius(
    iconImageProps.styles?.borderRadius,
  );
  const isFilled = iconImageProps.imageConstrain === "filled";

  return (
    <div
      style={{
        width: isFilled ? "100%" : `${iconHeight * iconAspectRatio}px`,
        height: isFilled ? "100%" : `${iconHeight}px`,
        maxWidth: "100%",
        maxHeight: "100%",
        borderRadius: resolvedBorderRadius,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <img
        alt=""
        src={iconUrl}
        className="h-full w-full"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit:
            iconImageProps.imageConstrain === "filled" ? "cover" : "contain",
        }}
      />
    </div>
  );
};

export const ResortAndRetreatAmenitiesSectionComponent: PuckComponent<
  ResortAndRetreatAmenitiesSectionProps
> = (props) => {
  const streamDocument = useDocument();
  const locale = streamDocument.locale ?? "en";
  const sectionStyle = getSurfaceColorStyle(
    props.section.backgroundColor,
    streamDocument,
  );
  const sectionForeground =
    getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
    "var(--colors-palette-quaternary)";
  const styles = resolveAmenitiesStyles({
    itemTitle: props.featureStyles.itemTitle,
    itemDescription: props.featureStyles.itemDescription,
    iconBorderColor: props.featureStyles.iconBorderColor,
    iconBackgroundColor: props.featureStyles.iconBackgroundColor,
    iconImage: props.featureStyles.iconImage,
  });
  const featureAction: SharedCardAction = {
    data: props.featureStyles.action.data,
    styles: props.featureStyles.action.styles,
    className: props.featureStyles.action.className,
    eventName: props.featureStyles.action.eventName,
  };
  const features = amenityItemSource.resolveItems(
    props.features,
    streamDocument,
  );
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const image = resolveComponentData(props.image.image, locale, streamDocument);
  const titleColor = getThemeColorCssValue(props.title.fontColor);
  const imageBorderColor = getThemeColorCssValue(props.image.borderColor);
  const itemTitleColor = getThemeColorCssValue(styles.itemTitle.fontColor);
  const itemDescriptionColor = getThemeColorCssValue(
    styles.itemDescription.fontColor,
  );
  const iconBorderColor = getThemeColorCssValue(styles.iconBorderColor);
  const iconBackgroundColor = getThemeColorCssValue(styles.iconBackgroundColor);
  const iconColor = isDarkColor(styles.iconBackgroundColor, streamDocument)
    ? "white"
    : "black";

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatAmenitiesSection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          background={props.section.backgroundColor}
          style={{
            ...sectionStyle,
            borderTop: "1px solid var(--colors-palette-primary)",
          }}
        >
          <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 md:px-8 xl:grid xl:grid-cols-[0.95fr_1.05fr] xl:px-10">
            <div
              className="hidden overflow-hidden rounded-2xl border xl:relative xl:block xl:min-h-0 xl:self-stretch"
              style={{
                borderColor: imageBorderColor,
              }}
            >
              <EntityField
                displayName="Amenities Image"
                fieldId={props.image.image.field}
                constantValueEnabled={props.image.image.constantValueEnabled}
              >
                {image ? (
                  <Image
                    image={image}
                    className="h-full w-full xl:absolute xl:inset-0"
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
            <div className="flex flex-col gap-6">
              <EntityField
                displayName="Amenities Title"
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
                displayName="Amenities"
                fieldId={props.features.field}
                constantValueEnabled={props.features.constantValueEnabled}
              >
                <div className="flex flex-col gap-6">
                  {features.map((item, index) => {
                    const resolvedIconImageProps = resolveAmenityIconImage(
                      styles.iconImage,
                    );
                    const itemTitle = item.title
                      ? resolveComponentData(
                          item.title,
                          locale,
                          streamDocument,
                        ) || ""
                      : "";
                    const description = item.description
                      ? resolveComponentData(
                          item.description,
                          locale,
                          streamDocument,
                        )
                      : undefined;
                    const iconImage = item.iconImage;
                    const ctaLabel = item.ctaLabel
                      ? resolveComponentData(
                          item.ctaLabel,
                          locale,
                          streamDocument,
                        )
                      : "";
                    const ctaLink = item.ctaLink
                      ? resolveComponentData(
                          item.ctaLink,
                          locale,
                          streamDocument,
                        )
                      : "#";
                    const ctaValue: Partial<ComprehensiveCTAValue> = {
                      ...featureAction,
                      data: {
                        ...createTextCta("Learn More").data,
                        ...featureAction.data,
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

                    return (
                      <article key={index} className={index > 0 ? "pt-2" : ""}>
                        <div className="flex items-start gap-5">
                          <div
                            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[16px] border text-current"
                            style={{
                              borderColor:
                                iconBorderColor ??
                                titleColor ??
                                "var(--colors-palette-primary)",
                              backgroundColor:
                                iconBackgroundColor ??
                                "var(--colors-palette-secondary)",
                              color: iconColor,
                              borderRadius:
                                resolveBorderRadius(
                                  resolvedIconImageProps.styles?.borderRadius,
                                ) ?? "16px",
                              overflow: "hidden",
                            }}
                          >
                            {renderAmenityIcon({
                              iconImage,
                              iconImageProps: resolvedIconImageProps,
                              fallbackIcon: React.createElement(
                                amenityIcons[index] ?? amenityIcons[0],
                                {
                                  className: "h-[30px] w-[30px]",
                                },
                              ),
                            })}
                          </div>
                          <div className="flex flex-col gap-2">
                            <h3
                              className="m-0"
                              style={{
                                ...resolveStyledTextStyles(
                                  styles.itemTitle.styles,
                                  styles.itemTitle.fontColor,
                                  sectionForeground,
                                  "var(--fontFamily-h4-fontFamily)",
                                  "var(--fontSize-h4-fontSize)",
                                  "var(--fontWeight-h4-fontWeight)",
                                  "var(--textTransform-h4-textTransform)",
                                ),
                                color: itemTitleColor ?? sectionForeground,
                              }}
                            >
                              {itemTitle}
                            </h3>
                            {renderResolvedRichText(
                              description,
                              themeManagerCn(
                                "components rtf-theme rtf-wrapper m-0 font-body-fontFamily font-body-fontWeight",
                              ),
                              {
                                ...resolveStyledTextStyles(
                                  styles.itemDescription.styles,
                                  styles.itemDescription.fontColor,
                                  sectionForeground,
                                  "var(--fontFamily-body-fontFamily)",
                                  "1rem",
                                  "var(--fontWeight-body-fontWeight)",
                                ),
                                ...resolveBodyTypographyVariables(
                                  styles.itemDescription.styles,
                                ),
                                color:
                                  itemDescriptionColor ?? sectionForeground,
                              },
                            )}
                            <ComprehensiveCTA
                              value={ctaValue}
                              eventName={`amenityLink${index}`}
                              className="justify-start text-sm font-medium underline-offset-4 hover:underline"
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
                        </div>
                      </article>
                    );
                  })}
                </div>
              </EntityField>
            </div>

            <div
              className="overflow-hidden rounded-2xl border xl:hidden"
              style={{ borderColor: imageBorderColor }}
            >
              <EntityField
                displayName="Amenities Image"
                fieldId={props.image.image.field}
                constantValueEnabled={props.image.image.constantValueEnabled}
              >
                {image ? (
                  <Image
                    image={image}
                    className="h-full w-full md:max-h-[400px] lg:max-h-none"
                    style={{
                      display: "block",
                      height: "auto",
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
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatAmenitiesSection: YextComponentConfig<ResortAndRetreatAmenitiesSectionProps> =
  {
    label: "Amenities Section",
    fields: ResortAndRetreatAmenitiesSectionFields,
    defaultProps: {
      title: createStyledTextDefault("Resort Amenities"),
      featureStyles: {
        itemTitle: defaultSharedTextStyles,
        itemDescription: defaultSharedTextStyles,
        iconBorderColor: defaultIconBorderColor,
        iconBackgroundColor: defaultIconBackgroundColor,
        iconImage: defaultAmenityIconPresentation,
        action: createTextCta("Learn More"),
      },
      image: {
        image: {
          field: "",
          constantValue: {
            url: "https://a.mktgcdn.com/p/fbSbItkZpsHpkc8qHH7GxvQkWzxsfm6mGc0k4Lmfl-A/1267x1900.jpg",
            width: 1267,
            height: 1900,
          },
          constantValueEnabled: true,
        },
        imageConstrain: "filled",
        borderColor: {
          selectedColor: "palette-primary",
          contrastingColor: "palette-primary-contrast",
        },
      },
      features: amenityItemSource.defaultValue,
      section: {
        visibleOnLivePage: true,
        backgroundColor: {
          selectedColor: "white",
          contrastingColor: "black",
        },
      },
    },
    render: (props) => (
      <ResortAndRetreatAmenitiesSectionComponent {...props} />
    ),
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatAmenitiesSection",
  displayName: "Amenities Section",
  description: "Amenities Section",
  pageSetTypes: ["ENTITY"],
};
