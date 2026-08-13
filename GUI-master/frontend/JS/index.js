let dataPoints = [];

document.addEventListener("DOMContentLoaded", function() {
  function updateTimes() {
    const now = new Date();
    const gmtTime = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });
    const istTime = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
    const gmtSpan = document.getElementById('gmtTime');
    const istSpan = document.getElementById('istTime');
    if (gmtSpan) gmtSpan.textContent = gmtTime;
    if (istSpan) istSpan.textContent = istTime;
  }
  setInterval(updateTimes, 1000);
  updateTimes();

  //removed CSV upload button, settings button, mode button as well
});

