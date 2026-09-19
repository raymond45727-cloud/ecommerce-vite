<template>
  <header class="navbar sticky-top custom-navbar shadow-sm py-2">
    <div
      class="container-fluid px-4 d-flex align-items-center justify-content-between"
    >
      <a
        class="navbar-brand fw-bold text-white d-flex align-items-center gap-3 py-1"
        href="#"
      >
        <i class="fas fa-store text-primary-glow fs-2"></i>
        <span class="brand-title fs-3">商城管理後台</span>
      </a>

      <div class="d-flex align-items-center">
        <span
          class="admin-badge d-flex align-items-center gap-2 px-3 py-2 rounded-pill fs-6 fw-medium"
        >
          <i class="fas fa-user-shield text-success"></i>
          <span>管理員已登入</span>
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.custom-navbar {
  background-color: #0b0f19;
  border-bottom: 1px solid #1e293b;
}

.brand-title {
  font-size: 1.25rem;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-primary-glow {
  color: #6366f1;
  filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.6));
}
</style>
