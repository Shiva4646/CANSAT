setInterval(() => {
      const timer = document.getElementById("timer");
      const parts = timer.textContent.split(":").map(Number);
      let seconds = parts[2] + parts[1] * 60 + parts[0] * 3600 + 1;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timer.textContent = `${h}:${m}:${s}`;
    }, 1000);

    setInterval(() => {
      const now = new Date();
      const gnssTimeEl = document.getElementById("gnssTime");
      if (gnssTimeEl) {
        gnssTimeEl.textContent = now.toLocaleTimeString('en-GB');
      }
    }, 1000);