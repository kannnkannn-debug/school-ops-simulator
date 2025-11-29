// ---------- Data models ----------

const buildings = [
  { id: "B1", name: "อาคารเรียน ป.1–3", type: "ห้องเรียน" },
  { id: "B2", name: "อาคารเรียน ป.4–6", type: "ห้องเรียน" },
  { id: "B3", name: "อาคารสำนักงาน", type: "งานบริหาร" },
  { id: "B4", name: "ห้องสมุดมาบอำมฤต", type: "แหล่งเรียนรู้" },
  { id: "B5", name: "โรงอาหาร", type: "โภชนาการ" },
  { id: "B6", name: "หอประชุม / โรงยิม", type: "กิจกรรมพิเศษ" },
  { id: "B7", name: "ห้องคอมพิวเตอร์", type: "เทคโนโลยี" },
  { id: "B8", name: "พื้นที่สนามกีฬา", type: "สนาม / ภายนอกอาคาร" }
];

const incidentDescriptions = [
  "หลอดไฟเสีย / แสงสว่างไม่เพียงพอ",
  "พื้นกระเบื้องแตก เสี่ยงนักเรียนล้ม",
  "ประตูห้องเรียนปิดไม่สนิท / บานพับหลวม",
  "ปลั๊กไฟชำรุด เสี่ยงไฟฟ้าลัดวงจร",
  "น้ำไม่ไหลในห้องน้ำ",
  "หลังคารั่วเมื่อฝนตกหนัก",
  "โต๊ะนักเรียนหัก ต้องเปลี่ยนใหม่",
  "ป้ายทางหนีไฟไม่ทำงาน",
  "ท่อระบายน้ำอุดตัน น้ำขังบริเวณทางเดิน",
  "ฝุ่น / เชื้อราบริเวณฝ้าเพดาน",
  "ตะแกรงท่อน้ำแตก น้ำรั่ว",
  "ระบบเสียงประกาศใช้การไม่ได้",
  "ประตูหนีไฟปิดไม่สนิท",
  "หน้าต่างกระจกแตกจากลมพายุ",
  "ไฟส่องสว่างสนามเสียบางจุด"
];

// severity → base
const severityConfig = {
  Low: {
    label: "ต่ำ",
    baseCost: [300, 800],
    baseHours: [1, 2],
    riskPerHour: 0.25,
    overdueHours: 24
  },
  Medium: {
    label: "ปานกลาง",
    baseCost: [800, 2500],
    baseHours: [2, 4],
    riskPerHour: 0.6,
    overdueHours: 16
  },
  High: {
    label: "สูง",
    baseCost: [2500, 8000],
    baseHours: [3, 6],
    riskPerHour: 1.2,
    overdueHours: 8
  },
  Critical: {
    label: "วิกฤต",
    baseCost: [8000, 18000],
    baseHours: [2, 5],
    riskPerHour: 2.5,
    overdueHours: 4
  }
};

// ---------- Game state ----------

let incidents = [];
let nextIncidentId = 1;

const gameState = {
  day: 1,
  hour: 8,
  budget: 100000,
  score: 0,
  totalRisk: 0
};

// ---------- Helper functions ----------

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseRandom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function formatCurrency(value) {
  return "฿ " + value.toLocaleString("th-TH");
}

function formatSimTime(day, hour) {
  const hourStr = hour.toString().padStart(2, "0");
  return `วัน ${day} – ${hourStr}:00 น.`;
}

// ---------- Incident generation ----------

function createRandomIncident() {
  const building = chooseRandom(buildings);

  const roll = Math.random();
  let sevKey;
  if (roll < 0.45) sevKey = "Medium";
  else if (roll < 0.7) sevKey = "Low";
  else if (roll < 0.9) sevKey = "High";
  else sevKey = "Critical";

  const config = severityConfig[sevKey];
  const [minCost, maxCost] = config.baseCost;
  const [minHours, maxHours] = config.baseHours;

  const incident = {
    id: nextIncidentId++,
    buildingId: building.id,
    buildingName: building.name,
    description: chooseRandom(incidentDescriptions),
    severity: sevKey,
    status: "Open",
    cost: randInt(minCost, maxCost),
    hoursRequired: randInt(minHours, maxHours),
    hoursSpent: 0,
    hoursOpen: 0,
    createdDay: gameState.day,
    createdHour: gameState.hour,
    overdue: false
  };

  incidents.push(incident);
  logEvent(`มีงานแจ้งซ่อมใหม่ที่ ${incident.buildingName}: ${incident.description} (ระดับ ${severityConfig[sevKey].label})`);
  renderAll();
}

// ---------- Rendering ----------

function renderAll() {
  renderSimStats();
  renderBuildings();
  renderIncidentList();
  renderManualBuildingOptions();
  updateDerivedStats();
}

function renderSimStats() {
  const timeLabel = document.getElementById("simTimeLabel");
  const budgetLabel = document.getElementById("budgetLabel");
  const scoreLabel = document.getElementById("scoreLabel");
  const riskLabel = document.getElementById("riskLabel");

  timeLabel.textContent = formatSimTime(gameState.day, gameState.hour);
  budgetLabel.textContent = formatCurrency(gameState.budget);
  scoreLabel.textContent = gameState.score;
  riskLabel.textContent = gameState.totalRisk.toFixed(1);
}

function renderBuildings() {
  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";

  buildings.forEach((b) => {
    const card = document.createElement("div");
    card.className = "building-card";
    card.dataset.buildingId = b.id;

    const openCount = incidents.filter(
      (inc) => inc.buildingId === b.id && inc.status !== "Resolved"
    ).length;

    const name = document.createElement("div");
    name.className = "building-name";
    name.textContent = b.name;

    const type = document.createElement("div");
    type.className = "building-type";
    type.textContent = b.type;

    card.appendChild(name);
    card.appendChild(type);

    if (openCount > 0) {
      const badge = document.createElement("div");
      badge.className = "building-incident-count";
      badge.textContent = `${openCount} งาน`;
      card.appendChild(badge);
    }

    card.addEventListener("click", () => {
      const filterSelect = document.getElementById("filterStatus");
      filterSelect.value = "all";
      renderIncidentList(b.id);
    });

    grid.appendChild(card);
  });
}

function renderIncidentList(focusedBuildingId = null) {
  const container = document.getElementById("incidentList");
  container.innerHTML = "";

  const filterStatus = document.getElementById("filterStatus").value;
  const filterSeverity = document.getElementById("filterSeverity").value;

  let list = incidents.slice();

  if (focusedBuildingId) {
    list = list.filter((inc) => inc.buildingId === focusedBuildingId);
  }

  if (filterStatus !== "all") {
    list = list.filter((inc) => inc.status === filterStatus);
  }
  if (filterSeverity !== "all") {
    list = list.filter((inc) => inc.severity === filterSeverity);
  }

  const sevOrder = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  list.sort((a, b) => {
    if (a.status === "Resolved" && b.status !== "Resolved") return 1;
    if (a.status !== "Resolved" && b.status === "Resolved") return -1;
    if (sevOrder[b.severity] !== sevOrder[a.severity]) {
      return sevOrder[b.severity] - sevOrder[a.severity];
    }
    if (a.createdDay === b.createdDay) {
      return b.createdHour - a.createdHour;
    }
    return b.createdDay - a.createdDay;
  });

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "panel-subtitle";
    empty.textContent = "ยังไม่มีงานแจ้งซ่อมตามเงื่อนไขที่เลือก";
    container.appendChild(empty);
    return;
  }

  list.forEach((inc) => {
    const card = document.createElement("div");
    card.className = "incident-card";

    const main = document.createElement("div");
    main.className = "incident-main";

    const title = document.createElement("div");
    title.className = "incident-title";
    title.textContent = `${inc.description}`;

    const meta = document.createElement("div");
    meta.className = "incident-meta";
    meta.innerHTML = `
      <span>${inc.buildingName}</span>
      <span>• ใช้เวลา: ${inc.hoursRequired} ชม.</span>
      <span>• ค่าใช้จ่าย: ${formatCurrency(inc.cost)}</span>
      <span>• เปิดมาแล้ว: ${inc.hoursOpen} ชม.</span>
    `;

    const footer = document.createElement("div");
    footer.className = "incident-footer";

    const tagContainer = document.createElement("div");

    const sevTag = document.createElement("span");
    sevTag.className = "tag " + severityTagClass(inc.severity);
    sevTag.innerHTML = `
      <span class="tag-dot"></span>
      <span>${severityConfig[inc.severity].label}</span>
    `;

    const statusTag = document.createElement("span");
    statusTag.className = "tag " + statusTagClass(inc.status);
    statusTag.textContent =
      inc.status === "Open"
        ? "เปิดใหม่"
        : inc.status === "In Progress"
        ? "กำลังดำเนินการ"
        : "เสร็จสิ้น";

    tagContainer.appendChild(sevTag);
    tagContainer.appendChild(statusTag);

    if (inc.overdue && inc.status !== "Resolved") {
      const overdueTag = document.createElement("span");
      overdueTag.className = "tag";
      overdueTag.style.borderColor = "rgba(239,68,68,0.9)";
      overdueTag.style.color = "#fecaca";
      overdueTag.textContent = "เกินเวลาที่ควรแก้ไข";
      tagContainer.appendChild(overdueTag);
    }

    const actionContainer = document.createElement("div");

    if (inc.status !== "Resolved") {
      const btnStart = document.createElement("button");
      btnStart.className = "btn btn-secondary";
      btnStart.textContent =
        inc.status === "Open" ? "เริ่มดำเนินการ" : "เร่งให้เสร็จ";

      btnStart.addEventListener("click", () => {
        handleAssignAndFix(inc.id);
      });

      actionContainer.appendChild(btnStart);
    } else {
      const doneLabel = document.createElement("span");
      doneLabel.style.fontSize = "0.75rem";
      doneLabel.style.color = "#4ade80";
      doneLabel.textContent = "ดำเนินการเสร็จแล้ว";
      actionContainer.appendChild(doneLabel);
    }

    main.appendChild(title);
    main.appendChild(meta);
    main.appendChild(footer);

    footer.appendChild(tagContainer);
    footer.appendChild(actionContainer);

    card.appendChild(main);

    container.appendChild(card);
  });
}

function severityTagClass(sev) {
  if (sev === "Low") return "tag-severity-low";
  if (sev === "Medium") return "tag-severity-medium";
  if (sev === "High") return "tag-severity-high";
  return "tag-severity-critical";
}

function statusTagClass(status) {
  if (status === "Open") return "tag-status-open";
  if (status === "In Progress") return "tag-status-progress";
  return "tag-status-resolved";
}

function renderManualBuildingOptions() {
  const select = document.getElementById("manualBuilding");
  if (!select) return;

  if (select.options.length > 0) return;

  buildings.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    select.appendChild(opt);
  });
}

// ---------- Stats / derived values ----------

function updateDerivedStats() {
  const openCountLabel = document.getElementById("openCountLabel");
  const overdueCountLabel = document.getElementById("overdueCountLabel");

  const openCount = incidents.filter(
    (inc) => inc.status === "Open" || inc.status === "In Progress"
  ).length;

  const overdueCount = incidents.filter(
    (inc) => inc.overdue && inc.status !== "Resolved"
  ).length;

  openCountLabel.textContent = openCount.toString();
  overdueCountLabel.textContent = overdueCount.toString();
}

// ---------- Time handling ----------

function advanceTime(hours) {
  for (let i = 0; i < hours; i++) {
    gameState.hour += 1;
    if (gameState.hour >= 24) {
      gameState.hour = 0;
      gameState.day += 1;
    }
    updateIncidentsPerHour();
  }

  renderAll();
}

function updateIncidentsPerHour() {
  incidents.forEach((inc) => {
    if (inc.status === "Resolved") return;

    inc.hoursOpen += 1;

    const config = severityConfig[inc.severity];
    const isOverdue = inc.hoursOpen > config.overdueHours;
    if (isOverdue && !inc.overdue) {
      inc.overdue = true;
      logEvent(
        `งานแจ้งซ่อมที่ ${inc.buildingName} (${inc.description}) เกินเวลาที่ควรแก้ไข!`
      );
      gameState.score -= 2;
    }

    const riskGain =
      config.riskPerHour * (isOverdue ? 2 : 1);
    gameState.totalRisk += riskGain;

    if (inc.hoursOpen % 8 === 0 && inc.status === "Open") {
      gameState.score -= 1;
    }
  });

  const roll = Math.random();
  if (roll < 0.08) {
    createRandomIncident();
  }
}

// ---------- Actions ----------

function handleAssignAndFix(incidentId) {
  const inc = incidents.find((x) => x.id === incidentId);
  if (!inc) return;

  if (inc.status === "Resolved") return;

  if (inc.cost > gameState.budget) {
    logEvent(
      `งบประมาณไม่พอสำหรับงานที่ ${inc.buildingName} (${inc.description})`
    );
    gameState.score -= 1;
    renderAll();
    return;
  }

  inc.status = "In Progress";
  inc.status = "Resolved";
  inc.hoursSpent = inc.hoursRequired;

  gameState.budget -= inc.cost;

  const baseScore =
    inc.severity === "Critical"
      ? 8
      : inc.severity === "High"
      ? 5
      : inc.severity === "Medium"
      ? 3
      : 1;
  let scoreGain = baseScore;

  if (!inc.overdue) {
    scoreGain += 2;
  }

  if (
    inc.hoursOpen <= 4 &&
    (inc.severity === "High" || inc.severity === "Critical")
  ) {
    scoreGain += 2;
    logEvent(
      `ดำเนินการแก้ไขงานวิกฤตได้อย่างรวดเร็วที่ ${inc.buildingName} (+โบนัสคะแนน)`
    );
  }

  gameState.score += scoreGain;

  logEvent(
    `แก้ไขงานแจ้งซ่อมเสร็จสิ้นที่ ${inc.buildingName}: ${inc.description} (ใช้ ${formatCurrency(
      inc.cost
    )})`
  );

  renderAll();
}

// ---------- Event log ----------

function logEvent(message) {
  const logContainer = document.getElementById("eventLog");
  const timeLabel = formatSimTime(gameState.day, gameState.hour);

  const entry = document.createElement("div");
  entry.className = "log-entry";

  const timeSpan = document.createElement("span");
  timeSpan.className = "log-time";
  timeSpan.textContent = `[${timeLabel}]`;

  const msgSpan = document.createElement("span");
  msgSpan.textContent = " " + message;

  entry.appendChild(timeSpan);
  entry.appendChild(msgSpan);

  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// ---------- Manual incident form ----------

function setupManualForm() {
  const form = document.getElementById("manualIncidentForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const buildingId = document.getElementById("manualBuilding").value;
    const description =
      document.getElementById("manualDescription").value.trim();
    const severity = document.getElementById("manualSeverity").value;
    const costValue = parseInt(
      document.getElementById("manualCost").value,
      10
    );
    const durationValue = parseInt(
      document.getElementById("manualDuration").value,
      10
    );

    if (!description) return;

    const building = buildings.find((b) => b.id === buildingId);
    if (!building) return;

    const incident = {
      id: nextIncidentId++,
      buildingId: building.id,
      buildingName: building.name,
      description,
      severity,
      status: "Open",
      cost: isNaN(costValue) ? 1000 : costValue,
      hoursRequired: isNaN(durationValue) ? 2 : durationValue,
      hoursSpent: 0,
      hoursOpen: 0,
      createdDay: gameState.day,
      createdHour: gameState.hour,
      overdue: false
    };

    incidents.push(incident);
    logEvent(
      `สร้างงานแจ้งซ่อมใหม่โดยผู้ใช้ที่ ${incident.buildingName}: ${incident.description}`
    );

    form.reset();
    renderAll();
  });
}

// ---------- Filters ----------

function setupFilters() {
  const statusSelect = document.getElementById("filterStatus");
  const severitySelect = document.getElementById("filterSeverity");

  statusSelect.addEventListener("change", () => {
    renderIncidentList();
  });

  severitySelect.addEventListener("change", () => {
    renderIncidentList();
  });
}

// ---------- Controls ----------

function setupControls() {
  const btnNewIncident = document.getElementById("btnNewIncident");
  btnNewIncident.addEventListener("click", () => {
    createRandomIncident();
  });

  const btnAdvanceHour = document.getElementById("btnAdvanceHour");
  btnAdvanceHour.addEventListener("click", () => {
    advanceTime(1);
  });

  const btnAdvanceDay = document.getElementById("btnAdvanceDay");
  btnAdvanceDay.addEventListener("click", () => {
    advanceTime(24);
  });
}

// ---------- Init ----------

function init() {
  setupManualForm();
  setupFilters();
  setupControls();

  createRandomIncident();
  createRandomIncident();
  createRandomIncident();

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
