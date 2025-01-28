import base from "@streamline-systems/universal-build-config/eslint-base.mjs";
import react from "eslint-plugin-react";

export default [
  ...base,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    rules: {
      "react/prop-types": "off",
    },
  },
];
