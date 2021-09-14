/* eslint-disable react/no-unescaped-entities */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import Button from "../primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

import { keyframes } from "@stitches/react";
import tw, { styled } from "twin.macro";
//import { styled } from "@stitches/react";

const overlayShow = keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const activeStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

const SubTitle = styled.h4(tw`text-base font-medium leading-5 text-gray-600`);
const InnerContainer = styled.div({
  ...tw`inline-flex flex-col space-y-2 bg-white`,
  variants: {
    isFluid: { true: tw`flex w-full`, false: tw`inline-flex` },
  },
});

interface Props {
  onClick: (data: string[]) => void;
}

export default function MyModal({ onClick }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  const [selectedHeader, setSelectedHeader] = useState<string>("0");
  const [data, setData] = useState<string[]>([]);
  const [delimiter, setDelimiter] = useState(",");

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    maxFiles: 1,
    accept: "text/csv, .csv",
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  useEffect(() => {
    const file = acceptedFiles[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e?.target?.result;

        if (typeof text === "string") {
          setText(text);
          const headers = text.slice(0, text.indexOf("\n")).split(delimiter);

          const rows = text.slice(text.indexOf("\n") + 1).split("\n");

          console.log({ rows, headers });

          const emailColumnIndex = headers.findIndex(
            (h) =>
              h.toLowerCase().includes("email") ||
              h.toLowerCase().includes("e-post") ||
              h.toLowerCase().includes("epost")
          );

          if (emailColumnIndex > -1) {
            setSelectedHeader(headers[emailColumnIndex]);
          }

          setHeaders(headers);
          setRows(rows);
        }
      };

      reader.readAsText(file);
    }
  }, [acceptedFiles, delimiter]);

  useEffect(() => {
    if (selectedHeader) {
      setData(
        rows
          .map((r) => {
            const foundIndex = headers.findIndex((v) => v === selectedHeader);
            return r.split(delimiter)[foundIndex];
          })
          .filter((item) => item?.includes("@"))
      );
    }
  }, [selectedHeader, delimiter, rows]);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" type="button" onClick={openModal}>
            Upload CSV
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Extract emails from a CSV document.
          </DialogDescription>
          <div tw="flex flex-col justify-start items-start space-y-4">
            <InnerContainer>
              <SubTitle>Delimiter</SubTitle>

              <ToggleGroup
                type="single"
                defaultValue=","
                aria-label="Delimiter"
                onValueChange={(v: string) => {
                  setDelimiter(v);
                }}
              >
                <ToggleGroupItem value="," aria-label="Comma">
                  Comma
                </ToggleGroupItem>
                <ToggleGroupItem value="." aria-label="Period">
                  Period
                </ToggleGroupItem>
              </ToggleGroup>
            </InnerContainer>

            <InnerContainer isFluid>
              <SubTitle>File</SubTitle>
              <div {...getRootProps({ style: style as any })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </InnerContainer>

            {headers.length > 0 && (
              <InnerContainer>
                <SubTitle>Select email column</SubTitle>
                <ToggleGroup
                  type="single"
                  value={selectedHeader}
                  aria-label="Header"
                  onValueChange={(v: string) => {
                    setSelectedHeader(v);
                  }}
                >
                  {headers.map((header, index) => {
                    console.log({
                      header,
                      index,
                      selectedHeader,
                    });
                    return (
                      <ToggleGroupItem asChild key={header} value={header}>
                        <span>{header}</span>
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </InnerContainer>
            )}
            {headers.length > 0 && data.length > 0 && (
              <div>
                <p tw="text-base mt-2">
                  We found {data.length} emails ready to use.
                </p>
              </div>
            )}
          </div>

          <div tw="flex justify-end mt-6">
            <button
              type="button"
              tw="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              onClick={() => {
                onClick(data);
                closeModal();
              }}
            >
              Insert data
            </button>
          </div>
          <DialogClose asChild>
            <span tw="cursor-pointer transition ease-in-out duration-300 text-sm font-semibold absolute top-2.5 right-2.5 p-2 rounded-full h-6 w-6 flex items-center justify-center hover:(bg-blue-100)">
              X
            </span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
