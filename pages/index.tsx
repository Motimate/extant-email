import Head from "next/head";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useState } from "react";
import { ReactMultiEmail } from "react-multi-email";
import "react-multi-email/style.css";
import Dialog from "../primitives/csv-dialog";
import tw from "twin.macro";
import Button from "../primitives/button";
interface Item {
  is_reachable: string;
  email: string;
  is_disposable?: boolean;
  is_role_account?: boolean;
  can_connect_smtp?: boolean;
  has_full_inbox?: boolean;
  is_catch_all?: boolean;
  is_deliverable?: boolean;
  is_disabled?: boolean;
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

const getStatusColor = (val: string) => {
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

export default function Home() {
  const [emails, setEmails] = useLocalStorage<string[]>("persistedEmails", []);
  const [data, setData] = useLocalStorage<Item[]>("persistedData", []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <main tw="min-h-screen flex flex-col w-full">
      <Head>
        <title>Check emails</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section tw="flex flex-col p-12 space-y-4">
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

                const json = await res.json();

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
          <Dialog
            onClick={(data: string[]) => {
              setEmails(data);
            }}
          />

          <span tw="flex-grow" />

          <Button
            variant="danger"
            disabled={loading}
            onClick={() => {
              setData([]);
              setEmails([]);
            }}
          >
            Reset data
          </Button>
        </div>
      </section>

      {error && <p tw="text-base text-red-600 p-2">{error}</p>}

      <section tw="flex flex-col w-full p-8">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div tw="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table tw="min-w-full divide-y divide-gray-200">
                <thead tw="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Disposable
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role Account
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      SMTP Connectable
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Full Inbox
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Disabled
                    </th>
                  </tr>
                </thead>
                <tbody tw="bg-white divide-y divide-gray-200">
                  {data.map((d) => {
                    const { email, is_reachable, ...rest } = d;
                    return (
                      <tr key={email} tw="text-base text-left">
                        <td tw="px-6 py-4 whitespace-nowrap">
                          <div tw="flex items-center justify-start">
                            <div tw="text-base font-medium text-gray-900">
                              {email}
                            </div>
                          </div>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap">
                          <div tw="text-base text-gray-900 capitalize">
                            <span
                              tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full"
                              css={getStatusColor(d.is_reachable)}
                            >
                              {d.is_reachable}
                            </span>
                          </div>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap text-left">
                          <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                            {prettyBoolean(d.is_disposable)}
                          </span>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap text-left">
                          <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                            {prettyBoolean(d.is_role_account)}
                          </span>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap text-left">
                          <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                            {prettyBoolean(d.can_connect_smtp)}
                          </span>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap text-left">
                          <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                            {prettyBoolean(d.has_full_inbox)}
                          </span>
                        </td>
                        <td tw="px-6 py-4 whitespace-nowrap text-left">
                          <span tw="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                            {prettyBoolean(d.is_disabled)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* <ul tw="flex flex-col space-y-2 max-w-3xl justify-start text-left">
          {data.map((d) => {
            const { email, is_reachable, ...rest } = d;
            return (
              <li tw="bg-white rounded-lg p-4 w-80" key={email}>
                <h2 tw="font-bold text-lg">{email}</h2>
                <p>Status: {is_reachable}</p>
                <br />
                {Object.keys(rest).map((r) => (
                  <p key={`${email}-${r}`}>
                    {r}: {`${rest[r as keyof typeof rest]}`}
                  </p>
                ))}
              </li>
            );
          })}
        </ul> */}
    </main>
  );
}
