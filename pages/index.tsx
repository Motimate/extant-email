import Head from "next/head";
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
export default function Home() {
  const [emails, setEmails] = useState<string[]>([]);
  const [data, setData] = useState<Item[]>([]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <Head>
        <title>Check emails</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center px-20 text-center w-full max-w-7xl space-y-2">
        <ReactMultiEmail
          placeholder="Input your Email Address"
          emails={emails}
          onChange={(_emails: string[]) => {
            setEmails(_emails);
          }}
          className="w-full flex-0"
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
          className="p-4 font-bold rounded-xl bg-blue-500 text-white flex items-center"
          onClick={async () => {
            const res = await fetch("/api/email", {
              method: "POST",
              body: JSON.stringify(emails),
            });

            const json = await res.json();

            if (json) {
              setData(json);
            }
          }}
        >
          Check emails
        </button>

        <ul className="flex flex-col space-y-2 max-w-3xl justify-start text-left">
          {data.map((d) => {
            const { email, is_reachable, ...rest } = d;
            return (
              <li className="bg-white rounded-xl p-4 w-80" key={email}>
                <h2 className="font-bold text-lg">{email}</h2>
                <p>Status: {is_reachable}</p>
                <br />
                {Object.keys(rest).map((r) => (
                  <p key={`${email}-${r}`}>
                    {r}: {`${rest[r]}`}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
