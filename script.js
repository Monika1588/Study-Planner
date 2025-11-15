document.addEventListener('DOMContentLoaded', () => {

  // Element references
  const taskName = document.getElementById('taskName');
  const taskSubject = document.getElementById('taskSubject');
  const taskDate = document.getElementById('taskDate');
  const taskEst = document.getElementById('taskEst');
  const taskPriority = document.getElementById('taskPriority');
  const addTaskBtn = document.getElementById('addTask');
  const taskList = document.getElementById('taskList');

  const filterSubject = document.getElementById('filterSubject');
  const filterStatus = document.getElementById('filterStatus');
  const sortBy = document.getElementById('sortBy');

  const notesEl = document.getElementById('notes');
  const quoteEl = document.getElementById('quote');

  const dailyGoalInput = document.getElementById('dailyGoalInput');
  const setGoalBtn = document.getElementById('setGoal');
  const goalProgress = document.getElementById('goalProgress');
  const goalText = document.getElementById('goalText');

  const timerTaskSelect = document.getElementById('timerTaskSelect');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerDisplay = document.getElementById('timerDisplay');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');

  const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
  const resetWeekBtn = document.getElementById('resetWeek');
  const exportCSVBtn = document.getElementById('exportCSV');

  const completedCountEl = document.getElementById('completedCount');
  const avgDailyEl = document.getElementById('avgDaily');
  const streakEl = document.getElementById('streak');

  const themeToggle = document.getElementById('themeToggle');
  const focusToggle = document.getElementById('focusToggle');

  // Data stored in LocalStorage
  let tasks = JSON.parse(localStorage.getItem('ssp_tasks')) || [];

  // Each task: {id, name, subject, date, estMinutes, priority, completed, timeSpentMinutes}
  let weekData = JSON.parse(localStorage.getItem('ssp_weekData')) || [0,0,0,0,0,0,0];
  let weekStart = localStorage.getItem('ssp_weekStart') || getMondayISO();

  let dailyGoal = parseFloat(localStorage.getItem('ssp_dailyGoal')) || 2;

  // Load notes
  notesEl.value = localStorage.getItem('ssp_notes') || '';

  // Random quote list
  const quotes = [
    "Just begin.",
    "Small steps every day lead to big results.",
    "Consistency beats intensity.",
    "Discipline improves when you practise it gently.",
    "Even small progress counts. Keep going."
  ];

  // Timer state
  let timerState = {
    running: false,
    startTS: null,
    pausedAt: 0,
    intervalId: null
  };

  // Weekly Chart
  let weeklyChart = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      datasets: [{
        label: 'Hours studied',
        data: weekData,
        backgroundColor: '#4caf50'
      }]
    },
    options: {
      plugins: { legend: { display: false }},
      scales: { y: { beginAtZero: true }}
    }
  });

  // Helper functions
  function saveAll() {
    localStorage.setItem('ssp_tasks', JSON.stringify(tasks));
    localStorage.setItem('ssp_weekData', JSON.stringify(weekData));
    localStorage.setItem('ssp_weekStart', weekStart);
    localStorage.setItem('ssp_dailyGoal', dailyGoal);
    localStorage.setItem('ssp_notes', notesEl.value);
    localStorage.setItem('ssp_theme',
      document.body.classList.contains('dark') ? 'dark' : 'light'
    );
  }

  function getTodayIndex() {
    return new Date().getDay();
  }

  // Get Monday’s date for weekly tracking
  function getMondayISO() {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0,10);
  }

  // If week changed, reset data
  function ensureWeekFresh() {
    const curMonday = getMondayISO();
    if (weekStart !== curMonday) {
      weekStart = curMonday;
      weekData = [0,0,0,0,0,0,0];
      saveAll();
    }
  }

  // Render Task List
  function renderTasks() {
    let filtered = tasks.slice();

    // Apply subject filter
    if (filterSubject.value !== 'all')
      filtered = filtered.filter(t => t.subject === filterSubject.value);

    // Apply status filter
    if (filterStatus.value === 'pending')
      filtered = filtered.filter(t => !t.completed);
    if (filterStatus.value === 'completed')
      filtered = filtered.filter(t => t.completed);

    // Sorting options
    if (sortBy.value === 'date')
      filtered.sort((a,b) => (a.date || '').localeCompare(b.date || ''));
    if (sortBy.value === 'priority')
      filtered.sort((a,b) => priorityValue(b.priority) - priorityValue(a.priority));
    if (sortBy.value === 'timeSpent')
      filtered.sort((a,b) => (b.timeSpentMinutes||0) - (a.timeSpentMinutes||0));

    // Render tasks
    taskList.innerHTML = '';
    filtered.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task-item';

      const left = document.createElement('div');
      left.className = 'task-left';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(t.name)}</strong>`;

      const meta = document.createElement('div');
      meta.className = 'task-meta';
      meta.textContent =
        `${t.subject} • ${t.date || "no date"} • est ${t.estMinutes}m • ` +
        `${t.priority} • spent ${t.timeSpentMinutes || 0}m`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'task-controls';

      const selectBtn = document.createElement('button');
      selectBtn.textContent = "Select";
      selectBtn.onclick = () => selectTaskForTimer(t.id);

      const completedBtn = document.createElement('button');
      completedBtn.textContent = t.completed ? "Undo" : "Done";
      completedBtn.onclick = () => toggleComplete(t.id);

      const editBtn = document.createElement('button');
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editTask(t.id);

      const delBtn = document.createElement('button');
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm("Delete this task?")) deleteTask(t.id);
      };

      right.appendChild(selectBtn);
      right.appendChild(completedBtn);
      right.appendChild(editBtn);
      right.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(right);
      taskList.appendChild(li);
    });

    populateFilters();
    populateTimerTaskSelect();
    updateStats();
  }

  function populateFilters() {
    const subjects = ['all', ...new Set(tasks.map(t => t.subject))];

    filterSubject.innerHTML = '';
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      filterSubject.appendChild(opt);
    });
  }

  function populateTimerTaskSelect() {
    timerTaskSelect.innerHTML = '<option value="__none">(No task)</option>';
    tasks.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.subject} — ${t.name}`;
      timerTaskSelect.appendChild(opt);
    });
  }

  function updateChart() {
    weeklyChart.data.datasets[0].data = weekData;
    weeklyChart.update();
  }

  function updateGoalUI() {
    const todayHours = weekData[getTodayIndex()] || 0;
    const percent = Math.min((todayHours / dailyGoal) * 100, 100);

    goalProgress.value = percent;
    goalText.textContent = `${todayHours} / ${dailyGoal} hrs today`;
  }

  function updateStats() {
    const completed = tasks.filter(t => t.completed && isInThisWeek(t)).length;
    completedCountEl.textContent = completed;

    const avg = (weekData.reduce((a,b)=>a+b,0) / 7).toFixed(2);
    avgDailyEl.textContent = avg;

    streakEl.textContent = getStreak();
  }

  function priorityValue(p) {
    if (p === 'High') return 3;
    if (p === 'Normal') return 2;
    return 1;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  function isInThisWeek(task) {
    if (!task.date) return true;

    const monday = new Date(weekStart);
    const tDate = new Date(task.date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return tDate >= monday && tDate <= sunday;
  }

  function getStreak() {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const idx = (getTodayIndex() - i + 7) % 7;
      if (weekData[idx] > 0) count++; else break;
    }
    return count;
  }

  // Task CRUD
  addTaskBtn.onclick = () => {
    const name = taskName.value.trim();
    if (!name) return alert("Please enter a task name.");

    const subject = taskSubject.value.trim() || "General";
    const date = taskDate.value || new Date().toISOString().slice(0,10);
    const est = parseInt(taskEst.value) || 0;
    const priority = taskPriority.value || "Normal";

    const t = {
      id: String(Date.now()),
      name,
      subject,
      date,
      estMinutes: est,
      priority,
      completed: false,
      timeSpentMinutes: 0
    };

    tasks.push(t);
    saveAll();
    renderTasks();

    taskName.value = '';
    taskSubject.value = '';
    taskDate.value = '';
    taskEst.value = '';
    taskPriority.value = 'Normal';
  };

  function toggleComplete(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    saveAll();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAll();
    renderTasks();
  }

  function editTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    const newName = prompt("Task name", t.name);
    if (!newName) return;

    const newSub = prompt("Subject", t.subject) || t.subject;
    const newDate = prompt("Date (YYYY-MM-DD)", t.date) || t.date;
    const newEst = parseInt(prompt("Estimated minutes", t.estMinutes) || t.estMinutes);
    const newPri = prompt("Priority (High, Normal, Low)", t.priority) || t.priority;

    t.name = newName;
    t.subject = newSub;
    t.date = newDate;
    t.estMinutes = newEst;
    t.priority = newPri;

    saveAll();
    renderTasks();
  }

  function selectTaskForTimer(id) {
    timerTaskSelect.value = id;
  }

  // Timer Functions
  // Convert seconds to HH:MM:SS
  function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  startBtn.onclick = () => {
    if (timerState.running) return;

    timerState.running = true;
    timerState.startTS = Date.now() - (timerState.pausedAt * 1000);

    timerState.intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerState.startTS) / 1000);
      timerState.pausedAt = elapsed;
      timerDisplay.textContent = formatTime(elapsed);
    }, 500);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  pauseBtn.onclick = () => {
    if (!timerState.running) return;

    clearInterval(timerState.intervalId);
    timerState.running = false;
  };

  stopBtn.onclick = () => {
    if (timerState.intervalId) clearInterval(timerState.intervalId);

    timerState.running = false;

    const seconds = timerState.pausedAt;
    const minutes = Math.floor(seconds / 60);

    if (minutes <= 0) {
      timerState.pausedAt = 0;
      timerDisplay.textContent = formatTime(0);
      return alert("Session was too short to log.");
    }

    const selectedTask = timerTaskSelect.value;
    const today = getTodayIndex();

    // Convert minutes → hours and update weekly data
    const hours = +(minutes / 60).toFixed(2);
    weekData[today] = +(weekData[today] + hours).toFixed(2);

    // Add time to task
    if (selectedTask !== "__none") {
      const t = tasks.find(x => x.id === selectedTask);
      if (t) {
        t.timeSpentMinutes = (t.timeSpentMinutes || 0) + minutes;
        if (!t.completed && t.timeSpentMinutes >= t.estMinutes)
          t.completed = true;
      }
    }

    const msg = `You studied ${minutes} minutes (${hours} hrs). Logged successfully.`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Study session complete!", { body: msg });
    } else {
      alert(msg);
    }

    // Reset timer
    timerState.pausedAt = 0;
    timerDisplay.textContent = formatTime(0);

    saveAll();
    updateChart();
    updateGoalUI();
    renderTasks();
  };

  // Weekly Reset + CSV Export
  resetWeekBtn.onclick = () => {
    if (!confirm("Reset this week's data?")) return;

    weekData = [0,0,0,0,0,0,0];
    weekStart = getMondayISO();
    saveAll();
    updateChart();
    updateGoalUI();
  };

  exportCSVBtn.onclick = () => {
    let csv = "Day,Hours\n";
    const labels = weeklyChart.data.labels;

    labels.forEach((lbl, i) => {
      csv += `${lbl},${weekData[i]}\n`;
    });

    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "study-week.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Daily Goal
  setGoalBtn.onclick = () => {
    const v = parseFloat(dailyGoalInput.value);
    if (!v || v <= 0) return alert("Please enter a valid daily goal (hours).");

    dailyGoal = v;
    saveAll();
    updateGoalUI();

    alert(`Daily goal updated to ${dailyGoal} hrs.`);
  };

  // Notes, Quotes, Theme, Focus Mode
  notesEl.addEventListener('input', saveAll);

  setInterval(() => {
    quoteEl.textContent = `“${quotes[Math.floor(Math.random()*quotes.length)]}”`;
  }, 10000);

  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    saveAll();
  };

  focusToggle.onclick = () => {
    const active = !document.body.classList.contains("focus-mode");
    document.body.classList.toggle("focus-mode", active);
    focusToggle.textContent = active ? "🔕 Focus" : "🔔 Normal";

    if (active)
      alert("Focus mode enabled. Distractions hidden.");
  };

  // Initial setup
  ensureWeekFresh();
  saveAll();
  updateChart();
  updateGoalUI();
  renderTasks();

  // Filters
  filterSubject.onchange = renderTasks;
  filterStatus.onchange = renderTasks;
  sortBy.onchange = renderTasks;

});
