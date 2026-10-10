import nodemailer from 'nodemailer'
import { env } from '../config/env' // Use your central env config

const port = Number(env.SMTP_PORT) || 587

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: port,
  secure: port === 465, // false for 587 (STARTTLS), true for 465 (SSL)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
) {
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text: body,
  })

  console.log('✅ Email sent:', info.messageId)

  // Log preview URL if testing via Ethereal
  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) {
    console.log('🔗 Ethereal Preview URL:', previewUrl)
  }

  return info
}