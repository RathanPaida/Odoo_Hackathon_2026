// scripts/dev-mailserver.mjs
// Minimal, dependency-free SMTP sink for LOCAL development only.
// It accepts mail on PORT (default 1025) with no auth and stores each message
// as JSON in .mailbox/inbox.json so the app's emails are viewable in a browser
// at /dev/mailbox. No external services, no extra npm packages.
import { Server } from "node:net";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MAILBOX_DIR = join(ROOT, ".mailbox");
const MAILBOX_FILE = join(MAILBOX_DIR, "inbox.json");
const PORT = Number(process.env.MAIL_PORT ?? 1025);

mkdirSync(MAILBOX_DIR, { recursive: true });

function loadInbox() {
  if (!existsSync(MAILBOX_FILE)) return [];
  try {
    return JSON.parse(readFileSync(MAILBOX_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveInbox(messages) {
  writeFileSync(MAILBOX_FILE, JSON.stringify(messages, null, 2));
}

function parseMessage(raw) {
  // Split headers from body on first blank line.
  const match = raw.match(/\r?\n\r?\n(?![\t>])/);
  const headerPart = match ? raw.slice(0, raw.indexOf(match[0])) : raw;
  const body = match ? raw.slice(raw.indexOf(match[0]) + match[0].length) : "";

  const getHeader = (name) => {
    const m = headerPart.match(new RegExp(`^${name}:\\s*(.+)$`, "mi"));
    return m ? m[1].trim() : "";
  };

  const text = body
    .replace(/\r\n/g, "\n")
    .replace(/=\r?\n/g, "") // unfold
    .replace(/=3D/g, "=");

  // Find the first http(s) link (verification / reset).
  const linkMatch = text.match(/https?:\/\/[^\s"<>)]+/);
  const link = linkMatch ? linkMatch[0].replace(/=$/, "") : null;

  return {
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    text: text.trim().slice(0, 4000),
    link,
    date: new Date().toISOString(),
  };
}

const server = new Server((socket) => {
  socket.write("220 local-mailbox ready\r\n");
  let state = "init";
  let buffer = "";
  let raw = "";

  const send = (code, msg) => socket.write(`${code} ${msg}\r\n`);

  socket.on("data", (data) => {
    buffer += data.toString("utf8");
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? ""; // keep partial last line

    for (const line of lines) {
      const cmd = line.toUpperCase();

      if (state === "data") {
        if (line === ".") {
          const message = parseMessage(raw);
          const inbox = loadInbox();
          inbox.unshift(message);
          saveInbox(inbox);
          console.log(`[mailbox] received -> ${message.to} | ${message.subject}`);
          state = "init";
          raw = "";
          send(250, "OK: message queued");
        } else {
          raw += line + "\n";
        }
        continue;
      }

      if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) {
        send(250, "local-mailbox");
      } else if (cmd.startsWith("MAIL FROM")) {
        send(250, "OK");
      } else if (cmd.startsWith("RCPT TO")) {
        send(250, "OK");
      } else if (cmd.startsWith("DATA")) {
        send(354, "End data with <CR><LF>.<CR><LF>");
        state = "data";
        raw = "";
      } else if (cmd.startsWith("QUIT")) {
        send(221, "Bye");
        socket.end();
      } else if (cmd.startsWith("RSET")) {
        state = "init";
        raw = "";
        send(250, "OK");
      } else if (cmd.startsWith("NOOP")) {
        send(250, "OK");
      } else if (cmd.startsWith("STARTTLS")) {
        // We are local-only; decline TLS.
        send(502, "TLS not supported");
      } else {
        send(250, "OK");
      }
    }
  });

  socket.on("error", () => {});
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`📬 Dev mailbox SMTP server listening on 127.0.0.1:${PORT}`);
  console.log(`   View received mail at: http://localhost:3000/dev/mailbox`);
});
