import branch from "./branch.model.js";

export const GenerateBranchCode = async (country, state, city, pincode) => {
  const branchList = await branch.find({});
  const sanitizedCountry = country.trim().toUpperCase().slice(0, 2);
  const sanitizedState = state.trim().toUpperCase().slice(0, 2);
  const sanitizedCity = city.trim().toUpperCase().slice(0, 2);
  const sanitizedPincode = pincode.toString().trim().slice(0, 2);
  const branchLeght = branchList.length + 1;

  const baseString =
    sanitizedCountry +
    sanitizedState +
    sanitizedCity +
    sanitizedPincode +
    branchLeght;

  let uniqueCode = baseString.padEnd(15, "");

  return uniqueCode;
};
