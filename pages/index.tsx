import Head from "next/head";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useState } from "react";
import { ReactMultiEmail } from "react-multi-email";
import "react-multi-email/style.css";
import CsvDialog from "../primitives/csv-dialog";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogContent,
} from "../primitives/dialog";
import Button from "../primitives/button";
import { Table, Data } from "../primitives/table";
import { useSpinDelay } from "spin-delay";

export default function Home() {
  const [emails, setEmails] = useLocalStorage<string[]>("persisted_emails", []);
  const [data, setData] = useLocalStorage<Data | undefined>(
    "persisted_data",
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showSpinner = useSpinDelay(loading, { delay: 300, minDuration: 500 });

  return (
    <main tw="min-h-screen flex flex-col w-full max-w-6xl mx-auto">
      <Head>
        <title>Check emails</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section tw="flex flex-col p-12 space-y-4 max-w-6xl min-w-full">
        <Dialog open={showSpinner}>
          <DialogContent>
            <DialogTitle>Checking emails...</DialogTitle>
            <DialogDescription>
              This process can take up to 30 seconds. To avoid being graylisted
              by email providers we might have to check some emails twice.
            </DialogDescription>
            <div tw="flex items-center justify-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="58"
                height="58"
                viewBox="0 0 58 58"
                tw="text-blue-500"
              >
                <g fill="none" fillRule="evenodd">
                  <g
                    transform="translate(2 1)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle
                      cx="42.601"
                      cy="11.462"
                      r="5"
                      fillOpacity="1"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="1;0;0;0;0;0;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="49.063"
                      cy="27.063"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;1;0;0;0;0;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="42.601"
                      cy="42.663"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;1;0;0;0;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="27"
                      cy="49.125"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;0;1;0;0;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="11.399"
                      cy="42.663"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;0;0;1;0;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="4.938"
                      cy="27.063"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;0;0;0;1;0;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="11.399"
                      cy="11.462"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;0;0;0;0;1;0"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="27"
                      cy="5"
                      r="5"
                      fillOpacity="0"
                      fill="currentColor"
                    >
                      <animate
                        attributeName="fill-opacity"
                        begin="0s"
                        dur="1.3s"
                        values="0;0;0;0;0;0;0;1"
                        calcMode="linear"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                </g>
              </svg>
            </div>
          </DialogContent>
        </Dialog>
        <div tw="w-full">
          <ReactMultiEmail
            placeholder="Enter email addresses"
            emails={emails}
            onChange={(_emails: string[]) => {
              setEmails(_emails);
            }}
            tw="rounded-lg focus:(outline-none ring-2 ring-blue-500)"
            getLabel={(
              email: string,
              index: number,
              removeEmail: (index: number) => void
            ) => {
              return (
                <div data-tag key={index}>
                  {email}
                  <span data-tag-handle onClick={() => removeEmail(index)}>
                    ×
                  </span>
                </div>
              );
            }}
          />
        </div>

        <div tw="flex justify-start items-center space-x-4">
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);

              try {
                const res = await fetch("/api/email_check", {
                  method: "POST",
                  body: JSON.stringify(emails),
                  headers: {
                    "content-type": "application/json",
                  },
                });

                if (res.status !== 200) {
                  throw new Error(
                    `Statuscode ${res.status}: ${res.statusText}`
                  );
                }

                const json = (await res.json()) as Data;

                if (json) {
                  setData(json);
                }
              } catch (err: any) {
                setError(err.message);
              }

              setLoading(false);
            }}
          >
            Check emails
          </Button>
          <CsvDialog
            onClick={(data: string[]) => {
              setEmails(data);
            }}
          />

          <span tw="flex-grow" />

          <Button
            variant="danger"
            disabled={loading}
            onClick={() => {
              setData(undefined);
              setEmails([]);
            }}
          >
            Reset data
          </Button>
        </div>
      </section>

      {error && <p tw="text-base text-red-600 p-2">{error}</p>}

      <section tw="p-8 max-w-7xl flex items-center justify-center mx-auto">
        {data && <Table data={data} />}
      </section>
    </main>
  );
}
