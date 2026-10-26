import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  // Tanpa telemetri ke Storybook (privasi; tidak dibutuhkan proyek).
  core: { disableTelemetry: true },
  framework: "@storybook/react-vite",
  // Story di app ini, bukan di design-system, agar paket library tidak
  // bergantung pada Storybook.
  stories: ["../src/**/*.stories.tsx"],
};

export default config;
