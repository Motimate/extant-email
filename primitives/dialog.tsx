import { styled, keyframes } from "@stitches/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PropsWithChildren } from "react";
import tw from "twin.macro";

const overlayShow = keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const contentShow = keyframes({
  "0%": { opacity: 0, transform: "translate(-50%, -48%) scale(.96)" },
  "100%": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  ...tw`bg-black opacity-30 fixed inset-0`,
});

function Root({
  children,
  ...props
}: PropsWithChildren<DialogPrimitive.DialogProps>) {
  return (
    <DialogPrimitive.Root {...props}>
      <StyledOverlay />
      {children}
    </DialogPrimitive.Root>
  );
}

const StyledContent = styled(DialogPrimitive.Content, {
  ...tw`bg-white rounded-lg fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 focus:(outline-none)`,
  boxShadow:
    "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
  //transform: "translate(-50%, -50%)",
  width: "90vw",
  maxWidth: "900px",
  maxHeight: "85vh",
  padding: 25,
  "@media (prefers-reduced-motion: no-preference)": {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: "transform",
  },
});

const StyledTitle = styled(DialogPrimitive.Title, {
  ...tw`m-0 font-medium text-black text-lg`,
});

const StyledDescription = styled(DialogPrimitive.Description, {
  ...tw`mt-2.5 mr-0 mb-5 ml-0 text-black text-base leading-normal`,
  //margin: "10px 0 20px",
});

// Exports
export const Dialog = Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = StyledContent;
export const DialogTitle = StyledTitle;
export const DialogDescription = StyledDescription;
export const DialogClose = DialogPrimitive.Close;
