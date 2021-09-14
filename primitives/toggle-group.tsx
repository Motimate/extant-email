import { styled } from "@stitches/react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import tw from "twin.macro";

const StyledToggleGroup = styled(ToggleGroupPrimitive.Root, {
  ...tw`inline-flex bg-gray-100 justify-start rounded-md overflow-hidden flex-wrap border shadow-md`,
});

const StyledItem = styled(ToggleGroupPrimitive.Item, {
  ...tw`
    bg-white text-gray-400 py-2 px-4 flex text-base leading-tight transition ease-in-out duration-300
    last:(rounded-tr-md rounded-br-md ml-0)
    first:(rounded-tl-md rounded-bl-md)
    focus:(relative shadow-md)
    hover:(bg-blue-50)
  `,
  "&[data-state=on]": tw`bg-blue-100 text-blue-600`,
});

export const ToggleGroup = StyledToggleGroup;
export const ToggleGroupItem = StyledItem;
