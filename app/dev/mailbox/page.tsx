// app/dev/mailbox/page.tsx
// Dev-only inbox that displays emails captured by `npm run mail:dev`.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Mail {
  from: string;
  to: string;
  subject: string;
  text: string;
  link: string | null;
  date: string;
}

export default function MailboxPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="p-10 text-center text-slate-500">
        Mailbox viewer is only available in development.
      </div>
    );
  }

  const file = path.join(process.cwd(), ".mailbox", "inbox.json");
  let mails: Mail[] = [];
  if (existsSync(file)) {
    try {
      mails = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      mails = [];
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">📬 Dev Mailbox</h1>
            <p className="text-sm text-slate-500">
              Local SMTP sink — no external services. Start it with{" "}
              <code className="rounded bg-slate-100 px-1">npm run mail:dev</code>.
            </p>
          </div>
          <Link href="/dev/mailbox" className="btn-secondary">
            Refresh
          </Link>
        </div>

        {mails.length === 0 ? (
          <div className="card text-center text-slate-400">
            No emails yet. Register or trigger a password reset to see one here.
          </div>
        ) : (
          <div className="space-y-4">
            {mails.map((m, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.subject}</p>
                    <p className="text-xs text-slate-400">
                      To: {m.to} · From: {m.from} ·{" "}
                      {new Date(m.date).toLocaleString()}
                    </p>
                  </div>
                  {m.link && (
                    <a href={m.link} className="btn-primary whitespace-nowrap">
                      Open link
                    </a>
                  )}
                </div>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">
                  {m.text}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
