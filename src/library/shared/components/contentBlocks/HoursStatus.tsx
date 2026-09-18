import { useTranslation } from "react-i18next";
import { PuckComponent } from "@puckeditor/core";
import {
  HoursStatus as HoursStatusComponent,
  HoursType,
  StatusParams,
} from "@yext/pages-components";
import type { TFunction } from "i18next";
import { useDocument } from "@yext/visual-editor/section-library-support";
import { resolveComponentData } from "@yext/visual-editor/section-library-support";
import { EntityField } from "@yext/visual-editor/section-library-support";
import { YextEntityField } from "@yext/visual-editor/section-library-support";
import { msg, pt } from "@yext/visual-editor/section-library-support";
import { resolveDataFromParent } from "@yext/visual-editor/section-library-support";
import { YextComponentConfig, YextFields } from "@yext/visual-editor/section-library-support";

export interface HoursStatusProps {
  data: {
    /** The hours field to display the status for */
    hours: YextEntityField<HoursType>;
  };

  styles: {
    /** Whether to show the open status ("Open Now" or "Closed") */
    showCurrentStatus?: boolean;
    /** The time format to use */
    timeFormat?: "12h" | "24h";
    /** The day of week format ("Mon" vs. "Monday") */
    dayOfWeekFormat?: "short" | "long";
    /** Whether to show day names ("Monday", "Tuesday") */
    showDayNames?: boolean;
    /** Additional class names to apply to the underlying component */
    className?: string;
    /** The body size variant */
    bodyVariant?: "lg" | "base" | "sm";
  };

  /** @internal */
  parentData?: {
    field: string;
    hours?: HoursType;
    comingSoon?: boolean;
    timezone?: string;
  };
}

export const hoursStatusWrapperFields: YextFields<HoursStatusProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      hours: {
        type: "entityField",
        label: msg("fields.hours", "Hours"),
        filter: {
          types: ["type.hours"],
        },
      },
    },
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      showCurrentStatus: {
        label: msg("fields.showCurrentStatus", "Show Current Status"),
        type: "radio",
        options: [
          { label: msg("fields.options.yes", "Yes"), value: true },
          { label: msg("fields.options.no", "No"), value: false },
        ],
      },
      timeFormat: {
        label: msg("fields.timeFormat", "Time Format"),
        type: "radio",
        options: [
          { label: msg("fields.options.hour12", "12-hour"), value: "12h" },
          { label: msg("fields.options.hour24", "24-hour"), value: "24h" },
        ],
      },
      showDayNames: {
        label: msg("fields.showDayNames", "Show Day Names"),
        type: "radio",
        options: [
          { label: msg("fields.options.yes", "Yes"), value: true },
          { label: msg("fields.options.no", "No"), value: false },
        ],
      },
      dayOfWeekFormat: {
        label: msg("fields.dayOfWeekFormat", "Day of Week Format"),
        type: "radio",
        options: [
          { label: msg("fields.options.short", "Short"), value: "short" },
          { label: msg("fields.options.long", "Long"), value: "long" },
        ],
      },
    },
  },
};

const HoursStatusWrapper: PuckComponent<HoursStatusProps> = ({
  data,
  styles,
  puck,
  parentData,
}) => {
  const streamDocument = useDocument();
  const { t, i18n } = useTranslation();
  const comingSoon = parentData?.comingSoon ?? !!streamDocument.comingSoon;
  const hours =
    parentData?.hours ??
    resolveComponentData(data.hours, i18n.language, streamDocument);
  const timezone = parentData?.timezone ?? streamDocument.timezone;

  return hours || comingSoon ? (
    <EntityField
      displayName={parentData ? parentData.field : pt("hours", "Hours")}
      fieldId={data.hours.field}
      constantValueEnabled={!parentData && data.hours.constantValueEnabled}
    >
      <HoursStatusComponent
        hours={hours ?? {}}
        comingSoon={comingSoon}
        timezone={timezone}
        className={styles.className}
        dayOptions={{ weekday: styles.dayOfWeekFormat ?? "long" }}
        timeOptions={
          styles.timeFormat
            ? { hour12: styles.timeFormat === "12h" }
            : undefined
        }
        statusTemplate={(params: StatusParams) =>
          renderHoursStatusTemplate(
            params,
            t,
            i18n.language,
            styles.showCurrentStatus ?? true,
            styles.showDayNames ?? true,
          )
        }
      />
    </EntityField>
  ) : puck.isEditing ? (
    <div className="h-10" />
  ) : (
    <></>
  );
};

const isOpen24h = (params: StatusParams): boolean =>
  params.currentInterval?.is24h?.() || false;

const isIndefinitelyClosed = (params: StatusParams): boolean =>
  !params.futureInterval;

const renderCurrentStatus = (
  params: StatusParams,
  t: TFunction,
): React.ReactNode => {
  if (params.comingSoon) {
    return (
      <span className="HoursStatus-current">
        {t("comingSoon", "Coming Soon")}
      </span>
    );
  }

  if (isOpen24h(params)) {
    return (
      <span className="HoursStatus-current">
        {t("open24Hours", "Open 24 Hours")}
      </span>
    );
  }

  if (isIndefinitelyClosed(params)) {
    return (
      <span className="HoursStatus-current">
        {t("temporarilyClosed", "Temporarily Closed")}
      </span>
    );
  }

  return (
    <span className="HoursStatus-current">
      {params.isOpen ? t("openNow", "Open Now") : t("closed", "Closed")}
    </span>
  );
};

const renderHoursStatusTemplate = (
  params: StatusParams,
  t: TFunction,
  locale: string,
  showCurrentStatus: boolean,
  showDayNames: boolean,
): React.ReactNode => {
  const isFuture = !isOpen24h(params) && !isIndefinitelyClosed(params);
  const interval = params.isOpen
    ? params.currentInterval
    : params.futureInterval;
  const time = params.isOpen
    ? (interval?.getEndTime(locale, params.timeOptions) ?? "")
    : (interval?.getStartTime(locale, params.timeOptions) ?? "");
  const dayOfWeek = showDayNames
    ? params.isOpen
      ? (interval?.end?.setLocale(locale).toLocaleString(params.dayOptions) ??
        "")
      : (interval?.start?.setLocale(locale).toLocaleString(params.dayOptions) ??
        "")
    : "";
  let futureStatus = "";

  if (isFuture && params.isOpen) {
    futureStatus = dayOfWeek
      ? t("closesAtTimeWeek", "Closes at {{time}} {{dayOfWeek}}", {
          time,
          dayOfWeek,
        })
      : t("closesAtTime", "Closes at {{time}}", { time });
  } else if (isFuture) {
    futureStatus = dayOfWeek
      ? t("opensAtTimeWeek", "Opens at {{time}} {{dayOfWeek}}", {
          time,
          dayOfWeek,
        })
      : t("opensAtTime", "Opens at {{time}}", { time });
  }

  return (
    <div className="HoursStatus">
      {(showCurrentStatus || params.comingSoon) && renderCurrentStatus(params, t)}
      {!params.comingSoon && showCurrentStatus && isFuture ? (
        <span className="HoursStatus-separator"> • </span>
      ) : null}
      {!params.comingSoon && futureStatus ? (
        <span className="HoursStatus-future">{futureStatus}</span>
      ) : null}
    </div>
  );
};

export const HoursStatus: YextComponentConfig<HoursStatusProps> = {
  label: msg("components.hoursStatus", "Hours Status"),
  fields: hoursStatusWrapperFields,
  defaultProps: {
    data: {
      hours: {
        field: "hours",
        constantValue: {},
      },
    },
    styles: {
      showCurrentStatus: true,
      timeFormat: "12h",
      showDayNames: true,
      dayOfWeekFormat: "long",
      className: "",
    },
  },
  resolveFields: (data) =>
    resolveDataFromParent(hoursStatusWrapperFields, data),
  render: (props) => <HoursStatusWrapper {...props} />,
};
