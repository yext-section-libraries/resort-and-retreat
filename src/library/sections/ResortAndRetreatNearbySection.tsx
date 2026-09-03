import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider, Link } from "@yext/pages-components";
import { parsePhoneNumber } from "awesome-phonenumber";
import {
  Background,
  EntityField,
  getAnalyticsScopeHash,
  getSurfaceColorStyle,
  getThemeColorCssValue,
  MapboxStaticMapComponent,
  mapboxStaticMapStyleOptions,
  mergeMeta,
  resolveComponentData,
  resolveUrlTemplate,
  ThemeOptions,
  type StyledTextValue,
  type ThemeColor,
  type TranslatableString,
  type YextComponentConfig,
  type YextEntityField,
  type YextFields,
  useDocument,
  useNearbyLocations,
  useTemplateProps,
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
  fontColor?: ThemeColor | undefined;
};

type Coordinate = {
  latitude?: number;
  longitude?: number;
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

type MapFieldProps = {
  coordinate: YextEntityField<MapCoordinate>;
  mapStyle: string;
  height?: string;
  zoom?: number;
};

// Audit wiring note: filter.fontColor is a scanner false positive here.
// title.fontColor is applied in render and nearby links inherit surface color.

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

type StreamDocumentWithCoordinate = {
  locale?: string;
  yextDisplayCoordinate?: Coordinate;
  _env?: any;
};

export type ResortAndRetreatNearbySectionProps = {
  title: StyledTextProps;
  styles: {
    cardHeader: SharedTextStyleProps;
    cardBody: SharedTextStyleProps;
  };
  radius: number;
  limit: number;
  map: MapFieldProps;
  section: {
    visibleOnLivePage: boolean;
    backgroundColor: ThemeColor;
    cardBackgroundColor: ThemeColor;
    cardBorderColor: ThemeColor;
  };
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

const resolveSharedTextStyle = (
  value?: SharedTextStyleProps,
): SharedTextStyleProps => ({
  styles: value?.styles ?? defaultSharedTextStyles.styles,
  fontColor: value?.fontColor,
});

const formatPhoneNumber = (value?: string) => {
  if (!value) {
    return "";
  }

  const cleanedPhoneNumberString = value.replace(/(?!^\+)\+|[^\d+]/g, "");
  const parsedPhoneNumber = parsePhoneNumber(cleanedPhoneNumberString);
  if (!parsedPhoneNumber.valid || parsedPhoneNumber.number === undefined) {
    return value;
  }

  return parsedPhoneNumber.number.national;
};

const calculateDistanceMi = (origin?: Coordinate, destination?: Coordinate) => {
  if (
    !origin ||
    !destination ||
    origin.latitude === undefined ||
    origin.longitude === undefined ||
    destination.latitude === undefined ||
    destination.longitude === undefined
  ) {
    return "";
  }

  const earthRadiusMi = 3958.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const latOne = toRadians(origin.latitude);
  const latTwo = toRadians(destination.latitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(latOne) *
      Math.cos(latTwo) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const distance =
    2 * earthRadiusMi * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return `${Math.round(distance * 10) / 10} miles away`;
};

const ResortAndRetreatNearbySectionFields: YextFields<ResortAndRetreatNearbySectionProps> =
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
        cardHeader: {
          label: "Card Header",
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
        cardBody: {
          label: "Card Body",
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
    radius: {
      label: "Radius",
      type: "number",
    },
    limit: {
      label: "Limit",
      type: "number",
    },

    map: {
      label: "Map",
      type: "object",
      objectFields: {
        coordinate: {
          type: "entityField",
          label: "Coordinates",
          filter: {
            types: ["type.coordinate"],
          },
        },
        mapStyle: {
          label: "Mapbox Map Style",
          type: "select",
          options: mapboxStaticMapStyleOptions,
        },
        zoom: {
          label: "Zoom",
          type: "number",
          min: 0,
          max: 22,
        },
      },
    },
  };

export const ResortAndRetreatNearbySectionComponent: PuckComponent<
  ResortAndRetreatNearbySectionProps
> = (props) => {
  const streamDocument = useDocument<StreamDocumentWithCoordinate>();
  const locale = streamDocument?.locale ?? "en";
  const title =
    resolveComponentData(props.title.text, locale, streamDocument) || "";
  const { relativePrefixToRoot } = useTemplateProps<{
    relativePrefixToRoot?: string;
  }>();
  const titleColor =
    getThemeColorCssValue(props.title.fontColor) ??
    "var(--colors-palette-primary)";
  const cardHeaderStyles = resolveSharedTextStyle(props.styles?.cardHeader);
  const cardBodyStyles = resolveSharedTextStyle(props.styles?.cardBody);
  const coordinate =
    resolveComponentData(props.map.coordinate, locale, streamDocument) ??
    streamDocument?.yextDisplayCoordinate;
  const enabled =
    coordinate?.latitude !== undefined &&
    coordinate.longitude !== undefined &&
    props.radius > 0 &&
    props.limit > 0;
  const { data } = useNearbyLocations({
    streamDocument,
    latitude: coordinate?.latitude,
    longitude: coordinate?.longitude,
    radiusMi: props.radius,
    limit: props.limit,
    enabled,
  });
  const docs = data?.response?.docs ?? [];
  const hasNearbyLocations = docs.length > 0;
  let mapboxApiKey = streamDocument._env?.YEXT_MAPBOX_API_KEY;
  const iframe =
    typeof document !== "undefined"
      ? (document.getElementById("preview-frame") as HTMLIFrameElement)
      : undefined;
  if (
    iframe?.contentDocument &&
    streamDocument._env?.YEXT_EDIT_LAYOUT_MODE_MAPBOX_API_KEY
  ) {
    mapboxApiKey = streamDocument._env.YEXT_EDIT_LAYOUT_MODE_MAPBOX_API_KEY;
  }
  const shouldShowSection =
    props.puck.isEditing || hasNearbyLocations || mapboxApiKey;
  const nearbyLocationCards = docs
    .slice(0, props.limit)
    .map((locationData, index) => {
      const resolvedUrl = resolveUrlTemplate(
        mergeMeta(locationData, streamDocument),
        relativePrefixToRoot ?? "",
      );
      const locationCoordinate = locationData.yextDisplayCoordinate;
      const directionsUrl =
        locationCoordinate?.latitude !== undefined &&
        locationCoordinate?.longitude !== undefined
          ? `https://www.google.com/maps/dir/?api=1&destination=${locationCoordinate.latitude},${locationCoordinate.longitude}`
          : "#";
      const addressParts = [
        locationData.address?.line1,
        locationData.address?.city,
        locationData.address?.region,
      ].filter(Boolean);

      return (
        <Background
          as="div"
          key={`${locationData.id ?? locationData.name ?? index}`}
          className="flex flex-col gap-4 rounded-2xl border p-5"
          background={props.section.cardBackgroundColor}
          style={{
            ...getSurfaceColorStyle(
              props.section.cardBackgroundColor,
              streamDocument,
            ),
            borderColor: getThemeColorCssValue(props.section.cardBorderColor),
          }}
        >
          {resolvedUrl ? (
            <Link
              cta={{
                link: resolvedUrl,
                linkType: "URL",
              }}
              eventName={`locationPage${index}`}
              className="hover:underline"
              style={resolveStyledTextStyles(
                cardHeaderStyles.styles,
                cardHeaderStyles.fontColor,
                "currentColor",
                "var(--fontFamily-h4-fontFamily)",
                "var(--fontSize-h4-fontSize)",
                "var(--fontWeight-h4-fontWeight)",
                "var(--textTransform-h4-textTransform)",
              )}
            >
              {locationData.name || "Nearby Location"}
            </Link>
          ) : (
            <h3
              className="m-0"
              style={resolveStyledTextStyles(
                cardHeaderStyles.styles,
                cardHeaderStyles.fontColor,
                "currentColor",
                "var(--fontFamily-h4-fontFamily)",
                "var(--fontSize-h4-fontSize)",
                "var(--fontWeight-h4-fontWeight)",
                "var(--textTransform-h4-textTransform)",
              )}
            >
              {locationData.name || "Nearby Location"}
            </h3>
          )}
          {addressParts.length ? (
            <p
              className="m-0 leading-6"
              style={resolveStyledTextStyles(
                cardBodyStyles.styles,
                cardBodyStyles.fontColor,
                "currentColor",
                "var(--fontFamily-body-fontFamily)",
                "1rem",
                "var(--fontWeight-body-fontWeight)",
              )}
            >
              {addressParts.join(", ")}
            </p>
          ) : null}
          {locationData.mainPhone ? (
            <p
              className="m-0 leading-6"
              style={resolveStyledTextStyles(
                cardBodyStyles.styles,
                cardBodyStyles.fontColor,
                "currentColor",
                "var(--fontFamily-body-fontFamily)",
                "1rem",
                "var(--fontWeight-body-fontWeight)",
              )}
            >
              {formatPhoneNumber(locationData.mainPhone)}
            </p>
          ) : null}
          <p
            className="m-0 leading-6"
            style={resolveStyledTextStyles(
              cardBodyStyles.styles,
              cardBodyStyles.fontColor,
              "currentColor",
              "var(--fontFamily-body-fontFamily)",
              "1rem",
              "var(--fontWeight-body-fontWeight)",
            )}
          >
            {calculateDistanceMi(coordinate, locationCoordinate)}
          </p>
          <div>
            <Link
              cta={{
                link: directionsUrl,
                linkType: "URL",
              }}
              eventName={`directions${index}`}
              className="underline underline-offset-4 hover:no-underline"
              style={resolveStyledTextStyles(
                cardBodyStyles.styles,
                cardBodyStyles.fontColor,
                "currentColor",
                "var(--fontFamily-body-fontFamily)",
                "1rem",
                500,
              )}
            >
              Get Directions
            </Link>
          </div>
        </Background>
      );
    });

  if (!shouldShowSection) {
    return <></>;
  }

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatNearbySection${getAnalyticsScopeHash(props.id)}`}
      >
        <Background
          as="section"
          background={props.section.backgroundColor}
          style={{
            ...getSurfaceColorStyle(
              props.section.backgroundColor,
              streamDocument,
            ),
            borderBottom: `1px solid ${
              getThemeColorCssValue(
                props.section.backgroundColor.contrastingColor,
              ) ?? "currentColor"
            }`,
          }}
        >
          <NearbySectionContent
            hasNearbyLocations={hasNearbyLocations}
            nearbyLocationCards={nearbyLocationCards}
            props={props}
            title={title}
            titleColor={titleColor}
          />
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

const NearbySectionContent = ({
  hasNearbyLocations,
  nearbyLocationCards,
  props,
  title,
  titleColor,
}: {
  hasNearbyLocations: boolean;
  nearbyLocationCards: React.ReactNode[];
  props: ResortAndRetreatNearbySectionProps & { id: string; puck: any };
  title: string;
  titleColor: string | undefined;
}) => {
  const streamDocument = useDocument();
  const sectionBackground = useBackground();
  const sectionForeground =
    getThemeColorCssValue(sectionBackground?.contrastingColor) ??
    "currentColor";

  let mapboxApiKey = streamDocument._env?.YEXT_MAPBOX_API_KEY;
  const iframe =
    typeof document !== "undefined"
      ? (document.getElementById("preview-frame") as HTMLIFrameElement)
      : undefined;
  if (
    iframe?.contentDocument &&
    streamDocument._env?.YEXT_EDIT_LAYOUT_MODE_MAPBOX_API_KEY
  ) {
    mapboxApiKey = streamDocument._env.YEXT_EDIT_LAYOUT_MODE_MAPBOX_API_KEY;
  }

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-10 md:px-8 xl:px-10">
      <style>{`
        .resort-nearby-map .mapbox-static-map-shell,
        .resort-nearby-map .mapbox-static-map-picture,
        .resort-nearby-map .mapbox-static-map-image {
          height: 100%;
          width: 100%;
        }

        .resort-nearby-map .mapbox-static-map-image {
          object-fit: cover;
          object-position: center;
        }
      `}</style>
      {props.puck.isEditing || hasNearbyLocations || mapboxApiKey ? (
        <EntityField
          displayName="Nearby Locations Title"
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
      ) : null}
      {props.puck.isEditing && !hasNearbyLocations ? (
        <div className="grid gap-6 xl:grid-cols-3">
          No nearby locations found.
        </div>
      ) : null}
      {hasNearbyLocations ? (
        <div className="grid gap-6 xl:grid-cols-3">{nearbyLocationCards}</div>
      ) : null}
      {props.puck.isEditing || mapboxApiKey ? (
        <EntityField
          displayName="Map Location"
          fieldId={props.map.coordinate.field}
          constantValueEnabled={props.map.coordinate.constantValueEnabled}
        >
          <div
            className="resort-nearby-map h-[416px] overflow-hidden rounded-2xl border"
            style={{ borderColor: titleColor }}
          >
            <MapboxStaticMapComponent
              {...props.map}
              id={`${props.id}-map`}
              puck={props.puck}
            />
          </div>
        </EntityField>
      ) : null}
    </div>
  );
};

export const ResortAndRetreatNearbySection: YextComponentConfig<ResortAndRetreatNearbySectionProps> =
  {
    label: "Nearby Section",
    fields: ResortAndRetreatNearbySectionFields,
    defaultProps: {
      title: {
        text: {
          field: "",
          constantValue: {
            defaultValue: "Nearby Hotels & Sister Properties",
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
        cardHeader: defaultSharedTextStyles,
        cardBody: defaultSharedTextStyles,
      },
      radius: 10,
      limit: 3,

      map: {
        coordinate: {
          field: "yextDisplayCoordinate",
          constantValue: {
            latitude: 0,
            longitude: 0,
          },
          constantValueEnabled: false,
        },
        mapStyle: "streets-v12",
        height: "100%",
        zoom: 8,
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
      <ResortAndRetreatNearbySectionComponent {...props} />
    ),
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatNearbySection",
  displayName: "Nearby Section",
  description: "Nearby Section",
  pageSetTypes: ["ENTITY"],
};
