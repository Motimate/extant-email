import {
  createStitches as createCss,
  CSS as StitchesCss,
} from "@stitches/react";
export type { VariantProps as StitchesVariants } from "@stitches/react";

export const stitches = createCss({
  prefix: "",
  theme: {},
  utils: {},
});

export type CSS = StitchesCss<typeof stitches>;

export const {
  css,
  styled,
  globalCss: global,
  theme,
  config,
  keyframes,
  getCssText: getCssString,
} = stitches;
