import { keyframes } from "@stitches/react";
import { styled } from "twin.macro";

const bounce = keyframes({
  "0%": { transform: "scaleY(0)" },
  "80%": { transform: "scaleY(1.03)" },
  "100%": { transform: "scaleY(1)" },
});

const Svg = styled.svg({
  animation: `${bounce} linear 600ms`,
  transformOrigin: "50% 100%",
  margin: "auto",
});

interface BarProps {
  width: string;
  height: string;
  data: string;
  color: string;
  percentage: string;
  value: string;
  name: string;
}
function SingleBar({
  width,
  height,
  data,
  color,
  percentage,
  value,
  name,
}: BarProps) {
  return (
    <div tw="flex flex-col items-center">
      <Svg style={{ marginLeft: 5 }} width={width} height={height}>
        <path d={data} fill={color} tw="rounded-md" />
      </Svg>
      <div tw="flex flex-col items-center justify-center space-y-1">
        <div tw="mt-2">
          <p tw="text-xs">
            {value} <span tw="text-xs text-gray-500">{percentage}</span>
          </p>
        </div>
        <p tw="text-xs capitalize">{name}</p>
      </div>
    </div>
  );
}

interface ListItem {
  percentage: number;
  value: number;
  name: string;
  color: string;
}

const max = 300;
export function Chart({ list }: { list: ListItem[] }) {
  return (
    <div tw="flex text-center flex-col items-center">
      <div tw="flex space-x-6">
        {list.map((e) => {
          const y = max - (max * e.percentage) / 100;

          return (
            <SingleBar
              key={e.name}
              width="80px"
              height="300px"
              color={e.color || "#ea1"}
              percentage={`(${Number(e.percentage).toFixed(1)} %)`}
              value={`${e.value}`}
              data={`M 0 ${max} 
              L 0 ${y + 5} 
              C 0 ${y + 5} 0 ${y} 5 ${y}
              L 75 ${y} 
              C 80 ${y} 80 ${y + 5} 80 ${y + 5}
              L 80 ${max} 
              Z`}
              name={e.name}
            />
          );
        })}
      </div>
    </div>
  );
}
