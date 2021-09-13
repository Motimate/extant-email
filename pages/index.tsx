import Head from "next/head";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useState } from "react";
import { ReactMultiEmail } from "react-multi-email";
import "react-multi-email/style.css";

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
    case "risky":
      return "bg-yellow-100 text-yellow-700";
    case "invalid":
      return "bg-red-100 text-red-700";
    case "safe":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function Home() {
  const [emails, setEmails] = useLocalStorage<string[]>("persistedEmails", []);
  const [data, setData] = useLocalStorage<Item[]>("persistedData", []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col min-h-screen py-2 bg-gray-100 w-full">
      <Head>
        <title>Check emails</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-start px-20 text-center w-full space-y-6 mt-12">
        <div className="flex flex-row w-full space-x-4 sm:-mx-6 lg:-mx-8">
          <ReactMultiEmail
            placeholder="Input your Email Address"
            emails={emails}
            onChange={(_emails: string[]) => {
              setEmails(_emails);
            }}
            className="rounded-lg"
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
          <button
            className="p-4 font-bold rounded-xl bg-blue-500 text-white flex items-center disabled:cursor-not-allowed transition ease-in duration-300 disabled:opacity-70 hover:bg-blue-700"
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
          </button>
          <button
            className="p-4 font-bold rounded-xl bg-gray-300 text-gray-500 flex items-center disabled:cursor-not-allowed transition ease-in duration-300 disabled:opacity-70 hover:bg-gray-400"
            disabled={loading}
            onClick={() => {
              setData([]);
              setEmails([]);
            }}
          >
            Reset data
          </button>
        </div>

        {error && <p className="text-base text-red-600 p-2">{error}</p>}

        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Disposable
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role Account
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        SMTP Connectable
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Full Inbox
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Deliverable
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Disabled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((d) => {
                      const { email, is_reachable, ...rest } = d;
                      return (
                        <tr key={email} className="text-base text-left">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-start">
                              <div className="text-base font-medium text-gray-900">
                                {email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base text-gray-900 capitalize">
                              <span
                                className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                                  d.is_reachable
                                )}`}
                              >
                                {d.is_reachable}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                              {prettyBoolean(d.is_disposable)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                              {prettyBoolean(d.is_role_account)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                              {prettyBoolean(d.can_connect_smtp)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                              {prettyBoolean(d.has_full_inbox)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                              {prettyBoolean(d.is_deliverable)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
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
        </div>

        {/* <ul className="flex flex-col space-y-2 max-w-3xl justify-start text-left">
          {data.map((d) => {
            const { email, is_reachable, ...rest } = d;
            return (
              <li className="bg-white rounded-xl p-4 w-80" key={email}>
                <h2 className="font-bold text-lg">{email}</h2>
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
    </div>
  );
}
