// eslint.config.js - minimal config for ESLint v9
import eslint from "@eslint/js";

export default [
    eslint.configs.recommended,
    {
        // Environment settings to recognize browser globals and Node globals
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                atob: "readonly",
                URL: "readonly",
                navigator: "readonly",
                File: "readonly",
                require: "readonly",
                Buffer: "readonly",
                console: "readonly",
                process: "readonly"
            }
        },
        // Enable both browser and node environments
        linterOptions: {
            // No specific options needed here
        },
        // Add any custom rules here
        rules: {
            // Example: turn off prop-types rule for React (if using React)
            "react/prop-types": "off",
            // Allow undefined globals for browser APIs
            "no-undef": "off"
        }
    }
];
