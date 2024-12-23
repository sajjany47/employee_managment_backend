import * as Yup from "yup";

export const primaryMenuSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
});

export const childMenuSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  primaryMenu: Yup.string().required("Primary Menu is required"),
  path: Yup.string().required("Path is required"),
});

export const PositionSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  menu: Yup.array()
    .required("Menu is required")
    .min(1, "Minimum one menu is required"),
});

export const ConvertToSlug = (str) => {
  return str.toLowerCase().replace(/\s+/g, "-");
};
