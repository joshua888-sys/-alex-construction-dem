
import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./database.js";
import authRoutes from "./auth.js";

import {
  sendBookingStatusEmail,
  sendContactReplyEmail,
  sendBusinessNotificationEmail
} from "./email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required.");
}

// MIDDLEWARE
app.use(express.json({ limit: "20kb" }));

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60
  }
}));

// PROTECT ADMIN DASHBOARD
app.use("/Admin", (req, res, next) => {
  const publicFiles = [
    "/login.html",
    "/login.css",
    "/login.js"
  ];

  if (publicFiles.includes(req.path)) {
    return next();
  }

  if (!req.session.admin) {
    return res.redirect("/Admin/login.html");
  }

  next();
});

// SERVE WEBSITE FILES
app.use(express.static(path.join(__dirname, "..")));

// AUTHENTICATION ROUTES
app.use("/api/auth", authRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.redirect("/home/index.html");
});

// SEND BUSINESS NOTIFICATION IF ENABLED
async function notifyBusiness(type, item) {
  try {
    const admin = db.prepare(`
      SELECT email
      FROM admins
      WHERE email_notifications = 1
      ORDER BY id ASC
      LIMIT 1
    `).get();

    if (!admin) {
      return false;
    }

    await sendBusinessNotificationEmail(
      type,
      item,
      admin.email
    );

    console.log(`Business ${type} notification sent.`);
    return true;

  } catch (error) {
    console.error(
      `Business ${type} notification failed:`,
      error.message
    );

    return false;
  }
}

// UPDATE BOOKING STATUS AND SEND EMAIL
app.patch("/api/bookings/:id/status", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Approved",
      "Rejected",
      "Completed"
    ];

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID."
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status."
      });
    }

    const booking = db.prepare(
      "SELECT * FROM bookings WHERE id = ?"
    ).get(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    const statusChanged = booking.status !== status;

    db.prepare(
      "UPDATE bookings SET status = ? WHERE id = ?"
    ).run(status, bookingId);

    let emailSent = false;

    if (
      statusChanged &&
      ["Approved", "Rejected"].includes(status)
    ) {
      try {
        await sendBookingStatusEmail(booking, status);
        emailSent = true;

        console.log(
          `Status email sent for booking ${bookingId}`
        );

      } catch (emailError) {
        console.error(
          "Email notification failed:",
          emailError.message
        );
      }
    }

    res.json({
      success: true,
      message: "Booking status updated successfully.",
      emailSent
    });

  } catch (error) {
    console.error("Booking update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update booking status."
    });
  }
});

// GET ALL BOOKINGS (ADMIN ONLY)
app.get("/api/bookings", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const bookings = db.prepare(`
      SELECT id, name, email, phone, project,
             location, details, status, created_at
      FROM bookings
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error("Could not load bookings:", error);

    res.status(500).json({
      success: false,
      message: "Could not load bookings."
    });
  }
});

// GET CUSTOMERS FROM BOOKINGS (ADMIN ONLY)
app.get("/api/customers", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const customers = db.prepare(`
      SELECT
        name,
        email,
        phone,
        COUNT(*) AS booking_count,
        MAX(created_at) AS last_booking
      FROM bookings
      GROUP BY LOWER(TRIM(email))
      ORDER BY MAX(created_at) DESC
    `).all();

    res.json({
      success: true,
      customers
    });

  } catch (error) {
    console.error("Could not load customers:", error);

    res.status(500).json({
      success: false,
      message: "Could not load customers."
    });
  }
});

// CREATE CUSTOMER BOOKING
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      project,
      location,
      details
    } = req.body;

    if (!name || !email || !project) {
      return res.status(400).json({
        success: false,
        message: "Name, email and project are required."
      });
    }

    const statement = db.prepare(`
      INSERT INTO bookings
      (name, email, phone, project, location, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      name,
      email,
      phone || null,
      project,
      location || null,
      details || null
    );

    const booking = {
      name,
      email,
      phone,
      project,
      location,
      details
    };

    const notificationSent = await notifyBusiness(
      "booking",
      booking
    );

    res.status(201).json({
      success: true,
      message: "Booking saved successfully!",
      bookingId: Number(result.lastInsertRowid),
      notificationSent
    });

  } catch (error) {
    console.error("Booking creation error:", error);

    res.status(500).json({
      success: false,
      message: "Could not save booking."
    });
  }
});

// GET CUSTOMER MESSAGES (ADMIN ONLY)
app.get("/api/messages", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const messages = db.prepare(`
      SELECT id, name, email, subject, message, status, created_at
      FROM messages
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error("Could not load messages:", error);

    res.status(500).json({
      success: false,
      message: "Could not load messages."
    });
  }
});

// REPLY TO CUSTOMER MESSAGE (ADMIN ONLY)
app.post("/api/messages/:id/reply", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const messageId = Number(req.params.id);
    const { reply } = req.body;

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID."
      });
    }

    if (
      typeof reply !== "string" ||
      !reply.trim() ||
      reply.trim().length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a reply of up to 5000 characters."
      });
    }

    const customerMessage = db.prepare(
      "SELECT * FROM messages WHERE id = ?"
    ).get(messageId);

    if (!customerMessage) {
      return res.status(404).json({
        success: false,
        message: "Customer message not found."
      });
    }

    try {
      await sendContactReplyEmail(
        customerMessage,
        reply.trim()
      );

    } catch (emailError) {
      console.error(
        "Customer reply email failed:",
        emailError.message
      );

      return res.status(503).json({
        success: false,
        message: "Email could not be sent. Check the email configuration."
      });
    }

    db.prepare(
      "UPDATE messages SET status = ? WHERE id = ?"
    ).run("Replied", messageId);

    console.log(
      `Reply email sent for customer message ${messageId}`
    );

    return res.json({
      success: true,
      message: "Reply email sent successfully."
    });

  } catch (error) {
    console.error("Customer reply error:", error);

    res.status(500).json({
      success: false,
      message: "Could not process the customer reply."
    });
  }
});

// CREATE CUSTOMER MESSAGE
app.post("/api/messages", async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required."
      });
    }

    const statement = db.prepare(`
      INSERT INTO messages (name, email, subject, message)
      VALUES (?, ?, ?, ?)
    `);

    const result = statement.run(
      name,
      email,
      subject || null,
      message
    );

    const customerMessage = {
      name,
      email,
      subject,
      message
    };

    const notificationSent = await notifyBusiness(
      "message",
      customerMessage
    );

    res.status(201).json({
      success: true,
      message: "Message saved successfully!",
      messageId: Number(result.lastInsertRowid),
      notificationSent
    });

  } catch (error) {
    console.error("Message creation error:", error);

    res.status(500).json({
      success: false,
      message: "Could not save message."
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
