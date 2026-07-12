// lib/email/templates.ts
// Professional, responsive HTML email templates.

const baseStyles = `
  body { margin:0; padding:0; background:#f4f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .container { max-width:480px; margin:0 auto; padding:24px; }
  .card { background:#ffffff; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .logo { font-size:20px; font-weight:700; color:#4f46e5; margin-bottom:16px; }
  .title { font-size:20px; font-weight:600; color:#111827; margin:0 0 12px; }
  .text { font-size:14px; color:#4b5563; line-height:1.6; margin:0 0 20px; }
  .button { display:inline-block; background:#4f46e5; color:#ffffff !important; text-decoration:none; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; }
  .code { display:inline-block; background:#eef2ff; color:#4f46e5; font-size:24px; letter-spacing:6px; font-weight:700; padding:12px 20px; border-radius:8px; margin:8px 0; }
  .footer { font-size:12px; color:#9ca3af; margin-top:24px; text-align:center; }
`;

function layout(inner: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head><body><div class="container"><div class="card">${inner}</div><div class="footer">© ${new Date().getFullYear()} OodoPrep. All rights reserved.</div></div></body></html>`;
}

export function verificationEmailTemplate(opts: {
  name: string;
  link: string;
  code?: string;
}): string {
  const body = opts.code
    ? `<p class="text">Hi ${opts.name}, use the verification code below to activate your account:</p>
       <div class="code">${opts.code}</div>
       <p class="text">Or click the button to verify via link:</p>
       <a class="button" href="${opts.link}">Verify Email</a>`
    : `<p class="text">Hi ${opts.name}, thanks for signing up! Please confirm your email address to activate your account.</p>
       <a class="button" href="${opts.link}">Verify Email</a>`;
  return layout(
    `<div class="logo">OodoPrep</div><h1 class="title">Confirm your email</h1>${body}<p class="text">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`
  );
}

export function resetPasswordEmailTemplate(opts: {
  name: string;
  link: string;
}): string {
  return layout(
    `<div class="logo">OodoPrep</div><h1 class="title">Reset your password</h1>
     <p class="text">Hi ${opts.name}, we received a request to reset your password. Click below to choose a new one.</p>
     <a class="button" href="${opts.link}">Reset Password</a>
     <p class="text">This link expires in 1 hour. If you didn't request this, you can safely ignore the email.</p>`
  );
}
