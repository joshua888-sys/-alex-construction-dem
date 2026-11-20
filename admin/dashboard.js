
// SIDEBAR TOGGLE
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

if (sidebar && sidebarToggle) {
  sidebarToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });
}

// DASHBOARD NAVIGATION
const navLinks = document.querySelectorAll('.nav-link');
const dashboardSections = document.querySelectorAll('.dashboard-section');

navLinks.forEach(function (link) {
  link.addEventListener('click', function (event) {
    event.preventDefault();

    const sectionName = link.dataset.section;

    navLinks.forEach(item => item.classList.remove('active'));
    dashboardSections.forEach(section => section.classList.remove('active'));

    link.classList.add('active');

    const selectedSection = document.getElementById(sectionName);

    if (selectedSection) {
      selectedSection.classList.add('active');
    }

    if (sidebar) sidebar.classList.remove('open');

    const heading = document.querySelector('.topbar h2');

    if (heading) {
      const titles = {
        overview: 'Dashboard Overview',
        bookings: 'Bookings Management',
        messages: 'Customer Messages',
        customers: 'Customer Management',
        profile: 'My Profile',
        settings: 'Dashboard Settings'
      };

      heading.textContent = titles[sectionName] || 'Dashboard';
    }

    if (sectionName === 'messages') loadMessages();
    if (sectionName === 'customers') loadCustomers();
    if (sectionName === 'overview') loadRecentActivity();
  });
});

// CURRENT DATE
const dateElement = document.getElementById('today-date');

if (dateElement) {
  dateElement.textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// FOOTER YEAR
const yearElement = document.getElementById('current-year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ADMIN LOGOUT
const logoutButton = document.getElementById('logout-button');

if (logoutButton) {
  logoutButton.addEventListener('click', async function () {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out...';

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Logout failed. Please try again.');
      }

      window.location.href = '/admin/login.html';

    } catch (error) {
      alert(error.message);
      logoutButton.disabled = false;
      logoutButton.textContent = 'Log Out';
    }
  });
}

// LOAD ADMIN PROFILE
async function loadAdminProfile() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      window.location.href = '/admin/login.html';
      return;
    }

    const data = await response.json();
    const admin = data.admin;

    const notificationCheckbox = document.getElementById('email-notifications');

    if (notificationCheckbox) {
      notificationCheckbox.checked = Boolean(admin.emailNotifications);
    }

    const name = document.getElementById('profile-name');
    const email = document.getElementById('profile-email');
    const role = document.getElementById('profile-role');

    if (name) name.textContent = admin.name;
    if (email) email.textContent = admin.email;
    if (role) role.textContent = admin.role;

  } catch (error) {
    console.error('Could not load admin profile:', error);
  }
}

loadAdminProfile();

// LOAD AND SAVE EMAIL NOTIFICATION PREFERENCE
const emailNotifications = document.getElementById('email-notifications');

if (emailNotifications) {
  emailNotifications.addEventListener('change', async function () {
    const previousValue = !emailNotifications.checked;

    emailNotifications.disabled = true;

    try {
      const response = await fetch('/api/auth/email-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          enabled: emailNotifications.checked
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not save notification setting.');
      }

      alert(data.message);

    } catch (error) {
      emailNotifications.checked = previousValue;
      alert(error.message);

    } finally {
      emailNotifications.disabled = false;
    }
  });
}

// CHANGE ADMIN PASSWORD
const passwordForm = document.getElementById('change-password-form');

if (passwordForm) {
  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const message = document.getElementById('password-message');
    const button = passwordForm.querySelector('button[type="submit"]');

    if (newPassword !== confirmPassword) {
      message.textContent = 'New passwords do not match.';
      return;
    }

    button.disabled = true;
    message.textContent = 'Updating password...';

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed.');
      }

      message.textContent = data.message;
      passwordForm.reset();

    } catch (error) {
      message.textContent = error.message;

    } finally {
      button.disabled = false;
    }
  });
}

// RECENT ACTIVITY STYLES
function addRecentActivityStyles() {
  if (document.getElementById('recent-activity-styles')) return;

  const style = document.createElement('style');
  style.id = 'recent-activity-styles';

  style.textContent = `
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 18px 0;
      border-bottom: 1px solid #eeeeee;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      font-weight: 600;
    }

    .activity-icon.booking {
      background: #fff0e4;
      color: #f07824;
    }

    .activity-icon.message {
      background: #e8f1ff;
      color: #3975c6;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-content h3 {
      font-size: 14px;
      color: #202428;
      margin: 0 0 5px;
    }

    .activity-content p {
      font-size: 13px;
      color: #737b83;
      line-height: 1.5;
      margin: 0 0 5px;
      overflow-wrap: anywhere;
    }

    .activity-time {
      display: block;
      font-size: 11px;
      color: #999fa5;
      margin-top: 7px;
    }

    .activity-status {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 9px;
      border-radius: 20px;
      background: #f1f2f4;
      color: #555d65;
      margin-top: 5px;
    }

    .activity-status.approved {
      background: #e6f6ec;
      color: #24834a;
    }

    .activity-status.rejected {
      background: #fdeaea;
      color: #c13c3c;
    }

    .activity-status.completed {
      background: #e8f1ff;
      color: #3975c6;
    }

    .activity-empty {
      text-align: center;
      padding: 35px 15px;
      color: #737b83;
    }

    .activity-empty h3 {
      color: #30363b;
      margin-bottom: 8px;
    }

    .activity-empty p {
      font-size: 13px;
      line-height: 1.5;
    }

    .activity-loading {
      text-align: center;
      padding: 25px 10px;
      color: #737b83;
      font-size: 14px;
    }

    @media (max-width: 480px) {
      .activity-item {
        gap: 11px;
      }

      .activity-icon {
        width: 36px;
        height: 36px;
        min-width: 36px;
      }
    }
  `;

  document.head.appendChild(style);
}

// LOAD RECENT ACTIVITY
async function loadRecentActivity() {
  const activityContainer = document.getElementById('recent-activity-list');

  if (!activityContainer) return;

  addRecentActivityStyles();

  activityContainer.innerHTML = '';

  const loading = document.createElement('div');
  loading.className = 'activity-loading';
  loading.textContent = 'Loading recent activity...';

  activityContainer.appendChild(loading);

  try {
    const [bookingResponse, messageResponse] = await Promise.all([
      fetch('/api/bookings', {
        credentials: 'same-origin'
      }),
      fetch('/api/messages', {
        credentials: 'same-origin'
      })
    ]);

    if (!bookingResponse.ok || !messageResponse.ok) {
      throw new Error('Could not load recent activity.');
    }

    const bookingData = await bookingResponse.json();
    const messageData = await messageResponse.json();

    const bookings = bookingData.bookings || [];
    const messages = messageData.messages || [];

    const activities = [];

    bookings.forEach(function (booking) {
      activities.push({
        type: 'booking',
        title: 'New project booking',
        description: `${booking.name} submitted a ${booking.project} enquiry.`,
        status: booking.status || 'Pending',
        createdAt: booking.created_at
      });
    });

    messages.forEach(function (message) {
      activities.push({
        type: 'message',
        title: 'New customer message',
        description: `${message.name} sent a message: ${message.subject || 'No subject'}.`,
        createdAt: message.created_at
      });
    });

    // SORT NEWEST ACTIVITY FIRST
    activities.sort(function (a, b) {
      const dateA = new Date((a.createdAt || '') + ' UTC').getTime();
      const dateB = new Date((b.createdAt || '') + ' UTC').getTime();

      return (dateB || 0) - (dateA || 0);
    });

    // SHOW ONLY THE 8 MOST RECENT ITEMS
    const recentActivities = activities.slice(0, 8);

    activityContainer.replaceChildren();

    if (recentActivities.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'activity-empty';

      const heading = document.createElement('h3');
      heading.textContent = 'No activity yet';

      const paragraph = document.createElement('p');
      paragraph.textContent =
        'New bookings and customer messages will appear here when received.';

      emptyState.append(heading, paragraph);
      activityContainer.appendChild(emptyState);
      return;
    }

    const activityList = document.createElement('div');
    activityList.className = 'activity-list';

    recentActivities.forEach(function (activity) {
      const item = document.createElement('article');
      item.className = 'activity-item';

      const icon = document.createElement('div');
      icon.className = `activity-icon ${activity.type}`;
      icon.textContent = activity.type === 'booking' ? '▣' : '✉';

      const content = document.createElement('div');
      content.className = 'activity-content';

      const heading = document.createElement('h3');
      heading.textContent = activity.title;

      const description = document.createElement('p');
      description.textContent = activity.description;

      content.append(heading, description);

      if (activity.type === 'booking') {
        const status = document.createElement('span');
        const statusName = activity.status.toLowerCase();

        status.className = `activity-status ${statusName}`;
        status.textContent = `Status: ${activity.status}`;

        content.appendChild(status);
      }

      const time = document.createElement('span');
      time.className = 'activity-time';

      time.textContent = activity.createdAt
        ? new Date(activity.createdAt + ' UTC').toLocaleString('en-GB')
        : 'Date unavailable';

      content.appendChild(time);

      item.append(icon, content);
      activityList.appendChild(item);
    });

    activityContainer.appendChild(activityList);

  } catch (error) {
    activityContainer.replaceChildren();

    const errorMessage = document.createElement('div');
    errorMessage.className = 'activity-empty';

    const heading = document.createElement('h3');
    heading.textContent = 'Activity unavailable';

    const paragraph = document.createElement('p');
    paragraph.textContent = error.message;

    errorMessage.append(heading, paragraph);
    activityContainer.appendChild(errorMessage);

    console.error('Recent activity error:', error);
  }
}

// BOOKING DETAILS MODAL STYLES
function addBookingModalStyles() {
  if (document.getElementById('booking-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'booking-modal-styles';

  style.textContent = `
    .booking-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 20, 25, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 9999;
    }

    .booking-modal {
      background: #ffffff;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      padding: 26px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
    }

    .booking-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      border-bottom: 1px solid #e8e8e8;
      padding-bottom: 17px;
      margin-bottom: 20px;
    }

    .booking-modal-header h2 {
      font-size: 21px;
      color: #202428;
      margin: 0;
    }

    .booking-modal-close {
      border: none;
      background: #f1f2f4;
      color: #333;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 23px;
      cursor: pointer;
    }

    .booking-detail-row {
      padding: 13px 0;
      border-bottom: 1px solid #eeeeee;
    }

    .booking-detail-label {
      display: block;
      font-size: 12px;
      color: #858b92;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .booking-detail-value {
      display: block;
      font-size: 14px;
      color: #202428;
      line-height: 1.6;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .booking-modal-footer {
      margin-top: 22px;
      display: flex;
      justify-content: flex-end;
    }

    .booking-modal-done {
      background: #f07824;
      color: white;
      border: none;
      padding: 11px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    @media (max-width: 480px) {
      .booking-modal {
        padding: 20px;
      }
    }
  `;

  document.head.appendChild(style);
}

// SHOW BOOKING DETAILS
function showBookingDetails(booking) {
  addBookingModalStyles();

  const overlay = document.createElement('div');
  overlay.className = 'booking-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'booking-modal-title');

  const header = document.createElement('div');
  header.className = 'booking-modal-header';

  const title = document.createElement('h2');
  title.id = 'booking-modal-title';
  title.textContent = 'Booking Details';

  const closeButton = document.createElement('button');
  closeButton.className = 'booking-modal-close';
  closeButton.type = 'button';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close booking details');

  header.append(title, closeButton);

  const detailsContainer = document.createElement('div');

  const details = [
    ['Customer Name', booking.name],
    ['Email Address', booking.email],
    ['Phone Number', booking.phone || 'Not provided'],
    ['Project Type', booking.project],
    ['Project Location', booking.location || 'Not provided'],
    ['Project Description', booking.details || 'No additional details provided'],
    [
      'Submission Date',
      booking.created_at
        ? new Date(booking.created_at + ' UTC').toLocaleString('en-GB')
        : 'Not available'
    ],
    ['Current Status', booking.status || 'Pending']
  ];

  details.forEach(function (item) {
    const row = document.createElement('div');
    row.className = 'booking-detail-row';

    const label = document.createElement('span');
    label.className = 'booking-detail-label';
    label.textContent = item[0];

    const value = document.createElement('span');
    value.className = 'booking-detail-value';
    value.textContent = item[1];

    row.append(label, value);
    detailsContainer.appendChild(row);
  });

  const footer = document.createElement('div');
  footer.className = 'booking-modal-footer';

  const doneButton = document.createElement('button');
  doneButton.className = 'booking-modal-done';
  doneButton.type = 'button';
  doneButton.textContent = 'Close';

  footer.appendChild(doneButton);
  modal.append(header, detailsContainer, footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function closeModal() {
    overlay.remove();
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  closeButton.addEventListener('click', closeModal);
  doneButton.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', handleEscape);
  closeButton.focus();
}

// BOOKING STATUS FILTER
const bookingStatusFilter = document.getElementById('booking-status-filter');

function applyBookingFilter() {
  const tableBody = document.getElementById('bookings-table-body');
  const bookingRecordCount = document.getElementById('booking-record-count');

  if (!tableBody) return;

  const selectedStatus = bookingStatusFilter
    ? bookingStatusFilter.value
    : 'All';

  const rows = Array.from(tableBody.querySelectorAll('tr'));
  let visibleCount = 0;

  rows.forEach(function (row) {
    const status = row.dataset.status;

    const shouldShow =
      selectedStatus === 'All' || status === selectedStatus;

    row.style.display = shouldShow ? '' : 'none';

    if (shouldShow && status) {
      visibleCount++;
    }
  });

  if (bookingRecordCount) {
    bookingRecordCount.textContent =
      `${visibleCount} ${visibleCount === 1 ? 'Booking' : 'Bookings'}`;
  }

  let emptyRow = tableBody.querySelector('.filter-empty-row');

  if (visibleCount === 0 && rows.some(row => row.dataset.status)) {
    if (!emptyRow) {
      emptyRow = document.createElement('tr');
      emptyRow.className = 'filter-empty-row';

      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.textContent = `No ${selectedStatus.toLowerCase()} bookings found.`;

      emptyRow.appendChild(cell);
      tableBody.appendChild(emptyRow);
    } else {
      emptyRow.querySelector('td').textContent =
        `No ${selectedStatus.toLowerCase()} bookings found.`;
    }
  } else if (emptyRow) {
    emptyRow.remove();
  }
}

if (bookingStatusFilter) {
  bookingStatusFilter.addEventListener('change', applyBookingFilter);
}

// LOAD CUSTOMER BOOKINGS
async function loadBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const totalBookings = document.getElementById('total-bookings');

  if (!tableBody) return;

  try {
    const response = await fetch('/api/bookings', {
      credentials: 'same-origin'
    });

    if (!response.ok) throw new Error('Could not load bookings.');

    const data = await response.json();
    const bookings = data.bookings;

    if (totalBookings) {
      totalBookings.textContent = bookings.length;
    }

    const bookingCount = document.getElementById('booking-count');

    if (bookingCount) {
      bookingCount.textContent = bookings.length;
    }

    tableBody.replaceChildren();

    if (bookings.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');

      cell.colSpan = 6;
      cell.textContent = 'No bookings available yet.';

      row.appendChild(cell);
      tableBody.appendChild(row);

      const bookingRecordCount = document.getElementById('booking-record-count');
      if (bookingRecordCount) bookingRecordCount.textContent = '0 Bookings';

      return;
    }

    bookings.forEach(function (booking) {
      const row = document.createElement('tr');

      row.dataset.status = booking.status || 'Pending';

      const values = [
        `${booking.name} (${booking.email})`,
        booking.project,
        booking.location || 'Not provided',
        new Date(booking.created_at + ' UTC').toLocaleDateString()
      ];

      values.forEach(function (value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      // BOOKING STATUS
      const statusCell = document.createElement('td');
      const statusSelect = document.createElement('select');

      ['Pending', 'Approved', 'Rejected', 'Completed'].forEach(function (status) {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = status === (booking.status || 'Pending');
        statusSelect.appendChild(option);
      });

      statusCell.appendChild(statusSelect);
      row.appendChild(statusCell);

      // BOOKING ACTIONS
      const actionCell = document.createElement('td');

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save Status';

      // CONFIRM BOOKING STATUS BEFORE SAVING
      saveButton.addEventListener('click', async function () {
        const selectedStatus = statusSelect.value;
        const previousStatus = booking.status || 'Pending';

        if (['Approved', 'Rejected'].includes(selectedStatus)) {
          const confirmed = window.confirm(
            `Are you sure you want to ${selectedStatus.toLowerCase()} this booking for ${booking.name}?`
          );

          if (!confirmed) {
            statusSelect.value = previousStatus;
            return;
          }
        }

        if (selectedStatus === previousStatus) {
          alert('No status change was made.');
          return;
        }

        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        try {
          const response = await fetch(`/api/bookings/${booking.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ status: selectedStatus })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Update failed.');
          }

          booking.status = selectedStatus;
          row.dataset.status = selectedStatus;

          if (data.emailSent) {
            alert('Booking status updated. Customer notification email sent successfully!');
          } else if (['Approved', 'Rejected'].includes(selectedStatus)) {
            alert('Booking status updated, but the customer email was not sent. Email configuration is still required.');
          } else {
            alert('Booking status updated successfully!');
          }

          saveButton.textContent = 'Saved';

          applyBookingFilter();
          loadRecentActivity();

        } catch (error) {
          alert(error.message);
          statusSelect.value = previousStatus;
          saveButton.textContent = 'Save Status';

        } finally {
          saveButton.disabled = false;
        }
      });

      actionCell.appendChild(saveButton);

      // BOOKING DETAILS MODAL BUTTON
      const detailsButton = document.createElement('button');
      detailsButton.textContent = 'Details';
      detailsButton.type = 'button';

      detailsButton.addEventListener('click', function () {
        showBookingDetails(booking);
      });

      actionCell.appendChild(detailsButton);
      row.appendChild(actionCell);
      tableBody.appendChild(row);
    });

    applyBookingFilter();

  } catch (error) {
    tableBody.textContent = error.message;
  }
}

loadBookings();

// LOAD CUSTOMER MESSAGES
async function loadMessages() {
  const messagesList = document.getElementById('messages-list');
  const messagesTotal = document.getElementById('messages-total');
  const messageCount = document.getElementById('message-count');
  const totalMessages = document.getElementById('total-messages');

  if (!messagesList) return;

  messagesList.textContent = 'Loading messages...';

  try {
    const response = await fetch('/api/messages', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Could not load customer messages.');
    }

    const data = await response.json();
    const messages = data.messages;

    if (messagesTotal) messagesTotal.textContent = `${messages.length} Messages`;
    if (messageCount) messageCount.textContent = messages.length;
    if (totalMessages) totalMessages.textContent = messages.length;

    messagesList.replaceChildren();

    if (messages.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';

      const icon = document.createElement('div');
      icon.className = 'empty-icon';
      icon.textContent = '✉';

      const heading = document.createElement('h3');
      heading.textContent = 'No messages yet';

      const paragraph = document.createElement('p');
      paragraph.textContent = 'Customer messages will appear here when someone contacts the business.';

      emptyState.append(icon, heading, paragraph);
      messagesList.appendChild(emptyState);
      return;
    }

    messages.forEach(function (message) {
      const messageCard = document.createElement('article');
      messageCard.className = 'message-card';

      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-card-header';

      const customerName = document.createElement('h3');
      customerName.textContent = message.name;

      const messageStatus = document.createElement('span');
      messageStatus.className = 'message-status';
      messageStatus.textContent = message.status || 'New';

      messageHeader.append(customerName, messageStatus);

      const email = document.createElement('p');
      email.textContent = `Email: ${message.email}`;

      const subject = document.createElement('p');
      subject.textContent = `Subject: ${message.subject || 'No subject'}`;

      const date = document.createElement('p');
      date.textContent = `Received: ${new Date(message.created_at + ' UTC').toLocaleString('en-GB')}`;

      // FULL MESSAGE TOGGLE
      const messageToggle = document.createElement('button');
      messageToggle.type = 'button';
      messageToggle.className = 'message-view-button';
      messageToggle.textContent = 'View Full Message';

      const messageDetails = document.createElement('div');
      messageDetails.className = 'message-full-content';
      messageDetails.hidden = true;

      const messageText = document.createElement('p');
      messageText.className = 'message-content';
      messageText.textContent = message.message;

      messageDetails.appendChild(messageText);

      messageToggle.addEventListener('click', function () {
        const isHidden = messageDetails.hidden;
        messageDetails.hidden = !isHidden;
        messageToggle.textContent = isHidden ? 'Hide Full Message' : 'View Full Message';
      });

      // REPLY SECTION
      const replySection = document.createElement('div');
      replySection.className = 'message-reply-section';

      const replyHeading = document.createElement('h4');
      replyHeading.textContent = 'Reply to Customer';

      const replyTextarea = document.createElement('textarea');
      replyTextarea.className = 'message-reply-input';
      replyTextarea.placeholder = 'Write your response to this customer...';
      replyTextarea.rows = 5;
      replyTextarea.maxLength = 5000;

      const replyButton = document.createElement('button');
      replyButton.type = 'button';
      replyButton.className = 'message-reply-button';
      replyButton.textContent = 'Send Reply';

      const replyFeedback = document.createElement('p');
      replyFeedback.className = 'message-reply-feedback';
      replyFeedback.setAttribute('aria-live', 'polite');

      replyButton.addEventListener('click', async function () {
        const reply = replyTextarea.value.trim();

        if (!reply) {
          replyFeedback.textContent = 'Please write a reply first.';
          return;
        }

        replyButton.disabled = true;
        replyButton.textContent = 'Sending...';
        replyFeedback.textContent = 'Sending your reply...';

        try {
          const response = await fetch(`/api/messages/${message.id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ reply })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Could not send reply.');
          }

          messageStatus.textContent = 'Replied';
          replyFeedback.textContent = 'Reply email sent successfully!';
          replyTextarea.value = '';
          replyButton.textContent = 'Send Another Reply';

        } catch (error) {
          replyFeedback.textContent = error.message;
          replyButton.textContent = 'Try Again';

        } finally {
          replyButton.disabled = false;
        }
      });

      replySection.append(
        replyHeading,
        replyTextarea,
        replyButton,
        replyFeedback
      );

      messageCard.append(
        messageHeader,
        email,
        subject,
        date,
        messageToggle,
        messageDetails,
        replySection
      );

      messagesList.appendChild(messageCard);
    });

  } catch (error) {
    messagesList.textContent = error.message;
  }
}

// CUSTOMER SEARCH
function filterCustomers() {
  const searchInput = document.getElementById('customer-search');

  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const customerCards = document.querySelectorAll('.customer-card');

  customerCards.forEach(function (card) {
    const customerInfo = card.textContent.toLowerCase();

    card.style.display = customerInfo.includes(searchTerm) ? '' : 'none';
  });
}

const customerSearch = document.getElementById('customer-search');

if (customerSearch) {
  customerSearch.addEventListener('input', filterCustomers);
}

// LOAD CUSTOMERS
async function loadCustomers() {
  const customersList = document.getElementById('customers-list');
  const totalCustomers = document.getElementById('total-customers');

  if (!customersList) return;

  customersList.textContent = 'Loading customers...';

  try {
    const response = await fetch('/api/customers', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Could not load customers.');
    }

    const data = await response.json();
    const customers = data.customers;

    if (totalCustomers) {
      totalCustomers.textContent = customers.length;
    }

    customersList.replaceChildren();

    if (customers.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';

      const icon = document.createElement('div');
      icon.className = 'empty-icon';
      icon.textContent = '♙';

      const heading = document.createElement('h3');
      heading.textContent = 'No customers yet';

      const paragraph = document.createElement('p');
      paragraph.textContent =
        'Customers will appear here when booking enquiries are received.';

      emptyState.append(icon, heading, paragraph);
      customersList.appendChild(emptyState);
      return;
    }

    customers.forEach(function (customer) {
      const card = document.createElement('article');
      card.className = 'customer-card';

      const name = document.createElement('h3');
      name.textContent = customer.name;

      const email = document.createElement('p');
      email.textContent = `Email: ${customer.email}`;

      const phone = document.createElement('p');
      phone.textContent = `Phone: ${customer.phone || 'Not provided'}`;

      const bookings = document.createElement('p');
      bookings.textContent = `Total bookings: ${customer.booking_count}`;

      const lastBooking = document.createElement('p');
      lastBooking.textContent =
        `Last enquiry: ${customer.last_booking
          ? new Date(customer.last_booking + ' UTC').toLocaleDateString('en-GB')
          : 'Not available'}`;

      card.append(name, email, phone, bookings, lastBooking);
      customersList.appendChild(card);
    });

    filterCustomers();

  } catch (error) {
    customersList.textContent = error.message;
  }
}

// LOAD ALL DASHBOARD DATA
loadMessages();
loadCustomers();
loadRecentActivity();
