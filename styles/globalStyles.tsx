import tw, { theme, globalStyles } from "twin.macro";
import { global } from "../stitches.config";

const customStyles = {
  body: {
    WebkitTapHighlightColor: theme`colors.blue.500`,
    ...tw`antialiased bg-gray-100`,
  },
};

const styles = () => {
  global(customStyles)();
  global(globalStyles as any)();
};

export default styles;
