(() => {
  const app = document.getElementById('studentApp');
  const STORE_KEY = 'daymark-student-planner-v1';
  const navItems = [
    ['home', 'Home', '⌂'], ['schedule', 'Schedule', '▦'], ['attendance', 'Attendance', '✓'],
    ['tasks', 'Tasks', '☷'], ['study', 'Study', '◷'], ['budget', 'Budget', '$']
  ];
  const defaults = {
    classes: [
      { id: 'course-bio', name: 'Biology 204', teacher: 'Prof. Santos', room: 'Science 301', day: 1, start: '09:00', end: '10:30', tone: '#789270' },
      { id: 'course-writing', name: 'Academic Writing', teacher: 'Ms. Cruz', room: 'Humanities 208', day: 1, start: '13:00', end: '14:30', tone: '#df7966' },
      { id: 'course-stats', name: 'Statistics II', teacher: 'Dr. Lim', room: 'West Hall 114', day: 2, start: '10:00', end: '11:30', tone: '#7894b2' },
      { id: 'course-history', name: 'Philippine History', teacher: 'Prof. Reyes', room: 'Humanities 106', day: 3, start: '09:30', end: '11:00', tone: '#a38cb4' },
      { id: 'course-cs', name: 'Computer Science', teacher: 'Mr. Garcia', room: 'Tech Lab 2', day: 4, start: '10:00', end: '12:00', tone: '#42664d' },
      { id: 'course-lab', name: 'Biology Lab', teacher: 'Prof. Santos', room: 'Science Lab', day: 4, start: '14:00', end: '16:00', tone: '#e0aa42' },
      { id: 'course-econ', name: 'Microeconomics', teacher: 'Dr. Flores', room: 'East Hall 205', day: 5, start: '11:00', end: '12:30', tone: '#df7966' }
    ],
    tasks: [], attendance: {}, studySessions: [], expenses: [], monthlyBudget: 12000
  };
  const today = new Date();
  const todayKey = dateKey(today);
  const colors = ['#789270', '#df7966', '#7894b2', '#a38cb4', '#e0aa42', '#42664d'];
  const moneyCategories = ['Food', 'Transport', 'Supplies', 'Personal', 'Other'];
  const state = {
    page: 'home',
    taskFilter: 'all',
    attendanceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    timerSeconds: 25 * 60,
    timerRunning: false,
    timerInterval: null,
    timerSubject: '',
    data: loadData()
  };

  function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function parseDate(value) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }
  function shiftDate(date, amount) { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
  function dayLabel(day) { return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]; }
  function shortDate(value, options = { month: 'short', day: 'numeric' }) { return new Intl.DateTimeFormat(undefined, options).format(parseDate(value)); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function loadData() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY));
      if (stored && Array.isArray(stored.classes) && Array.isArray(stored.tasks)) return { ...defaults, ...stored };
    } catch { /* Use the starter data if local storage is empty or unavailable. */ }
    const tasks = [
      { id: 'task-essay', title: 'Research essay: local history', courseId: 'course-writing', due: dateKey(shiftDate(today, 1)), priority: 'High', kind: 'Assignment', done: false },
      { id: 'task-lab', title: 'Read chapter 6 before lab', courseId: 'course-bio', due: dateKey(shiftDate(today, 2)), priority: 'Normal', kind: 'Assignment', done: false },
      { id: 'task-quiz', title: 'Statistics problem set', courseId: 'course-stats', due: dateKey(shiftDate(today, 4)), priority: 'High', kind: 'Assignment', done: false },
      { id: 'task-club', title: 'Design club check-in', courseId: '', due: dateKey(shiftDate(today, 3)), priority: 'Normal', kind: 'Event', done: false }
    ];
    return { ...defaults, tasks, attendance: {} };
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.data)); }
    catch { toast('Could not save. Check device storage.'); }
  }
  function money(amount) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number(amount) || 0); }
  function timeLabel(time) { const [hour, minute] = time.split(':').map(Number); const suffix = hour < 12 ? 'AM' : 'PM'; return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`; }
  function classEndTime(classItem, date) {
    const [hour, minute] = classItem.end.split(':').map(Number);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    return end;
  }
  function getNextClass() {
    const now = new Date();
    return state.data.classes.map((item) => {
      const daysUntil = (item.day - now.getDay() + 7) % 7;
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil);
      const [hour, minute] = item.start.split(':').map(Number);
      const starts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
      const ends = classEndTime(item, date);
      if (daysUntil === 0 && ends <= now) starts.setDate(starts.getDate() + 7);
      return { ...item, starts };
    }).filter((item) => item.starts > now).sort((a, b) => a.starts - b.starts)[0] || null;
  }
  function countdown(target) {
    const seconds = Math.max(0, Math.floor((target - new Date()) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainder = seconds % 60;
    return days ? `${days}d ${String(hours).padStart(2, '0')}h` : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }
  function todayClasses(date = today) {
    return state.data.classes.filter((item) => item.day === date.getDay()).sort((a, b) => a.start.localeCompare(b.start));
  }
  function courseName(id) { return state.data.classes.find((item) => item.id === id)?.name || 'Personal'; }
  function attendanceSummary() {
    const values = Object.values(state.data.attendance);
    const attended = values.filter((value) => value === 'present' || value === 'late').length;
    const possible = Math.max(values.length, 1);
    return { attended, possible, rate: values.length ? Math.round(attended / possible * 100) : null };
  }
  function monthExpenses() {
    const month = todayKey.slice(0, 7);
    return state.data.expenses.filter((item) => item.date.startsWith(month));
  }
  function studyMinutesToday() {
    return state.data.studySessions.filter((item) => item.date === todayKey).reduce((total, item) => total + item.minutes, 0);
  }
  function navMarkup(className) {
    return `<nav class="${className}" aria-label="Main navigation">${className.includes('sidebar') ? '<div class="sp-nav-label">Workspace</div>' : ''}${navItems.map(([id, label, icon]) => `<button class="sp-nav-button ${state.page === id ? 'active' : ''}" data-page="${id}" aria-current="${state.page === id ? 'page' : 'false'}"><span class="sp-nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`).join('')}</nav>`;
  }
  function renderShell() {
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
    const pageTitles = { home: [greeting, 'A fresh start to your study day.'], schedule: ['My schedule', 'Your classes and campus commitments.'], attendance: ['Attendance', 'Keep track of every class day.'], tasks: ['Tasks & events', 'Assignments, reminders, and deadlines in one place.'], study: ['Study room', 'A little focused time adds up.'], budget: ['Student budget', 'Keep an eye on where your money goes.'] };
    const [title, subtitle] = pageTitles[state.page];
    app.innerHTML = `<div class="sp-shell">
      <aside class="sp-sidebar"><div class="sp-brand"><span class="sp-brand-mark">d</span><div><div class="sp-brand-name">daymark</div><div class="sp-brand-sub">STUDENT PLANNER</div></div></div>${navMarkup('sp-nav')}<div class="sp-side-note"><strong>Small steps count.</strong><p>Pick one thing to focus on, and give it your full attention.</p></div><div class="sp-profile"><div class="sp-avatar">S</div><div><strong>Student planner</strong><span>Saved on this device</span></div></div></aside>
      <main class="sp-main"><header class="sp-topbar"><div><div class="sp-mobile-brand"><span class="sp-brand-mark">d</span><span class="sp-brand-name">daymark</span></div><p class="sp-kicker">${state.page === 'home' ? escapeHtml(dayLabel(today.getDay())) : 'YOUR CAMPUS DAY'}</p><h1 class="sp-title">${escapeHtml(title)}</h1><p style="margin:5px 0 0;color:var(--sp-muted);font-size:10px">${escapeHtml(subtitle)}</p></div><div class="sp-top-date">${escapeHtml(new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(today))}</div></header>
      <section class="sp-page ${state.page === 'home' ? 'active' : ''}" data-view="home"></section>
      <section class="sp-page ${state.page === 'schedule' ? 'active' : ''}" data-view="schedule"></section>
      <section class="sp-page ${state.page === 'attendance' ? 'active' : ''}" data-view="attendance"></section>
      <section class="sp-page ${state.page === 'tasks' ? 'active' : ''}" data-view="tasks"></section>
      <section class="sp-page ${state.page === 'study' ? 'active' : ''}" data-view="study"></section>
      <section class="sp-page ${state.page === 'budget' ? 'active' : ''}" data-view="budget"></section>
      </main>${navMarkup('sp-mobile-nav')}</div>
      <dialog class="sp-dialog" id="spDialog"><form id="spForm"></form></dialog><div class="toast" id="spToast" role="status" aria-live="polite"></div>`;
    renderActivePage();
    bindShellEvents();
  }
  function agendaRows(items) {
    if (!items.length) return '<div class="sp-empty">No classes on the schedule today. Enjoy the open time.</div>';
    return items.map((item) => `<div class="sp-agenda-row"><span class="sp-agenda-time">${timeLabel(item.start)}</span><span class="sp-agenda-dot" style="--dot:${item.tone}"></span><div><strong>${escapeHtml(item.name)}</strong><span>${timeLabel(item.start)}–${timeLabel(item.end)} · ${escapeHtml(item.room)}</span></div></div>`).join('');
  }
  function taskLines(items, preview = false) {
    const ordered = [...items].filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, preview ? 3 : items.length);
    if (!ordered.length) return '<div class="sp-empty">You are all caught up. Enjoy the breathing room.</div>';
    return ordered.map((item) => `<div class="sp-task-line"><button class="sp-task-check ${item.done ? 'done' : ''}" data-task-toggle="${escapeHtml(item.id)}" aria-label="Mark ${escapeHtml(item.title)} complete">${item.done ? '✓' : ''}</button><div class="sp-task-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(courseName(item.courseId))} · Due ${shortDate(item.due)}</span></div><span class="sp-pill">${escapeHtml(item.priority)}</span></div>`).join('');
  }
  function renderHome() {
    const next = getNextClass();
    const summary = attendanceSummary();
    const expenseTotal = monthExpenses().reduce((total, item) => total + Number(item.amount), 0);
    const upcomingDue = state.data.tasks.filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due))[0];
    const nextHtml = next ? `<p class="sp-card-kicker">NEXT CLASS · ${dayLabel(next.starts.getDay()).toUpperCase()}</p><h2 class="sp-next-heading">${escapeHtml(next.name)}</h2><p class="sp-next-meta">${timeLabel(next.start)} · ${escapeHtml(next.room)} · ${escapeHtml(next.teacher)}</p><div class="sp-next-bottom"><div><div class="sp-countdown" id="spCountdown">${countdown(next.starts)}</div><div class="sp-countdown-caption">until class starts</div></div><button class="sp-next-link" data-page="schedule">View schedule <span aria-hidden="true">→</span></button></div>` : '<p class="sp-card-kicker">NEXT CLASS</p><h2 class="sp-next-heading">No classes scheduled</h2><p class="sp-empty-next">Add a class to your schedule and we will keep an eye on the time for you.</p>';
    return `<div class="sp-dashboard"><div><section class="sp-next-card">${nextHtml}</section><div class="sp-metrics"><div class="sp-metric"><div class="sp-metric-label">Attendance</div><div class="sp-metric-value">${summary.rate}%</div><div class="sp-metric-foot">${summary.attended} classes attended</div></div><div class="sp-metric"><div class="sp-metric-label">Focus today</div><div class="sp-metric-value">${studyMinutesToday()}<span style="font-size:10px;font-weight:600"> min</span></div><div class="sp-metric-foot">A little progress counts</div></div><div class="sp-metric"><div class="sp-metric-label">Budget this month</div><div class="sp-metric-value" style="font-size:16px">${money(state.data.monthlyBudget - expenseTotal)}</div><div class="sp-metric-foot">left of ${money(state.data.monthlyBudget)}</div></div></div>
      <section class="sp-panel" style="margin-top:13px"><div class="sp-panel-head"><h2>Today's classes</h2><button data-page="schedule">Full schedule →</button></div><div class="sp-agenda">${agendaRows(todayClasses())}</div></section></div>
      <div class="sp-dash-right"><section class="sp-panel"><div class="sp-panel-head"><h2>Coming up</h2><button data-page="tasks">All tasks →</button></div><div class="sp-task-preview">${taskLines(state.data.tasks, true)}</div>${upcomingDue ? `<p style="margin:10px 0 0;color:var(--sp-muted);font-size:9px">Next due: ${shortDate(upcomingDue.due, { weekday: 'short', month: 'short', day: 'numeric' })}</p>` : ''}</section>
      <section class="sp-panel"><div class="sp-panel-head"><h2>Quick actions</h2></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px"><button class="sp-primary" data-open="attendance" style="justify-content:center;background:#e6f1e9;color:#285943">✓ Mark attendance</button><button class="sp-primary" data-new="task" style="justify-content:center;background:#f8eee6;color:#9b583e">＋ Add assignment</button></div></section></div></div>`;
  }
  function renderSchedule() {
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const classes = [...state.data.classes].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
    const rows = classes.length ? classes.map((item) => `<article class="sp-class-row" data-edit-class="${escapeHtml(item.id)}"><span class="sp-class-clock">${dayLabel(item.day).slice(0, 3)}<br>${timeLabel(item.start)}</span><span class="sp-class-color" style="--class-tone:${item.tone}"></span><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.teacher)} · ${timeLabel(item.start)}–${timeLabel(item.end)}</span></div><span class="sp-location">${escapeHtml(item.room)}</span></article>`).join('') : '<div class="sp-empty">No classes added yet. Add your first class to start building your timetable.</div>';
    const next = getNextClass();
    return `<div class="sp-page-heading"><div><h2>Weekly timetable</h2><p>Tap a class to edit it.</p></div><button class="sp-primary" data-new="class"><span>＋</span>Add class</button></div><div class="sp-schedule-layout"><section class="sp-class-list">${rows}</section><section class="sp-panel"><div class="sp-panel-head"><h2>Next class</h2></div>${next ? `<div class="sp-card-kicker" style="color:var(--sp-green)">${dayLabel(next.starts.getDay())}</div><h3 style="font-size:15px;margin:8px 0 5px">${escapeHtml(next.name)}</h3><p style="color:var(--sp-muted);font-size:9px;margin:0">${timeLabel(next.start)} · ${escapeHtml(next.room)}</p><div class="sp-progress" style="height:auto;background:#e6f1e9;margin-top:14px;padding:9px;color:var(--sp-green);font-family:'DM Mono',monospace;font-size:11px" id="spScheduleCountdown">${countdown(next.starts)} until class</div>` : '<p class="sp-empty">Add a class to see the countdown.</p>'}<div style="margin-top:16px"><div class="sp-panel-head"><h2>Today</h2><span class="sp-pill">${todayClasses().length} CLASSES</span></div><div class="sp-agenda">${agendaRows(todayClasses())}</div></div></section></div>`;
  }
  function renderAttendance() {
    const date = state.attendanceDate;
    const classes = todayClasses(date);
    const summary = attendanceSummary();
    const markedToday = classes.filter((item) => state.data.attendance[`${dateKey(date)}|${item.id}`]).length;
    const rows = classes.length ? classes.map((item) => {
      const key = `${dateKey(date)}|${item.id}`; const current = state.data.attendance[key] || '';
      return `<article class="sp-attendance-row"><div><strong>${escapeHtml(item.name)}</strong><span>${dayLabel(item.day)} · ${timeLabel(item.start)} · ${escapeHtml(item.room)}</span></div><div class="sp-attendance-actions">${[['present', 'P'], ['late', 'L'], ['absent', 'A']].map(([status, short]) => `<button class="sp-status ${current === status ? `active ${status}` : ''}" data-attendance="${escapeHtml(item.id)}" data-status="${status}" aria-label="Mark ${escapeHtml(item.name)} ${status}" aria-pressed="${current === status}">${short}</button>`).join('')}</div></article>`;
    }).join('') : '<div class="sp-empty">No classes on this day. Use the arrows to review another date, or add classes to your schedule.</div>';
    const perCourse = state.data.classes.map((item) => {
      const entries = Object.entries(state.data.attendance).filter(([key]) => key.endsWith(`|${item.id}`)).map(([, value]) => value);
      const attended = entries.filter((value) => value === 'present' || value === 'late').length;
      const rate = entries.length ? Math.round(attended / entries.length * 100) : 0;
      return { item, attended, total: entries.length, rate };
    }).sort((a, b) => a.rate - b.rate);
    return `<div class="sp-page-heading"><div><h2>Class check-in</h2><p>Mark each class as present, late, or absent.</p></div><button class="sp-primary" data-open="schedule">＋ Add class</button></div><div class="sp-attendance-stats"><div class="sp-metric"><div class="sp-metric-label">Overall attendance</div><div class="sp-metric-value">${summary.rate}%</div><div class="sp-metric-foot">${summary.attended} attended marks</div></div><div class="sp-metric"><div class="sp-metric-label">Marked today</div><div class="sp-metric-value">${markedToday}<span style="font-size:10px;font-weight:600"> / ${classes.length}</span></div><div class="sp-metric-foot">${classes.length - markedToday} still to check in</div></div></div><section class="sp-panel"><div class="sp-panel-head"><h2>Daily attendance</h2><div style="display:flex;align-items:center;gap:6px"><button class="sp-status" data-att-date="-1" aria-label="Previous day">‹</button><span class="sp-pill">${shortDate(dateKey(date), { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span><button class="sp-status" data-att-date="1" aria-label="Next day">›</button></div></div><div class="sp-attendance-list">${rows}</div></section><section class="sp-panel" style="margin-top:12px"><div class="sp-panel-head"><h2>By class</h2><span class="sp-pill">TERM VIEW</span></div>${perCourse.length ? perCourse.map(({ item, attended, total, rate }) => `<div class="sp-attendance-subject"><div class="sp-subject-top"><strong>${escapeHtml(item.name)}</strong><span class="sp-subject-rate">${total ? `${rate}%` : '—'}</span></div><div class="sp-progress"><span style="width:${rate}%;background:${rate < 75 && total ? 'var(--sp-coral)' : 'var(--sp-green)'}"></span></div><div class="sp-subject-foot"><span>${attended} attended / ${total} recorded</span><span>${rate < 75 && total ? 'Needs attention' : 'On track'}</span></div></div>`).join('') : '<div class="sp-empty">No classes to report yet.</div>'}</section>`;
  }
  function renderTasks() {
    const tasks = state.data.tasks.filter((item) => state.taskFilter === 'all' || (state.taskFilter === 'open' ? !item.done : item.done)).sort((a, b) => a.due.localeCompare(b.due));
    const cards = tasks.length ? tasks.map((item) => `<article class="sp-task-card ${item.done ? 'is-done' : ''}"><button class="sp-task-check ${item.done ? 'done' : ''}" data-task-toggle="${escapeHtml(item.id)}" aria-label="${item.done ? 'Reopen' : 'Complete'} ${escapeHtml(item.title)}">${item.done ? '✓' : ''}</button><div class="sp-task-main"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.kind)} · ${escapeHtml(courseName(item.courseId))} · ${escapeHtml(item.priority)} priority</span></div><span class="sp-deadline">${shortDate(item.due)}</span><button class="sp-close" data-delete-task="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.title)}">×</button></article>`).join('') : '<div class="sp-empty">No items in this view. Add a task or event to get started.</div>';
    return `<div class="sp-page-heading"><div><h2>Assignments & reminders</h2><p>Keep deadlines visible and manageable.</p></div><button class="sp-primary" data-new="task"><span>＋</span>Add item</button></div><div class="sp-task-controls">${[['all', 'All items'], ['open', 'To do'], ['done', 'Completed']].map(([id, label]) => `<button class="sp-filter ${state.taskFilter === id ? 'active' : ''}" data-task-filter="${id}" aria-pressed="${state.taskFilter === id}">${label}</button>`).join('')}</div><div class="sp-task-list">${cards}</div>`;
  }
  function renderStudy() {
    const mm = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0'); const ss = String(state.timerSeconds % 60).padStart(2, '0');
    const totalMinutes = studyMinutesToday();
    const subjects = state.data.classes.map((item) => ({ name: item.name, mins: state.data.studySessions.filter((session) => session.date === todayKey && session.courseId === item.id).reduce((total, session) => total + session.minutes, 0) })).filter((item) => item.mins).sort((a, b) => b.mins - a.mins);
    return `<div class="sp-page-heading"><div><h2>Focus session</h2><p>Set a timer and give one subject your attention.</p></div><span class="sp-pill">${totalMinutes} MIN TODAY</span></div><div class="sp-study-layout"><section class="sp-study-clock"><div><div class="sp-clock-ring"><div><div class="sp-clock-time" id="spTimer">${mm}:${ss}</div><div class="sp-clock-label" id="spTimerLabel">${state.timerRunning ? 'FOCUS IN PROGRESS' : '25 MIN FOCUS'}</div></div></div><div class="sp-clock-actions"><button class="sp-clock-button primary" id="spTimerToggle">${state.timerRunning ? 'Pause' : 'Start focus'}</button><button class="sp-clock-button" id="spTimerReset">Reset</button></div></div></section><section class="sp-panel"><div class="sp-panel-head"><h2>What are you studying?</h2></div><div class="sp-field"><label for="spStudySubject">Subject</label><select id="spStudySubject"><option value="">Choose a subject</option>${state.data.classes.map((item) => `<option value="${escapeHtml(item.id)}" ${state.timerSubject === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></div><div class="sp-panel-head" style="margin-top:20px"><h2>Today's focus</h2></div><div class="sp-subject-list">${subjects.length ? subjects.map((item) => `<div class="sp-study-subject"><div><strong>${escapeHtml(item.name)}</strong><span>Focused study</span></div><span class="sp-hours">${item.mins} min</span></div>`).join('') : '<div class="sp-empty">Your completed focus sessions will appear here.</div>'}</div></section></div>`;
  }
  function renderBudget() {
    const entries = monthExpenses().sort((a, b) => b.date.localeCompare(a.date));
    const spent = entries.reduce((sum, item) => sum + Number(item.amount), 0);
    const budget = Number(state.data.monthlyBudget) || 0;
    const remaining = budget - spent;
    const byCategory = moneyCategories.map((name) => ({ name, amount: entries.filter((item) => item.category === name).reduce((sum, item) => sum + Number(item.amount), 0) })).filter((item) => item.amount).sort((a, b) => b.amount - a.amount);
    const rows = entries.length ? entries.map((item) => `<article class="sp-expense"><span class="sp-expense-icon" aria-hidden="true">${item.category === 'Food' ? '☕' : item.category === 'Transport' ? '↗' : item.category === 'Supplies' ? '✎' : item.category === 'Personal' ? '◌' : '·'}</span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)} · ${shortDate(item.date)}</span></div><span class="sp-expense-amount">${money(item.amount)}</span><button class="sp-close" data-delete-expense="${escapeHtml(item.id)}" aria-label="Delete expense">×</button></article>`).join('') : '<div class="sp-empty">No expenses yet. Add a purchase to start tracking your monthly spending.</div>';
    return `<div class="sp-page-heading"><div><h2>Monthly money check</h2><p>Track everyday spending and stay within your limit.</p></div><button class="sp-primary" data-new="expense"><span>＋</span>Add expense</button></div><div class="sp-budget-top"><section class="sp-budget-total"><div class="sp-metric-label">Remaining this month</div><div class="sp-metric-value">${money(remaining)}</div><div class="sp-metric-foot">of ${money(budget)} monthly budget</div><div class="sp-progress" style="background:#ffffff35"><span style="width:${budget ? Math.min(100, spent / budget * 100) : 0}%;background:var(--sp-yellow)"></span></div></section><div class="sp-metric"><div class="sp-metric-label">Spent</div><div class="sp-metric-value" style="font-size:17px">${money(spent)}</div><div class="sp-metric-foot">${entries.length} purchases</div></div><button class="sp-metric" data-new="budget" style="text-align:left;cursor:pointer"><div class="sp-metric-label">Monthly limit</div><div class="sp-metric-value" style="font-size:17px">${money(budget)}</div><div class="sp-metric-foot" style="color:var(--sp-green)">Edit budget →</div></button></div><div class="sp-study-layout"><section class="sp-panel"><div class="sp-panel-head"><h2>Recent expenses</h2><span class="sp-pill">THIS MONTH</span></div><div class="sp-expense-list">${rows}</div></section><section class="sp-panel"><div class="sp-panel-head"><h2>By category</h2></div>${byCategory.length ? byCategory.map((item, index) => `<div class="sp-study-subject"><div><strong>${escapeHtml(item.name)}</strong><span>${Math.round(item.amount / Math.max(spent, 1) * 100)}% of spending</span></div><span class="sp-hours">${money(item.amount)}</span></div>`).join('') : '<div class="sp-empty">Category totals appear as you add expenses.</div>'}</section></div>`;
  }
  const pageRenderers = { home: renderHome, schedule: renderSchedule, attendance: renderAttendance, tasks: renderTasks, study: renderStudy, budget: renderBudget };
  function renderActivePage() {
    const page = app.querySelector(`[data-view="${state.page}"]`);
    if (page) page.innerHTML = pageRenderers[state.page]();
    if (page && attendanceSummary().rate === null && (state.page === 'home' || state.page === 'attendance')) {
      const metric = page.querySelector(state.page === 'home' ? '.sp-metrics .sp-metric' : '.sp-attendance-stats .sp-metric');
      metric.querySelector('.sp-metric-value').textContent = '—';
      metric.querySelector('.sp-metric-foot').textContent = state.page === 'home' ? 'Check in to start tracking' : 'No check-ins recorded yet';
    }
    if (page && state.page === 'attendance') {
      page.querySelectorAll('.sp-attendance-subject').forEach((row) => {
        const foot = row.querySelectorAll('.sp-subject-foot span');
        if (foot[0]?.textContent.endsWith('0 recorded')) foot[1].textContent = 'No records yet';
      });
    }
    app.querySelectorAll('.sp-nav-button').forEach((button) => { button.classList.toggle('active', button.dataset.page === state.page); button.setAttribute('aria-current', button.dataset.page === state.page ? 'page' : 'false'); });
    if (state.page === 'home' || state.page === 'schedule') updateCountdowns();
    if (state.page === 'study') updateTimerDisplay();
  }
  function navigate(page) { if (!pageRenderers[page]) return; state.page = page; renderShell(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function toast(message) {
    const node = document.getElementById('spToast');
    if (!node) return;
    node.textContent = message; node.classList.add('show'); clearTimeout(toast.timeout); toast.timeout = setTimeout(() => node.classList.remove('show'), 2200);
  }
  function bindShellEvents() {
    app.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.page)));
    app.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.open)));
    app.querySelectorAll('[data-new]').forEach((button) => button.addEventListener('click', () => openForm(button.dataset.new)));
    app.querySelectorAll('[data-task-toggle]').forEach((button) => button.addEventListener('click', () => toggleTask(button.dataset.taskToggle)));
    app.querySelectorAll('[data-attendance]').forEach((button) => button.addEventListener('click', () => markAttendance(button.dataset.attendance, button.dataset.status)));
    app.querySelectorAll('[data-att-date]').forEach((button) => button.addEventListener('click', () => { state.attendanceDate = shiftDate(state.attendanceDate, Number(button.dataset.attDate)); renderActivePage(); bindShellEvents(); }));
    app.querySelectorAll('[data-task-filter]').forEach((button) => button.addEventListener('click', () => { state.taskFilter = button.dataset.taskFilter; renderActivePage(); bindShellEvents(); }));
    app.querySelectorAll('[data-delete-task]').forEach((button) => button.addEventListener('click', () => deleteItem('tasks', button.dataset.deleteTask, 'Task deleted')));
    app.querySelectorAll('[data-delete-expense]').forEach((button) => button.addEventListener('click', () => deleteItem('expenses', button.dataset.deleteExpense, 'Expense deleted')));
    app.querySelectorAll('[data-edit-class]').forEach((button) => button.addEventListener('click', () => openForm('class', button.dataset.editClass)));
    const toggle = document.getElementById('spTimerToggle');
    if (toggle) toggle.addEventListener('click', toggleTimer);
    const reset = document.getElementById('spTimerReset');
    if (reset) reset.addEventListener('click', resetTimer);
    const subject = document.getElementById('spStudySubject');
    if (subject) subject.addEventListener('change', () => { state.timerSubject = subject.value; });
  }
  function toggleTask(id) {
    const item = state.data.tasks.find((task) => task.id === id);
    if (!item) return;
    item.done = !item.done; persist(); renderShell(); toast(item.done ? 'Marked complete' : 'Task reopened');
  }
  function markAttendance(classId, status) {
    const key = `${dateKey(state.attendanceDate)}|${classId}`;
    if (state.data.attendance[key] === status) delete state.data.attendance[key];
    else state.data.attendance[key] = status;
    persist(); renderShell(); toast(state.data.attendance[key] ? `Marked ${status}` : 'Attendance mark cleared');
  }
  function deleteItem(collection, id, message) { state.data[collection] = state.data[collection].filter((item) => item.id !== id); persist(); renderShell(); toast(message); }
  function openForm(type, id = '') {
    const dialog = document.getElementById('spDialog');
    const form = document.getElementById('spForm');
    const existing = type === 'class' && id ? state.data.classes.find((item) => item.id === id) : null;
    const title = type === 'class' ? (existing ? 'Edit class' : 'Add a class') : type === 'task' ? 'Add a task or event' : type === 'expense' ? 'Add an expense' : 'Set monthly budget';
    const footer = `<div class="sp-dialog-actions">${existing ? '<button type="button" class="sp-cancel" data-delete-class>Delete class</button>' : ''}<button type="button" class="sp-cancel" data-dialog-close>Cancel</button><button type="submit" class="sp-primary">Save</button></div>`;
    let fields = '';
    if (type === 'class') fields = `<div class="sp-field"><label>Class name</label><input name="name" maxlength="60" value="${escapeHtml(existing?.name || '')}" required></div><div class="sp-form-row"><div class="sp-field"><label>Day</label><select name="day">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((label, index) => `<option value="${index}" ${Number(existing?.day ?? today.getDay()) === index ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="sp-field"><label>Room</label><input name="room" maxlength="45" value="${escapeHtml(existing?.room || '')}" placeholder="Room / location"></div></div><div class="sp-form-row"><div class="sp-field"><label>Starts</label><input name="start" type="time" value="${existing?.start || '09:00'}" required></div><div class="sp-field"><label>Ends</label><input name="end" type="time" value="${existing?.end || '10:00'}" required></div></div><div class="sp-field"><label>Instructor</label><input name="teacher" maxlength="45" value="${escapeHtml(existing?.teacher || '')}" placeholder="Optional"></div>`;
    if (type === 'task') fields = `<div class="sp-field"><label>Title</label><input name="title" maxlength="80" placeholder="What needs doing?" required></div><div class="sp-form-row"><div class="sp-field"><label>Type</label><select name="kind"><option>Assignment</option><option>Event</option><option>Reminder</option></select></div><div class="sp-field"><label>Priority</label><select name="priority"><option>Normal</option><option>High</option><option>Low</option></select></div></div><div class="sp-field"><label>Course</label><select name="courseId"><option value="">Personal</option>${state.data.classes.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></div><div class="sp-field"><label>Due date</label><input name="due" type="date" value="${todayKey}" required></div>`;
    if (type === 'expense') fields = `<div class="sp-field"><label>What did you spend on?</label><input name="title" maxlength="60" placeholder="e.g. Lunch" required></div><div class="sp-form-row"><div class="sp-field"><label>Amount (PHP)</label><input name="amount" type="number" min="1" step="0.01" placeholder="0.00" required></div><div class="sp-field"><label>Category</label><select name="category">${moneyCategories.map((item) => `<option>${item}</option>`).join('')}</select></div></div><div class="sp-field"><label>Date</label><input name="date" type="date" value="${todayKey}" required></div>`;
    if (type === 'budget') fields = `<div class="sp-field"><label>Monthly budget (PHP)</label><input name="budget" type="number" min="0" step="100" value="${Number(state.data.monthlyBudget) || 12000}" required></div><p style="margin:0;color:var(--sp-muted);font-size:9px">Your monthly limit stays on this device and can be changed any time.</p>`;
    form.innerHTML = `<div class="sp-dialog-head"><h2>${title}</h2><button type="button" class="sp-close" data-dialog-close aria-label="Close">×</button></div>${fields}${footer}`;
    form.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    if (existing) form.querySelector('[data-delete-class]').addEventListener('click', () => { dialog.close(); deleteItem('classes', existing.id, 'Class deleted'); });
    form.onsubmit = (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      if (type === 'class') {
        if (values.end <= values.start) { form.elements.end.setCustomValidity('End time must be after start time.'); form.elements.end.reportValidity(); form.elements.end.setCustomValidity(''); return; }
        const item = { id: existing?.id || `course-${Date.now()}`, name: values.name.trim(), teacher: values.teacher.trim() || 'Instructor', room: values.room.trim() || 'TBA', day: Number(values.day), start: values.start, end: values.end, tone: existing?.tone || colors[state.data.classes.length % colors.length] };
        if (existing) state.data.classes = state.data.classes.map((course) => course.id === existing.id ? item : course); else state.data.classes.push(item);
      } else if (type === 'task') state.data.tasks.push({ id: `task-${Date.now()}`, title: values.title.trim(), kind: values.kind, priority: values.priority, courseId: values.courseId, due: values.due, done: false });
      else if (type === 'expense') state.data.expenses.push({ id: `expense-${Date.now()}`, title: values.title.trim(), amount: Number(values.amount), category: values.category, date: values.date });
      else if (type === 'budget') state.data.monthlyBudget = Number(values.budget);
      persist(); dialog.close(); renderShell(); toast(type === 'class' ? (existing ? 'Class updated' : 'Class added') : type === 'task' ? 'Added to your list' : type === 'expense' ? 'Expense added' : 'Budget updated');
    };
    dialog.showModal();
  }
  function updateCountdowns() {
    const next = getNextClass();
    const home = document.getElementById('spCountdown');
    const schedule = document.getElementById('spScheduleCountdown');
    if (next && home) home.textContent = countdown(next.starts);
    if (next && schedule) schedule.textContent = `${countdown(next.starts)} until class`;
  }
  function updateTimerDisplay() {
    const timer = document.getElementById('spTimer');
    const label = document.getElementById('spTimerLabel');
    const button = document.getElementById('spTimerToggle');
    if (!timer) return;
    timer.textContent = `${String(Math.floor(state.timerSeconds / 60)).padStart(2, '0')}:${String(state.timerSeconds % 60).padStart(2, '0')}`;
    label.textContent = state.timerRunning ? 'FOCUS IN PROGRESS' : '25 MIN FOCUS';
    if (button) button.textContent = state.timerRunning ? 'Pause' : 'Start focus';
  }
  function toggleTimer() {
    if (!state.timerRunning && state.timerSeconds === 25 * 60) {
      state.timerSubject = document.getElementById('spStudySubject')?.value || state.timerSubject;
      if (!state.timerSubject) { toast('Choose a subject first'); return; }
    }
    state.timerRunning = !state.timerRunning;
    clearInterval(state.timerInterval);
    if (state.timerRunning) state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) state.timerSeconds -= 1;
      updateTimerDisplay();
      if (state.timerSeconds === 0) finishFocus();
    }, 1000);
    updateTimerDisplay();
  }
  function finishFocus() {
    clearInterval(state.timerInterval); state.timerRunning = false;
    state.data.studySessions.push({ id: `study-${Date.now()}`, courseId: state.timerSubject, minutes: 25, date: todayKey });
    persist(); state.timerSeconds = 25 * 60; renderShell(); toast('Focus session complete. Nice work!');
  }
  function resetTimer() { clearInterval(state.timerInterval); state.timerRunning = false; state.timerSeconds = 25 * 60; updateTimerDisplay(); }

  function initialize() {
    renderShell();
    setInterval(updateCountdowns, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdowns(); });
  }
  initialize();
})();
