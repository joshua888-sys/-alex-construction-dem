
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// CHECK EMAIL CONFIGURATION
function checkEmailConfiguration() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("Email service is not configured.");
  }
}

// BOOKING STATUS EMAIL TO CUSTOMER
export async function sendBookingStatusEmail(booking, status) {
  checkEmailConfiguration();

  const subject = `Your project enquiry is ${status}`;

  const message = `
Hello ${booking.name},

Your project enquiry has been updated.

Current status: ${status}

Project type: ${booking.project}

Thank you for contacting ALEX'S BUILDING & CONSTRUCTION.
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: booking.email,
    subject,
    text: message
  });
}

// CUSTOMER MESSAGE REPLY EMAIL
export async function sendContactReplyEmail(customerMessage, replyText) {
  checkEmailConfiguration();

  if (!customerMessage || !customerMessage.email) {
    throw new Error("Customer email address is missing.");
  }

  if (!replyText || !replyText.trim()) {
    throw new Error("Reply message cannot be empty.");
  }

  const subject = `Re: ${customerMessage.subject || "Your enquiry"}`;

  const message = `
Hello ${customerMessage.name},

Thank you for contacting ALEX'S BUILDING & CONSTRUCTION.

Here is our response to your enquiry:

${replyText.trim()}

Kind regards,
ALEX'S BUILDING & CONSTRUCTION
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: customerMessage.email,
    subject,
    text: message
  });
}

// NEW BOOKING OR CONTACT MESSAGE ALERT TO BUSINESS
export async function sendBusinessNotificationEmail(
  type,
  item,
  recipient
) {
  checkEmailConfiguration();

  if (!recipient) {
    throw new Error("Business notification recipient is missing.");
  }

  if (!item || !item.name || !item.email) {
    throw new Error("Customer information is incomplete.");
  }

  let subject;
  let message;

  if (type === "booking") {
    subject = "New Customer Booking Received";

    message = `
A new project enquiry has been submitted.

Customer: ${item.name}
Email: ${item.email}
Phone: ${item.phone || "Not provided"}
Project type: ${item.project}
Location: ${item.location || "Not provided"}

Project details:
${item.details || "No additional details provided"}

Please log in to the admin dashboard to review this booking.
    `;

  } else if (type === "message") {
    subject = "New Customer Contact Message";

    message = `
A new contact message has been received.

Customer: ${item.name}
Email: ${item.email}
Subject: ${item.subject || "No subject"}

Message:
${item.message}

Please log in to the admin dashboard to review this message.
    `;

  } else {
    throw new Error("Invalid notification type.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject,
    text: message
  });
}
