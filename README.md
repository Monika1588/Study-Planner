<h2>Study-Planner</h2>

This project implements a interactive study management system that helps users organize tasks, track study time, and visualize weekly progress. The entire application is built using HTML, CSS, and JavaScript, and stored locally using LocalStorage, ensuring data is saved even after the browser is closed.<br>


<h3>Project Overview</h3>
The objective of this project is to create a user-friendly study planning tool that allows students to manage their tasks and track productivity effectively. The system provides features like task management, real-time study timer, filtering, and weekly data visualization using Chart.js.<br>


The app works step-by-step like this:<br>
•	User can add study tasks with details like subject, date, estimated time, and priority.<br>
•	The tasks are saved automatically so they don’t disappear when you close the browser.<br>
•	Users can edit, complete, or delete tasks anytime.<br>
•	Tasks can be filtered and sorted by subject, date, priority, or time spent.<br>
•	Track actual study time per task with start, pause, and stop controls.<br>
•	Study sessions automatically log time to tasks and weekly data.<br>
•	A weekly chart shows hours studied each day,  which resets automatically every week.<br>
•	Users can set a daily goal and track progress with a visual progress bar.<br>
•	Analytics display completed tasks, average daily hours, and streaks.<br>
•	Notes, motivational quotes, theme toggle, and focus mode provide personalization and motivation.<br><br>





<h3>Technologies Used:</h3> 
•	HTML5 – for the structure of the app <br>
•	CSS3 – for styling and responsive design <br>
•	JavaScript (ES6) – for app logic, task management, timer, and filtering <br>
•	LocalStorage – for saving tasks, study time, and user progress <br>
•	Chart.js – to visualize weekly study time in a chart <br><br>


<h3>Code Explanation</h3> 
1. Task Creation & Management <br>
•	HTML Elements: `taskName`, `taskSubject`, `taskDate`, `taskEst`, `taskPriority`, `addTaskBtn` <br>
•	Logic: <br>
o	Clicking Add Task reads values from input fields. <br>
o	Each task is an object <br>
•	Task is pushed into tasks array and saved using `localStorage.setItem('ssp_tasks', JSON.stringify(tasks))`. <br>
•	`renderTasks()` updates the task list in the UI. <br>
•  Edit/Delete/Complete: <br>
•	`editTask(id)` prompts user for new values and updates the task. <br>
•	`deleteTask(id)` removes the task from the array. <br>
•	`toggleComplete(id)` marks a task as done or undoes it. <br>

2. Filtering & Sorting <br>
•	Filters:  `filterSubject`, `filterStatus` <br>
•	Sorting: sortBy <br>
•	Logic: <br>
o	renderTasks() first copies all tasks, then filters: <br>
•	`tasks.filter(...)` <br>
•	`tasks.sort(...)` <br>

3. Real-Time Study Timer <br>
•	HTML Elements: `timerTaskSelect`, `timerMinutes`, `timerDisplay`, `startBtn`, `pauseBtn`, `stopBtn` <br>
•	Logic: <br>
o	startBtn sets timerState.running = true and starts `setInterval` to update the display every 500ms. <br>
o	pauseBtn clears the interval but keeps `pausedAt` value. <br>
o	stopBtn: <br>
	Converts seconds → minutes → hours. <br>
	Updates weekly chart: `weekData[today] += hours`. <br>
	Updates selected task: `t.timeSpentMinutes += minutes`. <br>
	Marks task as completed if `timeSpent >= estMinutes`. <br>
	Sends a notification or alert. <br>


4. Weekly Study Tracking <br>
•	Chart.js setup: <br>
•	A bar chart is created using `Chart.js` to visualize study hours for each day of the week.<br>
  The labels represent the days, and the datasets contain the weekly study data.<br>
  The chart updates dynamically as study time is logged.Week Reset:<br>
o	`ensureWeekFresh()` checks if the stored weekStart matches the current Monday; resets data if not.<br>
o	`resetWeekBtn.onclick` allows manual reset.<br>
•	CSV Export: `exportCSVBtn.onclick` converts weekly data to CSV for download.<br><br>


6. Daily Goal Monitoring<br>
•	HTML Elements: `dailyGoalInput`, `setGoalBtn`,` goalProgress`, `goalText`<br>
•	Logic:<br>
o	`setGoalBtn.onclick` updates dailyGoal and saves it.<br>
o	`updateGoalUI()` calculates progress<br><br>

7. Study Analytics<br>
•	HTML Elements:` completedCountEl`,` avgDailyEl`,` streakEl`<br>
•	Logic:<br>
o	`updateStats()` calculates:<br>
o	`getStreak()` counts consecutive days with study time > 0, starting from today.<br><br>

8. Personalization<br>
•	Notes:
notesEl.addEventListener('input', saveAll) saves notes in real-time.
•	Quotes:
Rotating quotes using setInterval(() => {...}, 10000).
•	Theme Toggle:
themeToggle.onclick toggles document.body.classList.toggle("dark").
•	Focus Mode:
focusToggle.onclick toggles focus-mode class, hiding distractions.


8. Storage & Persistence<br>
•	All critical data is stored in `LocalStorage`:<br>
•	Ensures user data persists across sessions.<br><br>



<h3>Future Enhancements:</h3>
•	Integrate cloud storage (Firebase) for cross-device access.<br>
•	Add notifications and reminders for tasks.<br>
•	Include Pomodoro mode for focused study sessions.<br>
•	Allow task sharing or collaboration between students.<br>



