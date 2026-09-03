import type { SectionConfig } from "@yext/visual-editor";

import * as React from "react";
import type { PuckComponent } from "@puckeditor/core";
import { AnalyticsScopeProvider, Link } from "@yext/pages-components";
import {
  Background,
  getAnalyticsScopeHash,
  getThemeColorCssValue,
  resolveBreadcrumbs,
  type StyledTextValue,
  type ThemeColor,
  type YextComponentConfig,
  type YextFields,
  useDocument,
  useTemplateProps,
  VisibilityWrapper,
} from "@yext/visual-editor";

type ResortAndRetreatBreadcrumbsProps = {
  includeCurrentLocation: boolean;
  styles: StyledTextValue;
  section: {
    backgroundColor: ThemeColor;
    visibleOnLivePage: boolean;
  };
};

const ResortAndRetreatBreadcrumbsFields: YextFields<ResortAndRetreatBreadcrumbsProps> =
  {
    includeCurrentLocation: {
      label: "Include Current Location",
      type: "radio",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    styles: {
      label: "Text Styles",
      type: "styledText",
    },
    section: {
      label: "Section",
      type: "object",
      objectFields: {
        backgroundColor: {
          label: "Background Color",
          type: "basicSelector",
          options: "BACKGROUND_COLOR",
        },
        visibleOnLivePage: {
          label: "Visible on Live Page",
          type: "radio",
          options: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
        },
      },
    },
  };

/** Renders document-backed directory breadcrumbs with template-relative links. */
const ResortAndRetreatBreadcrumbsComponent: PuckComponent<
  ResortAndRetreatBreadcrumbsProps
> = (props) => {
  const streamDocument = useDocument();
  const { relativePrefixToRoot } = useTemplateProps();
  const breadcrumbs = resolveBreadcrumbs(streamDocument);
  const visibleBreadcrumbs =
    props.includeCurrentLocation || breadcrumbs.length <= 1
    ? breadcrumbs
    : breadcrumbs.slice(0, -1);
  const currentPageIndex = breadcrumbs.length - 1;
  const currentPageLabel = streamDocument.name ?? "";
  const textColor =
    getThemeColorCssValue(props.section.backgroundColor.contrastingColor) ??
    "currentColor";

  if (!visibleBreadcrumbs.length) {
    return props.puck.isEditing ? (
      <p
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "18px 24px",
        }}
      >
        No breadcrumbs available (section will be hidden on live page). Create a
        directory to enable breadcrumbs.
      </p>
    ) : (
      <></>
    );
  }

  return (
    <VisibilityWrapper
      liveVisibility={props.section.visibleOnLivePage}
      isEditing={props.puck.isEditing}
    >
      <AnalyticsScopeProvider
        name={`ResortAndRetreatBreadcrumbs${getAnalyticsScopeHash(props.id)}`}
      >
        <Background as="section" background={props.section.backgroundColor}>
          <nav
            aria-label="Breadcrumb"
            className="mx-auto max-w-[1360px] px-5 py-3 md:px-8 xl:px-10"
            style={{ color: textColor }}
          >
            <ol
              className="m-0 flex list-none flex-wrap items-center gap-y-1 p-0 tracking-wide"
              style={{
                fontFamily:
                  props.styles.fontFamily === "default"
                    ? "var(--fontFamily-body-fontFamily)"
                    : props.styles.fontFamily,
                fontSize:
                  props.styles.fontSize === "default"
                    ? "var(--fontSize-body-fontSize)"
                    : props.styles.fontSize,
                fontWeight:
                  props.styles.fontWeight === "default"
                    ? "var(--fontWeight-body-fontWeight)"
                    : props.styles.fontWeight,
                fontStyle:
                  props.styles.fontStyle === "default"
                    ? "var(--fontStyle-body-fontStyle)"
                    : props.styles.fontStyle,
                textTransform:
                  props.styles.textTransform === "default"
                    ? "var(--textTransform-body-textTransform)"
                    : props.styles.textTransform,
              }}
            >
              {visibleBreadcrumbs.map(({ name, slug }, position) => {
                const isCurrentPage =
                  props.includeCurrentLocation && position === currentPageIndex;
                const label =
                  isCurrentPage && currentPageLabel ? currentPageLabel : name;
                const href = relativePrefixToRoot
                  ? relativePrefixToRoot + slug
                  : slug;

                return (
                  <React.Fragment key={`${position}-${slug}`}>
                    {position > 0 && (
                      <li aria-hidden="true" className="mx-3 opacity-60">
                        /
                      </li>
                    )}
                    <li className="min-w-0">
                      {isCurrentPage ? (
                        <span
                          aria-current="page"
                          className="break-words opacity-80"
                        >
                          {label}
                        </span>
                      ) : (
                        <Link
                          cta={{ link: href, linkType: "URL" }}
                          eventName={`breadcrumb${position}`}
                          className="break-words underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        </Background>
      </AnalyticsScopeProvider>
    </VisibilityWrapper>
  );
};

export const ResortAndRetreatBreadcrumbs: YextComponentConfig<ResortAndRetreatBreadcrumbsProps> =
  {
    label: "Breadcrumbs",
    fields: ResortAndRetreatBreadcrumbsFields,
    defaultProps: {
      includeCurrentLocation: true,
      styles: {
        fontFamily: "default",
        fontSize: "default",
        fontWeight: "default",
        fontStyle: "default",
        textTransform: "default",
      },
      section: {
        backgroundColor: {
          selectedColor: "palette-tertiary",
          contrastingColor: "palette-tertiary-contrast",
        },
        visibleOnLivePage: true,
      },
    },
    render: ResortAndRetreatBreadcrumbsComponent,
  };

export const config: SectionConfig = {
  id: "ResortAndRetreatBreadcrumbs",
  displayName: "Breadcrumbs",
  description: "Breadcrumbs",
  pageSetTypes: ["ENTITY"],
};
