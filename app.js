const STORAGE_KEY = "roastmaster.history";
const ROAST_LIBRARY = [
  "Is that all you got?",
  "Your procrastination is an art form.",
  "Even your excuses are tired.",
  "Goals fear you’ll never meet them.",
  "You call that effort? Try again.",
  "Motivation is filing a missing persons report.",
  "Your comfort zone has overstay fees.",
  "Ambition left the chat.",
  "Hustle? More like gentle stroll.",
  "Dreams need actions, not naps.",
];

const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const notesInput = document.getElementById("notes");
const taskList = document.getElementById("taskList");
const clearAllButton = document.getElementById("clearAll");
const loadSampleButton = document.getElementById("loadSample");
const toggleCompletedCheckbox = document.getElementById("toggleCompleted");
const template = document.getElementById("taskTemplate");
const networkStatus = document.getElementById("networkStatus");
const roastButton = document.getElementById("roastButton");

const stats = {
  total: document.getElementById("totalCount"),
  completed: document.getElementById("completedCount"),
  active: document.getElementById("activeCount"),
};

const createId = () => crypto.randomUUID();

const pickRandomRoast = () =>
  ROAST_LIBRARY[Math.floor(Math.random() * ROAST_LIBRARY.length)];

const loadRoasts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse roasts", error);
    return [];
  }
};

let roasts = loadRoasts();

const persistRoasts = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roasts));
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const renderStats = () => {
  const total = roasts.length;
  const completed = roasts.filter((item) => item.acknowledged).length;
  stats.total.textContent = total;
  stats.completed.textContent = completed;
  stats.active.textContent = total - completed;
};

const renderRoasts = () => {
  taskList.innerHTML = "";
  const shouldHideCompleted = toggleCompletedCheckbox.checked;
  const visibleRoasts = shouldHideCompleted ? roasts.filter((item) => !item.acknowledged) : roasts;

  if (!visibleRoasts.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty";
    emptyState.textContent = shouldHideCompleted ? "暂无待领悟的毒舌" : "暂时还没有毒舌历史，先来一句吧";
    taskList.appendChild(emptyState);
    renderStats();
    return;
  }

  visibleRoasts.forEach((item) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector("[data-title]").textContent = item.roast;
    node.querySelector("[data-notes]").textContent = item.complaint
      ? `你的抱怨：${item.complaint}${item.notes ? ` ｜ 细节：${item.notes}` : ""}`
      : "无抱怨，AI 自带毒舌";
    node.querySelector("[data-created]").textContent = `生成于 ${formatDate(item.createdAt)}`;

    const checkbox = node.querySelector("[data-complete]");
    checkbox.checked = item.acknowledged;
    checkbox.addEventListener("change", () => {
      item.acknowledged = checkbox.checked;
      persistRoasts();
      renderRoasts();
    });

    const deleteButton = node.querySelector("[data-delete]");
    deleteButton.addEventListener("click", () => {
      roasts = roasts.filter((entry) => entry.id !== item.id);
      persistRoasts();
      renderRoasts();
    });

    taskList.appendChild(node);
  });

  renderStats();
};

const addRoast = (complaint, notes) => {
  const roastLine = `${pickRandomRoast()}${complaint ? ` ｜ 你的抱怨：“${complaint}”` : ""}`;
  const newEntry = {
    id: createId(),
    roast: roastLine,
    complaint,
    notes,
    acknowledged: false,
    createdAt: Date.now(),
  };
  roasts = [newEntry, ...roasts];
  persistRoasts();
  renderRoasts();
};

const setInteractionState = (isLoading) => {
  roastButton.disabled = isLoading;
  loadSampleButton.disabled = isLoading;
  clearAllButton.disabled = isLoading;
  roastButton.textContent = isLoading ? "Roasting..." : "Roast Me! (求骂醒)";
};

const simulateRoastRequest = async (complaint, notes) => {
  networkStatus.textContent = "AI 正在酝酿毒舌，稍等片刻...";
  setInteractionState(true);

  try {
    await fetch("https://jsonplaceholder.typicode.com/todos/1");
    networkStatus.textContent = "网络畅通，AI 正在思考如何毒舌...";
  } catch (error) {
    console.warn("Network flaky, proceeding with roast", error);
    networkStatus.textContent = "网络有点不稳，但毒舌照常进行...";
  }

  setTimeout(() => {
    addRoast(complaint, notes);
    networkStatus.innerHTML = '<span class="badge">完成</span> 最新毒舌已加入历史';
    setInteractionState(false);
    taskForm.reset();
    titleInput.focus();
  }, 1000);
};

const loadSampleRoasts = () => {
  const samples = [
    {
      complaint: "周末又想躺平",
      notes: "还没写完的论文",
    },
    { complaint: "健身卡吃灰", notes: "办卡三个月一次没去" },
    { complaint: "想转行但害怕失败", notes: "每天只看教程不动手" },
    { complaint: "刷短视频停不下来", notes: "原本想学英语" },
  ];

  networkStatus.textContent = "正在加载毒舌样例...";
  loadSampleButton.disabled = true;
  loadSampleButton.textContent = "加载中...";

  setTimeout(() => {
    const imported = samples.map((item) => ({
      id: createId(),
      roast: pickRandomRoast(),
      complaint: item.complaint,
      notes: item.notes,
      acknowledged: false,
      createdAt: Date.now(),
    }));

    roasts = [...imported, ...roasts];
    persistRoasts();
    renderRoasts();
    networkStatus.innerHTML = `<span class="badge">完成</span> 已加载 ${imported.length} 条毒舌样例`;
    loadSampleButton.disabled = false;
    loadSampleButton.textContent = "加载毒舌样例";
  }, 800);
};

const clearAllRoasts = () => {
  if (!roasts.length) return;
  const confirmed = confirm("确认清空毒舌历史吗？此操作不可撤销。");
  if (!confirmed) return;
  roasts = [];
  persistRoasts();
  renderRoasts();
};

const init = () => {
  renderRoasts();

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const complaint = titleInput.value.trim();
    const notes = notesInput.value.trim();
    if (!complaint) {
      networkStatus.textContent = "请先输入你的槽点，再让 AI 开炮。";
      titleInput.focus();
      return;
    }
    simulateRoastRequest(complaint, notes);
  });

  loadSampleButton.addEventListener("click", loadSampleRoasts);
  clearAllButton.addEventListener("click", clearAllRoasts);
  toggleCompletedCheckbox.addEventListener("change", renderRoasts);
};

init();
