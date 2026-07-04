/**
 * ============================================================
 *  SUSPICIOUS ACTIVITY REPORTING SYSTEM — script.js
 *  Handles: Navbar, Report Form, Admin Login, Admin Dashboard
 *
 *  Data layer: Firebase Firestore
 * ============================================================
 */

/* ────────────────────────────────────────────────
   FIREBASE CONFIG & INITIALIZATION
──────────────────────────────────────────────── */

const firebaseConfig = {
  apiKey:            "AIzaSyDAIX0VvOJDb5RPWT7ehHshTl5abQ0BY44",
  authDomain:        "citizenshield-9feb9.firebaseapp.com",
  projectId:         "citizenshield-9feb9",
  storageBucket:     "citizenshield-9feb9.firebasestorage.app",
  messagingSenderId: "808708978891",
  appId:             "1:808708978891:web:d3daeeb2ecf40fb18c434e",
};

// Initialize Firebase (compat SDK loaded via CDN in each HTML file)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const REPORTS_COLLECTION = 'reports';

/* ────────────────────────────────────────────────
   SEED DATA — inserted on first run (empty DB)
──────────────────────────────────────────────── */

const SEED_REPORTS = [
  {
    name:        'Priya Sharma',
    location:    'Connaught Place Metro Station, New Delhi',
    description: 'Noticed a man leaving a large unattended backpack near the entrance of the metro station and walking away briskly. The bag was left there for over 15 minutes.',
    datetime:    '2026-04-08T09:15',
    image:       null,
    status:      'Pending',
    submittedAt: '2026-07-04T12:37:47.327Z',
  },
  {
    name:        'Arjun Mehta',
    location:    'Sector 14 Market, Gurgaon',
    description: 'Three individuals repeatedly circling the ATM kiosk, looking around nervously and photographing the machine from different angles. One of them wore a mask.',
    datetime:    '2026-04-07T18:45',
    image:       null,
    status:      'Pending',
    submittedAt: '2026-07-04T12:37:47.337Z',
  },
  {
    name:        'Sunita Rao',
    location:    'Near Government School, Civil Lines, Jaipur',
    description: 'An unknown vehicle, a white SUV with no visible number plates, was parked outside the school for nearly two hours during school hours. The driver did not exit the vehicle.',
    datetime:    '2026-04-06T13:30',
    image:       null,
    status:      'Pending',
    submittedAt: '2026-07-04T12:37:47.346Z',
  },
  {
    name:        'Rahul D.',
    location:    'MG Road Flyover, Pune',
    description: 'Some individuals were seen breaking open a manhole cover below the flyover late at night. They carried tools and appeared to be removing something from inside.',
    datetime:    '2026-04-05T23:10',
    image:       null,
    status:      'Pending',
    submittedAt: '2026-07-04T12:37:47.356Z',
  },
  {
    name:        'Anika Singh',
    location:    'Railway Platform 3, Chennai Central',
    description: 'Spotted a person photographing security camera positions on the railway platform for an unusually long period. The individual left when approached by a railway employee.',
    datetime:    '2026-04-04T16:00',
    image:       null,
    status:      'Resolved',
    submittedAt: '2026-07-04T12:37:47.370Z',
    updatedAt:   '2026-07-04T12:37:55.522Z',
  },
  {
    name:        'Vidit Dixit',
    location:    'Sector 41',
    description: 'Suspicious individuals spotted near the sector gate late at night, loitering for an extended period and leaving abruptly when approached.',
    datetime:    '2026-07-04T18:08',
    image:       null,
    status:      'Resolved',
    submittedAt: '2026-07-04T12:38:46.699Z',
    updatedAt:   '2026-07-04T12:39:03.972Z',
  },
];

/**
 * Seeds Firestore with demo data if the collection is empty.
 */
async function seedIfEmpty() {
  try {
    const snapshot = await db.collection(REPORTS_COLLECTION).limit(1).get();
    if (!snapshot.empty) return; // already has data

    console.log('%c🌱 Seeding Firestore with demo reports…', 'color:orange;font-weight:bold;');
    const batch = db.batch();
    SEED_REPORTS.forEach((report) => {
      const ref = db.collection(REPORTS_COLLECTION).doc();
      batch.set(ref, { ...report, id: ref.id });
    });
    await batch.commit();
    console.log('%c✅ Seed complete — 6 reports added.', 'color:green;font-weight:bold;');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

/* ────────────────────────────────────────────────
   UTILITIES
──────────────────────────────────────────────── */

/** Get current page filename */
const currentPage = () => location.pathname.split('/').pop() || 'index.html';

/** Generate a short unique ID (client-side, as fallback label) */
const uid = () => 'RPT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

/** Format a datetime string for display */
const fmtDatetime = (dtStr) => {
  if (!dtStr) return '—';
  try {
    const d = new Date(dtStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return dtStr; }
};

/** Get avatar initials from name */
const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
};

/* ────────────────────────────────────────────────
   TOAST NOTIFICATIONS
──────────────────────────────────────────────── */

/**
 * Show a toast notification.
 * @param {string} type   'success' | 'error' | 'info'
 * @param {string} title
 * @param {string} message
 * @param {number} duration  ms (default 4000)
 */
function showToast(type = 'success', title = '', message = '', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <h4>${title}</h4>
      ${message ? `<p>${message}</p>` : ''}
    </div>
    <button class="toast-close" title="Dismiss">✕</button>
  `;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 320);
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

/* ────────────────────────────────────────────────
   NAVBAR — Mobile Toggle + Scroll Shadow
──────────────────────────────────────────────── */

function initNavbar() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  const navbar = document.getElementById('navbar');

  toggle?.addEventListener('click', () => {
    links.classList.toggle('open');
    const isOpen = links.classList.contains('open');
    toggle.innerHTML = isOpen
      ? '<i class="ph ph-x"></i>'
      : '<i class="ph ph-list"></i>';
  });

  // Close menu when a link is clicked
  links?.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.innerHTML = '<i class="ph ph-list"></i>';
    });
  });

  // Navbar shadow on scroll
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 24px rgba(59,111,202,0.14)';
      } else {
        navbar.style.boxShadow = '0 2px 16px rgba(59,111,202,0.07)';
      }
    });
  }
}

/* ────────────────────────────────────────────────
   DATA LAYER — Firebase Firestore
──────────────────────────────────────────────── */

/**
 * Fetch all reports from Firestore, ordered newest first.
 * @returns {Promise<Array>}
 */
async function fetchAllReports() {
  try {
    const snapshot = await db
      .collection(REPORTS_COLLECTION)
      .orderBy('submittedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('fetchAllReports error:', err);
    return [];
  }
}

/**
 * Submit a new report to Firestore.
 * @param {Object} report
 * @returns {Promise<Object>} The saved report with Firestore-assigned id
 */
async function submitReport(report) {
  const docRef = db.collection(REPORTS_COLLECTION).doc();
  const newReport = {
    ...report,
    id:          docRef.id,
    status:      'Pending',
    submittedAt: new Date().toISOString(),
  };
  await docRef.set(newReport);
  return newReport;
}

/**
 * Update report status in Firestore.
 * @param {string} id
 * @param {string} status
 */
async function updateReportStatus(id, status) {
  await db.collection(REPORTS_COLLECTION).doc(id).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a report from Firestore.
 * @param {string} id
 */
async function deleteReport(id) {
  await db.collection(REPORTS_COLLECTION).doc(id).delete();
}

/* ────────────────────────────────────────────────
   REPORT FORM PAGE (report.html)
──────────────────────────────────────────────── */

function initReportForm() {
  const form        = document.getElementById('reportForm');
  if (!form) return;

  const nameInput   = document.getElementById('reporterName');
  const dtInput     = document.getElementById('datetime');
  const locInput    = document.getElementById('location');
  const descInput   = document.getElementById('description');
  const imgInput    = document.getElementById('imageUpload');
  const filePreview = document.getElementById('filePreview');
  const fileName    = document.getElementById('fileName');
  const removeFile  = document.getElementById('removeFile');
  const errImage    = document.getElementById('err-image');
  const charCount   = document.getElementById('charCount');
  const submitBtn   = document.getElementById('submitBtn');
  const dropZone    = document.getElementById('fileDropZone');

  // Auto-fill current datetime
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dtInput.value = now.toISOString().slice(0, 16);

  // Character counter for description
  descInput?.addEventListener('input', () => {
    charCount.textContent = descInput.value.length;
    if (descInput.classList.contains('is-invalid') && descInput.value.trim().length >= 20) {
      descInput.classList.remove('is-invalid');
    }
  });

  // File upload handling
  let uploadedImageBase64 = null;

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      errImage.style.display = 'block';
      imgInput.value = '';
      return;
    }
    errImage.style.display = 'none';
    fileName.textContent = file.name;
    filePreview.style.display = 'flex';

    const reader = new FileReader();
    reader.onload = (e) => { uploadedImageBase64 = e.target.result; };
    reader.readAsDataURL(file);
  };

  imgInput?.addEventListener('change', () => handleFile(imgInput.files[0]));

  // Drag & Drop
  dropZone?.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone?.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });

  removeFile?.addEventListener('click', () => {
    imgInput.value = '';
    uploadedImageBase64 = null;
    filePreview.style.display = 'none';
    fileName.textContent = '';
  });

  // Inline validation helpers
  const validateField = (input, errId, condition, msg) => {
    const errEl = document.getElementById(errId);
    if (!condition) {
      input.classList.add('is-invalid');
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      return false;
    }
    input.classList.remove('is-invalid');
    if (errEl) errEl.style.display = 'none';
    return true;
  };

  // Clear errors on input
  [nameInput, locInput, descInput, dtInput].forEach(el => {
    el?.addEventListener('input', () => el.classList.remove('is-invalid'));
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = nameInput.value.trim();
    const dtVal   = dtInput.value.trim();
    const locVal  = locInput.value.trim();
    const descVal = descInput.value.trim();

    let valid = true;
    valid = validateField(nameInput, 'err-name',     nameVal.length >= 2,  'Please enter your full name (at least 2 characters).') && valid;
    valid = validateField(dtInput,   'err-datetime',  dtVal !== '',         'Please select the date and time of the incident.') && valid;
    valid = validateField(locInput,  'err-location',  locVal.length >= 5,   'Please enter a more specific location (at least 5 characters).') && valid;
    valid = validateField(descInput, 'err-desc',      descVal.length >= 20, 'Please describe the activity in at least 20 characters.') && valid;

    if (!valid) {
      showToast('error', 'Incomplete Form', 'Please fill in all required fields correctly.');
      const firstErr = form.querySelector('.is-invalid');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Disable submit during processing
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Submitting…';

    try {
      const reportPayload = {
        name:        nameVal,
        location:    locVal,
        description: descVal,
        datetime:    dtVal,
        image:       uploadedImageBase64 || null,
      };

      const saved = await submitReport(reportPayload);

      showToast('success', 'Report Submitted!',
        `Your report ID is <strong>${saved.id}</strong>. Authorities have been notified. <em style="font-size:0.78em;opacity:0.7">Saved to Firebase.</em>`,
        6000);

      form.reset();
      uploadedImageBase64 = null;
      filePreview.style.display = 'none';
      charCount.textContent = '0';

      // Re-fill datetime
      const n = new Date();
      n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
      dtInput.value = n.toISOString().slice(0, 16);

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showToast('error', 'Submission Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Submit Report';
    }
  });

  // Reset button clears previews too
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    uploadedImageBase64 = null;
    filePreview.style.display = 'none';
    charCount.textContent = '0';
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.input-error').forEach(el => el.style.display = 'none');
    // Re-fill datetime
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    dtInput.value = n.toISOString().slice(0, 16);
  });
}

/* ────────────────────────────────────────────────
   ADMIN LOGIN PAGE (login.html)
──────────────────────────────────────────────── */

function initLoginPage() {
  const form    = document.getElementById('loginForm');
  if (!form) return;

  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123';

  // Password toggle
  const pwdInput = document.getElementById('password');
  const eyeIcon  = document.getElementById('pwdEyeIcon');
  document.getElementById('togglePwd')?.addEventListener('click', () => {
    const isPass = pwdInput.type === 'password';
    pwdInput.type = isPass ? 'text' : 'password';
    eyeIcon.className = isPass ? 'ph ph-eye-slash' : 'ph ph-eye';
  });

  const credErr  = document.getElementById('err-credentials');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = document.getElementById('username').value.trim();
    const pass = pwdInput.value;

    let valid = true;

    if (!user) {
      document.getElementById('username').classList.add('is-invalid');
      document.getElementById('err-username').style.display = 'block';
      valid = false;
    } else {
      document.getElementById('username').classList.remove('is-invalid');
      document.getElementById('err-username').style.display = 'none';
    }

    if (!pass) {
      pwdInput.classList.add('is-invalid');
      document.getElementById('err-password').style.display = 'block';
      valid = false;
    } else {
      pwdInput.classList.remove('is-invalid');
      document.getElementById('err-password').style.display = 'none';
    }

    if (!valid) return;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      credErr.style.display = 'none';
      sessionStorage.setItem('sars_admin_logged_in', 'true');
      showToast('success', 'Login Successful', 'Redirecting to dashboard…', 2000);
      setTimeout(() => { window.location.href = 'admin.html'; }, 1200);
    } else {
      credErr.style.display = 'block';
      pwdInput.value = '';
      pwdInput.classList.add('is-invalid');
    }
  });

  // Clear credential error on input
  ['username', 'password'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      credErr.style.display = 'none';
    });
  });
}

/* ────────────────────────────────────────────────
   ADMIN DASHBOARD PAGE (admin.html)
──────────────────────────────────────────────── */

function initAdminDashboard() {
  if (!document.getElementById('reportsList')) return;

  // Auth guard
  if (!sessionStorage.getItem('sars_admin_logged_in')) {
    window.location.href = 'login.html';
    return;
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('sars_admin_logged_in');
    showToast('info', 'Logged Out', 'You have been signed out.', 2500);
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
  });

  // State
  let currentFilter = 'all';
  let searchQuery   = '';
  let allReports    = [];

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderReports();
    });
  });

  // Search
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderReports();
  });

  // Seed demo data button (inserts into Firestore)
  document.getElementById('seedBtn')?.addEventListener('click', async () => {
    if (allReports.length > 0) {
      showToast('info', 'Reports Exist', 'Data is already loaded.', 3500);
      return;
    }
    const btn = document.getElementById('seedBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner"></i> Loading…';
    try {
      const batch = db.batch();
      SEED_REPORTS.forEach((report) => {
        const ref = db.collection(REPORTS_COLLECTION).doc();
        batch.set(ref, { ...report, id: ref.id });
      });
      await batch.commit();
      await loadAndRender();
      showToast('success', 'Demo Data Loaded', '6 sample reports have been added.', 3500);
    } catch (err) {
      showToast('error', 'Seed Failed', err.message, 4000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Load Demo Reports';
    }
  });

  // Image modal
  const imgModal      = document.getElementById('imgModal');
  const imgModalImg   = document.getElementById('imgModalImg');
  const imgModalClose = document.getElementById('imgModalClose');

  imgModalClose?.addEventListener('click', () => { imgModal.classList.add('hidden'); });
  imgModal?.addEventListener('click', (e) => { if (e.target === imgModal) imgModal.classList.add('hidden'); });

  window.openImageModal = (src) => {
    imgModalImg.src = src;
    imgModal.classList.remove('hidden');
  };

  // ── Load from Firestore and render ──
  async function loadAndRender() {
    const list = document.getElementById('reportsList');
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><h3>Loading Reports…</h3><p>Fetching data from Firebase.</p></div>`;
    allReports = await fetchAllReports();
    renderReports();
  }

  // ── Render Reports (uses cached `allReports`) ──
  function renderReports() {
    const list     = document.getElementById('reportsList');
    const seedWrap = document.getElementById('seedWrap');
    let   reports  = [...allReports];

    // Filter
    if (currentFilter !== 'all') {
      reports = reports.filter(r => r.status === currentFilter);
    }

    // Search
    if (searchQuery) {
      reports = reports.filter(r =>
        r.name.toLowerCase().includes(searchQuery) ||
        r.location.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery)
      );
    }

    // Update stat cards
    const pending  = allReports.filter(r => r.status === 'Pending').length;
    const verified = allReports.filter(r => r.status === 'Verified').length;
    const resolved = allReports.filter(r => r.status === 'Resolved').length;

    document.getElementById('statTotal').textContent    = allReports.length;
    document.getElementById('statPending').textContent  = pending;
    document.getElementById('statVerified').textContent = verified;
    document.getElementById('statResolved').textContent = resolved;

    // Show/hide seed button
    if (allReports.length > 0 && seedWrap) seedWrap.style.display = 'none';

    // Empty state
    if (reports.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>${allReports.length === 0 ? 'No Reports Yet' : 'No Matching Reports'}</h3>
          <p>${allReports.length === 0
            ? 'When citizens submit reports, they will appear here.'
            : 'Try adjusting your search or filter criteria.'
          }</p>
        </div>`;
      return;
    }

    list.innerHTML = '';
    reports.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'report-card';
      card.style.animationDelay = `${i * 0.06}s`;

      const statusClass = {
        Pending:  'status-pending',
        Verified: 'status-verified',
        Resolved: 'status-resolved',
      }[r.status] || 'status-pending';

      const actionButtons = [];
      if (r.status !== 'Verified')  actionButtons.push(`<button class="btn btn-info btn-sm" onclick="changeStatus('${r.id}', 'Verified')"><i class="ph ph-magnifying-glass"></i> Mark Verified</button>`);
      if (r.status !== 'Resolved')  actionButtons.push(`<button class="btn btn-success btn-sm" onclick="changeStatus('${r.id}', 'Resolved')"><i class="ph ph-check-circle"></i> Mark Resolved</button>`);
      if (r.status !== 'Pending')   actionButtons.push(`<button class="btn btn-outline btn-sm" onclick="changeStatus('${r.id}', 'Pending')" style="font-size:0.78rem;padding:6px 12px;"><i class="ph ph-clock"></i> Reset Pending</button>`);
      actionButtons.push(`<button class="btn btn-danger btn-sm" onclick="removeReport('${r.id}')"><i class="ph ph-trash"></i> Delete</button>`);

      const imgThumb = r.image
        ? `<img src="${r.image}" class="report-image-preview" alt="Attached image" title="Click to enlarge" onclick="openImageModal('${r.image}')" />`
        : '';

      card.innerHTML = `
        <div class="report-card-top">
          <div class="report-avatar">${initials(r.name)}</div>
          <div class="report-meta-wrap">
            <div class="report-name">${escapeHtml(r.name)}</div>
            <div class="report-location">
              <i class="ph ph-map-pin" style="color:var(--accent);"></i>
              ${escapeHtml(r.location)}
            </div>
            <div class="report-desc">${escapeHtml(r.description)}</div>
          </div>
          <div class="report-status-wrap">
            <span class="status-badge ${statusClass}">${r.status}</span>
            <span class="report-datetime">${fmtDatetime(r.datetime)}</span>
          </div>
        </div>
        <div class="report-card-bottom">
          <span class="report-id"><i class="ph ph-hash"></i> ${r.id}</span>
          ${imgThumb}
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${actionButtons.join('')}
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  // Expose to global scope for inline onclick handlers
  window.changeStatus = async (id, status) => {
    try {
      await updateReportStatus(id, status);
      await loadAndRender();
      const labels = { Verified: '🔍 Marked as Verified', Resolved: '✅ Marked as Resolved', Pending: '⏳ Reset to Pending' };
      showToast('success', 'Status Updated', labels[status] || 'Status changed.');
    } catch (err) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  window.removeReport = async (id) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await deleteReport(id);
        await loadAndRender();
        showToast('info', 'Report Deleted', 'The report has been removed permanently.');
      } catch (err) {
        showToast('error', 'Delete Failed', err.message);
      }
    }
  };

  // Initial load
  loadAndRender();
}

/* ────────────────────────────────────────────────
   SECURITY HELPER — Prevent XSS
──────────────────────────────────────────────── */
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ────────────────────────────────────────────────
   INTERSECTION OBSERVER — Scroll animations
──────────────────────────────────────────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.feature-card, .importance-item, .stat-card, .report-card');
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.45s ease ${i * 0.06}s, transform 0.45s ease ${i * 0.06}s`;
    observer.observe(el);
  });
}

/* ────────────────────────────────────────────────
   INIT — Run the right logic per page
──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();

  console.log('%c🔥 Firebase Firestore connected — CitizenShield SARS', 'color:#f97316;font-weight:bold;');

  // Seed Firestore with demo data on first run (if empty)
  await seedIfEmpty();

  const page = currentPage();

  if (page === 'report.html' || page === '') {
    initReportForm();
  }

  if (page === 'login.html') {
    if (sessionStorage.getItem('sars_admin_logged_in')) {
      window.location.href = 'admin.html';
      return;
    }
    initLoginPage();
  }

  if (page === 'admin.html') {
    initAdminDashboard();
  }

  // Scroll animations on all pages
  setTimeout(initScrollAnimations, 200);
});
