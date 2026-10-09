import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createInstance } from "i18next";
import {
  calculateDistanceMeters,
  formatDistanceAway,
  formatRating,
  getLocalizedCountOptions,
} from "../src/library/shared/localization";

test("ratings use the locale's decimal separator", () => {
  assert.equal(formatRating(4.5, "en"), "4.5");
  assert.equal(formatRating(4.5, "fr"), "4,5");
  assert.equal(formatRating(4, "de"), "4,0");
});

test("counts use numeric plural selection and localized display with other interpolations", async (t) => {
  for (const locale of ["en", "fr", "de"]) {
    await t.test(locale, async () => {
      const i18n = createInstance();
      await i18n.init({
        lng: locale,
        resources: {
          [locale]: {
            translation: {
              reviews_one: "{{rating}} from {{count}} review",
              reviews_other: "{{rating}} from {{count}} reviews",
            },
          },
        },
      });
      const rating = formatRating(4.5, locale);
      assert.equal(
        i18n.t("reviews", getLocalizedCountOptions(1, locale, { rating })),
        `${rating} from 1 review`,
      );
      assert.equal(
        i18n.t("reviews", getLocalizedCountOptions(12345, locale, { rating })),
        `${rating} from ${new Intl.NumberFormat(locale).format(12345)} reviews`,
      );
    });
  }
});

test("nearby distance handles zero coordinates and missing coordinates", () => {
  assert.equal(
    calculateDistanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0 },
    ),
    0,
  );
  const meters = calculateDistanceMeters(
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
  );
  assert.ok(meters !== undefined && Math.abs(meters - 111195) < 1);
  assert.equal(
    calculateDistanceMeters(undefined, { latitude: 0, longitude: 0 }),
    undefined,
  );
  assert.equal(
    calculateDistanceMeters({ latitude: 0 }, { latitude: 0, longitude: 0 }),
    undefined,
  );
});

test("nearby distance uses translated units, locale decimals and appropriate plural", async (t) => {
  for (const { locale, meters, expected } of [
    { locale: "en", meters: 0, expected: "0 miles away" },
    { locale: "en", meters: 1609.344, expected: "1 mile away" },
    { locale: "en", meters: 3218.688, expected: "2 miles away" },
    { locale: "en-GB", meters: 3218.688, expected: "2 miles away" },
    { locale: "de", meters: 1609.344, expected: "1,6 Kilometer entfernt" },
    { locale: "es", meters: 1500, expected: "A 1,5 kilómetros de distancia" },
  ]) {
    await t.test(`${locale}: ${meters}`, async () => {
      const catalog = JSON.parse(
        await readFile(
          new URL(`../src/library/i18n/page/${locale}.json`, import.meta.url),
          "utf8",
        ),
      );
      const i18n = createInstance();
      await i18n.init({
        lng: locale,
        resources: { [locale]: { translation: catalog } },
      });
      assert.equal(formatDistanceAway(meters, locale, i18n.t), expected);
    });
  }
});
