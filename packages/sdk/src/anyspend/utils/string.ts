export const capitalizeFirstLetter = (stringToCapitalize: string): string => {
  if (!stringToCapitalize) return "";
  return stringToCapitalize.charAt(0).toUpperCase() + stringToCapitalize.slice(1);
};
