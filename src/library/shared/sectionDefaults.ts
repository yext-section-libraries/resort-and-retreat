import {
  getDefaultRTF,
  type StyledTextValue,
  type TranslatableAssetImage,
  type TranslatableRichText,
  type TranslatableString,
  type YextEntityField,
} from "@yext/visual-editor";

export const defaultTextStyles: StyledTextValue = {
  fontFamily: "default",
  fontSize: "default",
  fontWeight: "default",
  fontStyle: "default",
  textTransform: "default",
};

export const createStringFieldDefault = (
  defaultValue: string,
): YextEntityField<TranslatableString> => ({
  field: "",
  constantValue: { defaultValue, hasLocalizedValue: "true" },
  constantValueEnabled: true,
});

export const createRichTextFieldDefault = (
  defaultValue: string,
): YextEntityField<TranslatableRichText> => ({
  field: "",
  constantValue: {
    defaultValue: getDefaultRTF(defaultValue),
    hasLocalizedValue: "true",
  },
  constantValueEnabled: true,
});

export const createImageFieldDefault = (
  url = "",
  width = 0,
  height = 0,
): YextEntityField<TranslatableAssetImage> => ({
  field: "",
  constantValue: { url, width, height },
  constantValueEnabled: true,
});
