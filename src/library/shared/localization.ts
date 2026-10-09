import type { TFunction } from "i18next";
import {
  formatDistance,
  fromMeters,
  getPreferredDistanceUnit,
} from "@yext/visual-editor/section-library-support";

export const formatRating = (rating: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);

/** Format the displayed count without changing i18next's numeric plural input. */
export const getLocalizedCountOptions = (
  count: number,
  locale: string,
  values: Record<string, string> = {},
) => {
  const formatter = new Intl.NumberFormat(locale);
  return {
    count,
    replace: { ...values, count: formatter.format(count) },
  };
};

type Coordinate = { latitude?: number; longitude?: number };

const EARTH_RADIUS_METERS = 6_371_000;

export const calculateDistanceMeters = (
  origin?: Coordinate,
  destination?: Coordinate,
): number | undefined => {
  if (
    origin?.latitude === undefined ||
    origin.longitude === undefined ||
    destination?.latitude === undefined ||
    destination.longitude === undefined
  ) {
    return undefined;
  }
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistanceAway = (
  distanceMeters: number,
  locale: string,
  t: TFunction,
): string => {
  const unit = getPreferredDistanceUnit(locale);
  const distance = fromMeters(distanceMeters, unit);
  const count = Math.round(distance * 10) / 10;
  return t("distanceAway", "{{distance}} {{unit}} away", {
    distance: formatDistance(distance, locale, 0, 1),
    unit: t(unit, { count, defaultValue: unit }),
  });
};
