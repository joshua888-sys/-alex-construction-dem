
import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db, { initializeDatabase } from "./database.js";
import authRoutes from "./auth.js";

import {
  sendBookingStatusEmail,
  sendContactReplyEmail,
  sendBusinessNotificationEmail
} from "./email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required.");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
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
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60
  }
}));

// PROTECT ADMIN DASHBOARD
app.use("/admin", (req, res, next) => {
  const publicFiles = [
    "/login.html",
    "/login.css",
    "/login.js"
  ];

  if (publicFiles.includes(req.path)) {
    return next();
  }

  if (!req.session.admin) {
    return res.redirect("/admin/login.html");
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
    const result = await db.query(`
      SELECT email
      FROM admins
      WHERE email_notifications = 1
      ORDER BY id ASC
      LIMIT 1
    `);

    const admin = result.rows[0];

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

    const bookingResult = await db.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId]
    );

    const booking = bookingResult.rows[0];

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    const statusChanged = booking.status !== status;

    await db.query(
      "UPDATE bookings SET status = $1 WHERE id = $2",
      [status, bookingId]
    );

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
app.get("/api/bookings", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const result = await db.query(`
      SELECT id, name, email, phone, project,
             location, details, status, created_at
      FROM bookings
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      bookings: result.rows
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
app.get("/api/customers", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const result = await db.query(`
      SELECT
        (array_agg(name ORDER BY created_at DESC))[1] AS name,
        (array_agg(email ORDER BY created_at DESC))[1] AS email,
        (array_agg(phone ORDER BY created_at DESC))[1] AS phone,
        COUNT(*)::int AS booking_count,
        MAX(created_at) AS last_booking
      FROM bookings
      GROUP BY LOWER(TRIM(email))
      ORDER BY MAX(created_at) DESC
    `);

    res.json({
      success: true,
      customers: result.rows
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

    const result = await db.query(`
      INSERT INTO bookings
      (name, email, phone, project, location, details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      name,
      email,
      phone || null,
      project,
      location || null,
      details || null
    ]);

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
      bookingId: Number(result.rows[0].id),
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
app.get("/api/messages", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const result = await db.query(`
      SELECT id, name, email, subject, message, status, created_at
      FROM messages
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      messages: result.rows
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

    const messageResult = await db.query(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );

    const customerMessage = messageResult.rows[0];

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

    await db.query(
      "UPDATE messages SET status = $1 WHERE id = $2",
      ["Replied", messageId]
    );

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

    const result = await db.query(`
      INSERT INTO messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      name,
      email,
      subject || null,
      message
    ]);

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
      messageId: Number(result.rows[0].id),
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

// START SERVER AFTER DATABASE INITIALIZATION
try {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

} catch (error) {
  console.error("Server startup failed:", error);
  process.exit(1);
}
