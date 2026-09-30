/*
    Seemanta Campus - Campus Job Board
    Built by Kritiman Sethy
*/

const STORAGE_KEY = "oncampus_jobs";

const seedJobs = [
    {
        type: "internship",
        role: "Frontend Developer Intern",
        company: "Zenith Technologies",
        location: "Remote",
        pay: "₹15,000/mo",
        from: "2026-09-25",
        until: "2026-11-15",
        desc: "Work on React-based dashboards alongside the product team.",
        contact: "careers@zenithtech.com"
    },
    {
        type: "full-time",
        role: "Graduate Software Engineer",
        company: "Nimbus Systems",
        location: "Bhubaneswar",
        pay: "₹4.5 LPA",
        from: "2026-09-20",
        until: "2026-12-01",
        desc: "Backend role for CSE/IT graduates; Java or Node.js background preferred.",
        contact: "hr@nimbussystems.in"
    },
    {
        type: "internship",
        role: "Data Analyst Intern",
        company: "Insight Analytics",
        location: "Hybrid — Cuttack",
        pay: "₹10,000/mo",
        from: "2026-10-05",
        until: "2026-11-20",
        desc: "Assist in building dashboards and cleaning datasets using Excel and SQL.",
        contact: "internships@insightanalytics.co"
    },
    {
        type: "full-time",
        role: "Associate Network Engineer",
        company: "OdiTel Networks",
        location: "Baripada",
        pay: "₹3.8 LPA",
        from: "2026-09-28",
        until: "2026-12-10",
        desc: "Entry-level networking role; CCNA knowledge is a plus.",
        contact: "jobs@oditel.com"
    }
];

// ---- Apply period helpers (dates are YYYY-MM-DD, compared in local time) ----
function todayStr() {
    return new Date().toLocaleDateString("en-CA");
}

function jobUntil(job) {
    return job.until || job.deadline || "";
}

function isExpired(job) {
    const until = jobUntil(job);
    return !!until && until < todayStr();
}

function isActive(job) {
    const today = todayStr();
    const started = !job.from || job.from <= today;
    return started && !isExpired(job);
}

function daysLeft(job) {
    const ms = new Date(jobUntil(job) + "T00:00:00") - new Date(todayStr() + "T00:00:00");
    return Math.round(ms / 86400000);
}

function loadJobs() {
    let list = seedJobs.slice();
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) list = JSON.parse(stored);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(seedJobs));
    } catch (err) {
        // Storage can be unavailable (private mode, sandboxed preview); fall back to seed data.
    }
    // Remove openings whose apply period has ended
    const live = list.filter(job => !isExpired(job));
    if (live.length !== list.length) saveJobs(live);
    return live;
}

function saveJobs(jobs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (err) {
        // Ignore: the board still works for this session.
    }
}

let jobs = loadJobs();
let activeFilter = "all";
let searchTerm = "";

const jobGrid = document.getElementById("jobGrid");
const emptyState = document.getElementById("emptyState");
const heroCount = document.getElementById("heroCount");

function formatDeadline(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function applyRange(job) {
    const left = daysLeft(job);
    const range = job.from
        ? `Apply ${formatDeadline(job.from)} – ${formatDeadline(jobUntil(job))}`
        : `Apply by ${formatDeadline(jobUntil(job))}`;
    const label = left === 0 ? "last day" : left === 1 ? "1 day left" : `${left} days left`;
    return `${range} · <span class="left${left <= 3 ? " soon" : ""}">${label}</span>`;
}

function renderJobs() {
    jobs = jobs.filter(job => !isExpired(job));
    const filtered = jobs.filter(job => {
        const matchesFilter = isActive(job) && (activeFilter === "all" || job.type === activeFilter);
        const haystack = `${job.role} ${job.company} ${job.location}`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    jobGrid.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;

    filtered.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
            <span class="tag ${job.type}">${job.type === "internship" ? "Internship" : "Full-time"}</span>
            <h3>${escapeHtml(job.role)}</h3>
            <p class="company">${escapeHtml(job.company)}</p>
            <p class="meta">${escapeHtml(job.location)} ${job.pay ? "· " + escapeHtml(job.pay) : ""}</p>
            <p class="meta">${applyRange(job)}</p>
            ${job.desc ? `<p class="desc">${escapeHtml(job.desc)}</p>` : ""}
            <p class="apply-link">${escapeHtml(job.contact)}</p>
        `;
        jobGrid.appendChild(card);
    });

    const openCount = jobs.filter(isActive).length;
    heroCount.textContent = `${openCount} open position${openCount === 1 ? "" : "s"} on the board right now`;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Search
document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    searchTerm = document.getElementById("searchInput").value.trim();
    renderJobs();
});
document.getElementById("searchInput").addEventListener("input", e => {
    searchTerm = e.target.value.trim();
    renderJobs();
});

// Filter chips
document.getElementById("filterChips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    renderJobs();
});

// Post form
document.getElementById("postForm").addEventListener("submit", e => {
    e.preventDefault();

    const newJob = {
        type: document.getElementById("fType").value,
        role: document.getElementById("fRole").value.trim(),
        company: document.getElementById("fCompany").value.trim(),
        location: document.getElementById("fLocation").value.trim(),
        pay: document.getElementById("fPay").value.trim(),
        from: document.getElementById("fFrom").value,
        until: document.getElementById("fUntil").value,
        desc: document.getElementById("fDesc").value.trim(),
        contact: document.getElementById("fContact").value.trim()
    };

    if (!newJob.role || !newJob.company || !newJob.location || !newJob.from || !newJob.until || !newJob.contact) {
        document.getElementById("formMsg").style.color = "#A63D3D";
        document.getElementById("formMsg").textContent = "Please fill in all required fields.";
        return;
    }

    if (newJob.until < newJob.from || newJob.until < todayStr()) {
        document.getElementById("formMsg").style.color = "#A63D3D";
        document.getElementById("formMsg").textContent = newJob.until < newJob.from
            ? "The end date must be on or after the start date."
            : "The end date has already passed.";
        return;
    }

    jobs.unshift(newJob);
    saveJobs(jobs);
    renderJobs();

    e.target.reset();
    setDefaultDates();
    const msg = document.getElementById("formMsg");
    msg.style.color = "#2F7A5C";
    msg.textContent = newJob.from > todayStr()
        ? `Opening scheduled — it will appear on ${formatDeadline(newJob.from)}.`
        : "Opening posted — it's live on the board above.";
    setTimeout(() => { msg.textContent = ""; }, 4000);
});

// Default apply period: starts today; end date cannot be earlier than the start
function setDefaultDates() {
    const from = document.getElementById("fFrom");
    const until = document.getElementById("fUntil");
    from.value = todayStr();
    from.min = todayStr();
    until.min = from.value;
}
document.getElementById("fFrom").addEventListener("change", e => {
    const until = document.getElementById("fUntil");
    until.min = e.target.value || todayStr();
    if (until.value && until.value < until.min) until.value = "";
});
setDefaultDates();

// Mobile nav toggle
document.getElementById("navToggle").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
});

// Light / dark theme toggle
const themeToggle = document.getElementById("themeToggle");
function updateThemeLabel() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
}
themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("seemanta_theme", next); } catch (err) {}
    updateThemeLabel();
});
updateThemeLabel();

renderJobs();

// Re-check every minute so expired openings disappear without a reload
setInterval(() => { jobs = jobs.filter(job => !isExpired(job)); saveJobs(jobs); renderJobs(); }, 60000);
