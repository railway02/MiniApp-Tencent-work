const STORAGE_KEY = "focusflow.tasks";
const API_URL = "https://jsonplaceholder.typicode.com/todos?_limit=4";

const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const notesInput = document.getElementById("notes");
const taskList = document.getElementById("taskList");
const clearAllButton = document.getElementById("clearAll");
const loadSampleButton = document.getElementById("loadSample");
const toggleCompletedCheckbox = document.getElementById("toggleCompleted");
const template = document.getElementById("taskTemplate");
const networkStatus = document.getElementById("networkStatus");

const stats = {
  total: document.getElementById("totalCount"),
  completed: document.getElementById("completedCount"),
  active: document.getElementById("activeCount"),
};

const createId = () => crypto.randomUUID();

const loadTasks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse tasks", error);
    return [];
  }
};

let tasks = loadTasks();

const persistTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const renderStats = () => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  stats.total.textContent = total;
  stats.completed.textContent = completed;
  stats.active.textContent = total - completed;
};

const renderTasks = () => {
  taskList.innerHTML = "";
  const shouldHideCompleted = toggleCompletedCheckbox.checked;
  const visibleTasks = shouldHideCompleted ? tasks.filter((task) => !task.completed) : tasks;

  if (!visibleTasks.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty";
    emptyState.textContent = shouldHideCompleted ? "暂无进行中的任务" : "暂时还没有任务，先添加一个吧";
    taskList.appendChild(emptyState);
    renderStats();
    return;
  }

  visibleTasks.forEach((task) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector("[data-title]").textContent = task.title;
    node.querySelector("[data-notes]").textContent = task.notes || "无备注";
    node.querySelector("[data-created]").textContent = `创建于 ${formatDate(task.createdAt)}`;

    const checkbox = node.querySelector("[data-complete]");
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      persistTasks();
      renderTasks();
    });

    const deleteButton = node.querySelector("[data-delete]");
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      persistTasks();
      renderTasks();
    });

    taskList.appendChild(node);
  });

  renderStats();
};

const addTask = (title, notes) => {
  const newTask = {
    id: createId(),
    title,
    notes,
    completed: false,
    createdAt: Date.now(),
  };
  tasks = [newTask, ...tasks];
  persistTasks();
  renderTasks();
};

const fetchSampleTasks = async () => {
  networkStatus.textContent = "正在请求云端样例...";
  loadSampleButton.disabled = true;
  loadSampleButton.textContent = "同步中...";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("network error");
    const data = await response.json();
    const imported = data.map((item) => ({
      id: createId(),
      title: item.title,
      notes: "来自云端示例任务",
      completed: item.completed,
      createdAt: Date.now(),
    }));
    tasks = [...imported, ...tasks];
    persistTasks();
    renderTasks();
    networkStatus.innerHTML = `<span class="badge">完成</span> 已同步 ${imported.length} 条样例数据`;
  } catch (error) {
    console.error("Failed to fetch samples", error);
    networkStatus.textContent = "网络请求失败，请稍后重试。";
  } finally {
    loadSampleButton.disabled = false;
    loadSampleButton.textContent = "同步云端样例";
  }
};

const clearAllTasks = () => {
  if (!tasks.length) return;
  const confirmed = confirm("确认清空本地任务吗？此操作不可撤销。");
  if (!confirmed) return;
  tasks = [];
  persistTasks();
  renderTasks();
};

const init = () => {
  renderTasks();

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const notes = notesInput.value.trim();
    if (!title) return;
    addTask(title, notes);
    taskForm.reset();
    titleInput.focus();
  });

  loadSampleButton.addEventListener("click", fetchSampleTasks);
  clearAllButton.addEventListener("click", clearAllTasks);
  toggleCompletedCheckbox.addEventListener("change", renderTasks);
};

init();
