import * as Yup from "yup";
import { fresherOrExperience, Position, Status } from "./EmployeeConfig.js";

export const adminSignUpSchema30 = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  name: Yup.string().required("Name is required"),
  mobile: Yup.string().required("Mobile number is required"),
  fresherOrExperience: Yup.string()
    .oneOf([fresherOrExperience.EXPERIENCE, fresherOrExperience.FRESHER])
    .required("Select one of these"),
  email: Yup.string()
    // .matches("/S+@S+.S+/", "Please enter valid email")
    .required("Email is required"),
  dob: Yup.date()
    .required("Date of birth is required")
    .max(new Date(Date.now() - 567648000000), "You must be at least 18 years"),
  position: Yup.string()
    .oneOf([
      Position.SUPER_ADMIN,
      Position.ADMIN,
      Position.AM,
      Position.CD,
      Position.BM,
      Position.CDM,
      Position.CM,
      Position.FM,
      Position.LD,
      Position.LM,
      Position.PM,
      Position.SM,
      Position.VD,
    ])
    .required("Position is required"),

  branch: Yup.string().when("position", {
    is: (val) =>
      val !== Position.ADMIN &&
      val !== Position.SM &&
      val !== Position.CM &&
      val !== Position.SUPER_ADMIN,
    then: () => Yup.string().required("Branch is required"),
    otherwise: () => Yup.string().notRequired(),
  }),

  state: Yup.string().when("position", {
    is: (val) =>
      val !== Position.ADMIN &&
      val !== Position.SM &&
      val !== Position.CM &&
      val !== Position.SUPER_ADMIN,
    then: () => Yup.string().required("State is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  country: Yup.string().when("position", {
    is: (val) =>
      val !== Position.ADMIN &&
      val !== Position.SM &&
      val !== Position.CM &&
      val !== Position.SUPER_ADMIN,
    then: () => Yup.string().required("Country is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
  city: Yup.string().when("position", {
    is: (val) =>
      val !== Position.ADMIN &&
      val !== Position.SM &&
      val !== Position.CM &&
      val !== Position.SUPER_ADMIN,
    then: () => Yup.string().required("City is required"),
    otherwise: () => Yup.string().notRequired(),
  }),
});

export const educationOrCompanyDetailSchema30 = Yup.object().shape({
  education: Yup.array()
    .of(
      Yup.object().shape({
        boardName: Yup.string().required("Board name is required"),
        passingYear: Yup.string()
          .required("Passing year is required")
          .matches(/^\d{4}$/, "Enter a valid year"),
        marksPercentage: Yup.string()
          .required("Marks percentage is required")
          .matches(
            /^(100(\.0{1,2})?|(\d{1,2})(\.\d{1,2})?)$/,
            "Enter a valid percentage"
          ),
        resultImage: Yup.string().required("Marksheet is required"),
      })
    )
    .required("Education details are required")
    .min(1, "At least one education detail is required"),

  workDetail: Yup.array().when("fresherOrExperience", {
    is: (val) => val === fresherOrExperience.EXPERIENCE, // Check for "EXPERIENCE"
    then: (schema) =>
      schema
        .of(
          Yup.object().shape({
            companyName: Yup.string().required("Company name is required"),
            position: Yup.string().required("Position is required"),
            startingYear: Yup.string().required("Starting year is required"),
            endingYear: Yup.string().required("Ending year is required"),
            experienceLetter: Yup.string().required(
              "Experience Letter is required"
            ),
            relievingLetter: Yup.string().required(
              "Relieving Letter is required"
            ),
            appointmentLetter: Yup.string().required(
              "Appointment Letter is required"
            ),
            salarySlip: Yup.string().required("Salary Slip is required"),
          })
        )
        .min(1, "At least one work detail is required")
        .required("Work details are required"), // Validate if EXPERIENCE
    otherwise: (schema) => schema.notRequired(), // If FRESHER, it is not required
  }),
});
export const documentsSchema20 = Yup.object().shape({
  aadharNumber: Yup.string().required("Aadhar number is required"),
  // .matches("^d{12}$", "Enter valid Aadhar number"),
  voterNumber: Yup.string().required("Voter number is required"),
  // .matches("/^[A-Z]{3}d{7}$/", "Enter valid voter number"),
  panNumber: Yup.string().required("Pan number is required"),
  // .matches("/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/", "Enter valid pan number"),
  passportNumber: Yup.string(),
  // .required("Passport number is required")
  // .matches("/^[A-Z]{1}[0-9]{7}$/", "Enter valid Passport number"),
});
export const accountDetailSchema20 = Yup.object().shape({
  bankName: Yup.string().required("Bank name is required"),
  accountNumber: Yup.string().required("Account number is required"),
  // .matches("/^d{9,18}$/", "Enter valid Account number"),
  bankBranchName: Yup.string().required("Branch name is required"),
  ifsc: Yup.string().required("IFSC code is required"),
});
