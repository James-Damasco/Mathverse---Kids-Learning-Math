lucide.createIcons();

window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mainContainer");
    container.classList.remove("translate-y-4", "opacity-0");
});

const themeToggleBtn = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add("dark");
} else {
    document.documentElement.classList.remove("dark");
}

themeToggleBtn.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
});

let countdownValue = 15;
const countdownEl = document.getElementById("countdown");
const redirectBanner = document.getElementById("redirectBanner");
const cancelRedirectBanner = document.getElementById("cancelRedirect");

const redirectInterval = setInterval(() => {
    countdownValue--;
    if (countdownEl) countdownEl.textContent = countdownValue;
    if (countdownValue <= 0) {
        clearInterval(redirectInterval);
    }
}, 1000);

cancelRedirectBtn.addEventListener("click", () => {
    clearInterval(redirectInterval);
    redirectBanner.classList.add("hidden");

    document.getElementById("footerSupportLink").addEventListener("click", () => {
        const email = "userprotonimous@proton.me";
        const subject = encodeURIComponent("Broken Link / 404 Error Report");
        const body = encodeURIComponent(`Hello Support Team,\n\nI encountered a 404 error page on your website.\nURL attempted: ${window.location.href}\nTime of error: ${new Date().toLocaleString()}\n\nPlease help!`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
});
