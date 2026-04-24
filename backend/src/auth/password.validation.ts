/** Shared rules for API passwords (login/register/admin). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include at least one letter and one number';
