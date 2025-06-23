const form = document.getElementById("routineForm");
const list = document.getElementById("routineList");
let routines = JSON.parse(localStorage.getItem("routines")) || [];
let editIndex = -1;
let firstTaskNotified = false;

window.onload = () => {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission !== "granted") {
          alert("Please allow notifications to receive routine reminders.");
        }
      });
    } else if (Notification.permission === "denied") {
      alert("Notifications are blocked. Please enable them in browser settings.");
    }
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const task = document.getElementById("task").value;

  if (editIndex === -1) {
    routines.push({ start, end, task });
  } else {
    routines[editIndex] = { start, end, task };
    editIndex = -1;
  }

  routines.sort((a, b) => a.start.localeCompare(b.start));
  localStorage.setItem("routines", JSON.stringify(routines));
  displayRoutines();
  form.reset();
});

function formatAMPM(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = hour % 12 || 12;
  return `${hr}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function displayRoutines() {
  list.innerHTML = "";
  routines.forEach((r, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${formatAMPM(r.start)} - ${formatAMPM(r.end)}: ${r.task}
      <button class="action-btn edit-btn" onclick="editRoutine(${index})">Edit</button>
      <button class="action-btn delete-btn" onclick="deleteRoutine(${index})">Delete</button>
    `;
    list.appendChild(li);
  });
}

function editRoutine(index) {
  const r = routines[index];
  document.getElementById("startTime").value = r.start;
  document.getElementById("endTime").value = r.end;
  document.getElementById("task").value = r.task;
  editIndex = index;
}

function deleteRoutine(index) {
  if (confirm("Delete this routine?")) {
    routines.splice(index, 1);
    localStorage.setItem("routines", JSON.stringify(routines));
    displayRoutines();
  }
}

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function checkRoutineAlerts() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  routines.forEach((r, i) => {
    const [startH, startM] = r.start.split(":").map(Number);
    const [endH, endM] = r.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const nextTask = routines[i + 1];

    
    if (!firstTaskNotified && currentMinutes === startMinutes && i === 0) {
      sendNotification("📝 Daily Routine Started", `Your daily routine starts now with ${r.task}`);
      firstTaskNotified = true;
    }

    
    if (currentMinutes === endMinutes - 5) {
      sendNotification("⏳ 5 Minutes Left", `Only 5 minutes remaining to complete ${r.task}`);
    }

   
    if (currentMinutes === endMinutes) {
      sendNotification("⏰ Task Completed", `Time is over for ${r.task}`);
      if (nextTask) {
        sendNotification("✅ Next Task", `It is time for ${nextTask.task}`);
      } else {
        sendNotification("🎉 Done", "Your today's routine is finished.");
      }
    }
  });
}

displayRoutines();
setInterval(checkRoutineAlerts, 60000); 
