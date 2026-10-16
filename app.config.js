// Extends app.json. google-services.json isn't committed (the repo is
// public): EAS builds get it from the GOOGLE_SERVICES_JSON file variable,
// local builds use a copy in the project root.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
});
