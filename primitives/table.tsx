/* eslint-disable react/jsx-key */
/* eslint-disable react/display-name */
import {
  useTable,
  useSortBy,
  useFilters,
  useGroupBy,
  useBlockLayout,
  Column,
  Row,
  useGlobalFilter,
  useAsyncDebounce,
} from "react-table";
import { useCallback, useMemo, useState } from "react";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Chart } from "../primitives/chart";

import tw, { theme } from "twin.macro";
import { useLocalStorage } from "../hooks/useLocalStorage";

type Reachable = "Safe" | "Invalid" | "Risky" | "Unknown";

export interface Item {
  is_reachable: Reachable;
  email: string;
  is_disposable: boolean | null;
  is_role_account: boolean | null;
  can_connect_smtp: boolean | null;
  has_full_inbox: boolean | null;
  is_catch_all: boolean | null;
  is_deliverable: boolean | null;
  is_disabled: boolean | null;
}

export interface Data {
  stats: {
    safe: number;
    risky: number;
    unknown: number;
    invalid: number;
    total: number;
  };
  items: Item[];
}

const prettyBoolean = (val: boolean | null | undefined) => {
  switch (val) {
    case true:
      return "Yes";
    case false:
      return "No";
    default:
      return "N/A";
  }
};

const getStatusColor = (val: Reachable) => {
  switch (val) {
    case "Risky":
      return tw`bg-yellow-100 text-yellow-700`;
    case "Invalid":
      return tw`bg-red-100 text-red-700`;
    case "Safe":
      return tw`bg-green-100 text-green-700`;
    default:
      return tw`bg-gray-100 text-gray-700`;
  }
};
type ValidKeys = "safe" | "risky" | "invalid" | "unknown" | "total";

const getStatusColorHex = (key: ValidKeys) => {
  switch (key) {
    case "invalid":
      return theme`colors.red.500`;
    case "risky":
      return theme`colors.yellow.500`;
    case "safe":
      return theme`colors.green.500`;
    case "total":
      return theme`colors.blue.500`;
    default:
      return theme`colors.gray.500`;
  }
};

const renderBoolean = (value: boolean | null) => (
  <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
    {prettyBoolean(value)}
  </span>
);

interface GlobalFilterProps {
  preGlobalFilteredRows: Row<Item>[];
  globalFilter: any;
  setGlobalFilter: any;
}

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}: GlobalFilterProps) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <label tw="text-base flex flex-col space-y-1 min-width[20rem]">
      <span tw="text-sm font-semibold uppercase">Search</span>
      <input
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        tw="rounded-md outline-none p-2 focus:(outline-none ring-2 ring-blue-500)"
      />
    </label>
  );
}

interface SCFProps {
  column: {
    filterValue: string;
    setFilter: Function;
    preFilteredRows: Row<Item>[];
    id: string;
  };
}

function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}: SCFProps) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = useMemo(() => {
    const options = new Set<Item>();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id]);
    });
    // @ts-ignore
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <label tw="text-base flex flex-col space-y-1">
      <span tw="text-sm font-semibold uppercase">Status Filter</span>
      <select
        value={filterValue}
        tw="rounded-md outline-none p-2 focus:(outline-none ring-2 ring-blue-500)"
        onChange={(e) => {
          setFilter(e.target.value || undefined);
        }}
      >
        <option value="">All</option>
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export const Table = ({ data }: { data: Data }) => {
  const [showChart, setShowChart] = useLocalStorage(
    "persisted_show_chart",
    true
  );

  const columns = useMemo<Column<Item>[]>(
    () => [
      {
        Header: "Email",
        accessor: "email",
        Cell: ({ value }) => (
          <span tw="text-sm font-medium text-gray-900 flex-grow">{value}</span>
        ),
      },
      {
        Header: "Status",
        accessor: "is_reachable",
        Cell: ({ value }) => (
          <span
            tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full"
            css={getStatusColor(value)}
          >
            {value}
          </span>
        ),
        Filter: SelectColumnFilter,
        filter: "includes",
      },
      {
        Header: "Disposable",
        accessor: "is_disposable",
        Cell: ({ value }) => renderBoolean(value),
      },
      {
        Header: "Connectable",
        accessor: "can_connect_smtp",
        Cell: ({ value }) => renderBoolean(value),
      },
      {
        Header: "Full Inbox",
        accessor: "has_full_inbox",
        Cell: ({ value }) => renderBoolean(value),
      },
      {
        Header: "Disabled",
        accessor: "is_disabled",
        Cell: ({ value }) => renderBoolean(value),
      },
    ],
    []
  );
  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state,
  } = useTable(
    { columns, data: data?.items || [] },
    useBlockLayout,
    useFilters,
    useGlobalFilter,
    useSortBy
  );

  const RenderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];

      prepareRow(row);

      return (
        <div
          {...row.getRowProps({ style })}
          tw="text-base text-left font-medium text-gray-900 flex items-center justify-start"
        >
          {row.cells.map((cell) => {
            return (
              <div
                aria-roledescription="row"
                {...cell.getCellProps()}
                tw="px-6 py-4 first:(min-width[300px])"
              >
                {cell.render("Cell")}
              </div>
            );
          })}
        </div>
      );
    },
    [prepareRow, rows]
  );

  const { total, ...statusStats } = data?.stats;
  const chartList = Object.keys(statusStats).map((key) => ({
    name: key as ValidKeys,
    value: data?.stats?.[key as ValidKeys],
    percentage: (data?.stats?.[key as ValidKeys] / total) * 100,
    color: getStatusColorHex(key as ValidKeys),
  }));
  chartList.unshift({
    name: "total",
    value: data.stats.total,
    percentage: 100,
    color: getStatusColorHex("total"),
  });

  return (
    <div>
      <div tw="rounded-lg bg-white p-4 text-center relative flex justify-center">
        <div
          tw="transition-all duration-200 ease-in-out height[350px]"
          css={!showChart && tw`h-0`}
        >
          {showChart && <Chart list={chartList} />}
        </div>
        <button
          onClick={() => setShowChart(!showChart)}
          tw="transition ease-in-out duration-300 rounded-t-lg bg-gray-200 pt-2 pb-1 px-4 text-sm absolute -top-8 hocus:(outline-none bg-gray-300)"
        >
          {showChart ? "Hide chart" : "Show chart"}
        </button>
      </div>
      <div tw="flex space-x-4 justify-start mt-4">
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
        {headers[1].render("Filter")}
      </div>
      <div
        {...getTableProps()}
        tw="mt-4 divide-y divide-gray-200 h-full flex flex-col rounded-lg overflow-hidden"
      >
        <div tw="bg-gray-50">
          {headers.map((column) => (
            <div
              {...column.getHeaderProps(column.getSortByToggleProps())}
              tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider first:(min-width[300px])"
            >
              {column.render("Header")}
              <span>
                {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
              </span>
            </div>
          ))}
        </div>
        <div
          {...getTableBodyProps()}
          tw="bg-white divide-y divide-gray-200 min-h-screen h-full"
        >
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                height={height}
                itemCount={rows.length}
                itemSize={50}
                width={width}
              >
                {RenderRow}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
};
