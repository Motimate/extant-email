import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`font-semibold px-6 py-3 rounded-lg transform transition ease-in-out duration-200 outline-none`,
  ...tw`focus:(outline-none)`,

  variants: {
    variant: {
      primary: tw`
        bg-blue-500 text-white
        focus:(ring-2 ring-offset-1 ring-blue-300)
        hover:(bg-blue-600)
      `,
      secondary: tw`
        bg-gray-300 text-gray-900
        focus:(ring-2 ring-offset-1 ring-gray-200)
        hover:(bg-gray-400)
      `,
      danger: tw`
        bg-red-500 text-white
        focus:(ring-2 ring-offset-1 ring-red-300)
        hover:(bg-red-600)
      `,
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export default Button;
