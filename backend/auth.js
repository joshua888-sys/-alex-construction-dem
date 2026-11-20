
import express from "express";
import bcrypt from "bcryptjs";
import db from "./database.js";

const router = express.Router();

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const result = await db.query(
      "SELECT * FROM admins WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      admin.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Could not create login session."
        });
      }

      req.session.admin = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        emailNotifications: Boolean(admin.email_notifications)
      };

      res.json({
        success: true,
        message: "Login successful!",
        admin: req.session.admin
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

// CHECK LOGGED-IN ADMINISTRATOR
router.get("/me", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Not logged in."
    });
  }

  try {
    const result = await db.query(`
      SELECT id, name, email, role, email_notifications
      FROM admins
      WHERE id = $1
    `, [req.session.admin.id]);

    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    req.session.admin.emailNotifications =
      Boolean(admin.email_notifications);

    res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        emailNotifications: Boolean(admin.email_notifications)
      }
    });

  } catch (error) {
    console.error("Profile loading error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load administrator profile."
    });
  }
});

// UPDATE EMAIL NOTIFICATION PREFERENCE
router.post("/email-notifications", async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid notification setting is required."
      });
    }

    const result = await db.query(`
      UPDATE admins
      SET email_notifications = $1
      WHERE id = $2
    `, [enabled ? 1 : 0, req.session.admin.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    req.session.admin.emailNotifications = enabled;

    res.json({
      success: true,
      message: enabled
        ? "Email notifications enabled."
        : "Email notifications disabled.",
      emailNotifications: enabled
    });

  } catch (error) {
    console.error("Notification settings error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update notification settings."
    });
  }
});

// CHANGE ADMIN PASSWORD
router.post("/change-password", async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters."
      });
    }

    const result = await db.query(
      "SELECT password FROM admins WHERE id = $1",
      [req.session.admin.id]
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE admins SET password = $1 WHERE id = $2",
      [hashedPassword, req.session.admin.id]
    );

    res.json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (error) {
    console.error("Password update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update password."
    });
  }
});

// ADMIN LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

export default router;
