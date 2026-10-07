(function () {
  function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    var collapseBtn = document.getElementById('sidebarCollapseBtn');
    if (!sidebar || !collapseBtn) return;

    var saved = localStorage.getItem('simple_gui_sidebar_collapsed');
    if (saved === 'true') {
      sidebar.classList.add('collapsed');
      collapseBtn.textContent = '>';
    }

    collapseBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
      var collapsed = sidebar.classList.contains('collapsed');
      collapseBtn.textContent = collapsed ? '>' : '<';
      localStorage.setItem('simple_gui_sidebar_collapsed', String(collapsed));
    });

    var current = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-item');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === current) {
        link.classList.add('active');
      }
    });
  }

  window.SimpleGUISidebar = { initSidebar: initSidebar };
})();
