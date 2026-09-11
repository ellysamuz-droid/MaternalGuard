// MaternalGuard — interaksi ringan sisi klien (demo, tanpa backend)

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// Simulasi submit form "Catat Hasil Periksa"
function handlePeriksaSubmit(event, namaPasien) {
  event.preventDefault();
  showToast(`Catatan hasil periksa ${namaPasien} berhasil disimpan`);
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
}

// Render grafik tren tekanan darah (dipanggil dari detail.html)
function renderTrendChart(canvasId, labels, sistolik, diastolik) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sistolik',
          data: sistolik,
          borderColor: '#AE423B',
          backgroundColor: 'rgba(174,66,59,0.08)',
          borderWidth: 2,
          pointRadius: 3.5,
          pointBackgroundColor: '#AE423B',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Diastolik',
          data: diastolik,
          borderColor: '#0E6E7C',
          backgroundColor: 'rgba(14,110,124,0.06)',
          borderWidth: 2,
          pointRadius: 3.5,
          pointBackgroundColor: '#0E6E7C',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 60, max: 150,
          grid: { color: '#E3E9EA' },
          ticks: { color: '#93A5AB', font: { size: 11, family: 'IBM Plex Mono' } },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#93A5AB', font: { size: 11 } },
        },
      },
    },
  });
}
