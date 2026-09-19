<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const isLoading = ref(false);
const logout = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/logout`;
  isLoading.value = true;
  try {
    const response = await axios.post(api);
    if (response.data.success) {
      document.cookie = "hexToken=;expires=;";
      router.push("/login");
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="sidebar border-end border-secondary border-opacity-10 col-md-3 col-lg-2 p-0 dark-sidebar"
  >
    <div
      class="offcanvas-md offcanvas-end dark-sidebar"
      tabindex="-1"
      id="sidebarMenu"
      aria-labelledby="sidebarMenuLabel"
    >
      <div
        class="offcanvas-header border-bottom border-secondary border-opacity-25"
      >
        <h5 class="offcanvas-title text-light fw-bold" id="sidebarMenuLabel">
          商城管理後台
        </h5>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          data-bs-target="#sidebarMenu"
          aria-label="Close"
        ></button>
      </div>

      <div
        class="offcanvas-body d-md-flex flex-column p-3 pt-lg-4 overflow-y-auto"
      >
        <h6
          class="sidebar-heading px-3 mt-2 mb-2 text-secondary text-uppercase fw-semibold fs-7"
        >
          <span>管理員</span>
        </h6>
        <ul class="nav flex-column mb-3 gap-1">
          <li class="nav-item">
            <router-link
              class="nav-link custom-nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3"
              to="/admin/products"
            >
              <i class="fas fa-box-open fa-fw fs-5"></i>
              <span>產品列表</span>
            </router-link>
          </li>
        </ul>

        <h6
          class="sidebar-heading px-3 mt-3 mb-2 text-secondary text-uppercase fw-semibold fs-7"
        >
          <span>模擬功能</span>
        </h6>
        <ul class="nav flex-column mb-auto gap-1">
          <li class="nav-item">
            <router-link
              class="nav-link custom-nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3"
              to="/admin/customer_order"
            >
              <i class="fas fa-shopping-cart fa-fw fs-5"></i>
              <span>模擬訂單</span>
            </router-link>
          </li>
        </ul>

        <hr class="my-3 border-secondary border-opacity-25" />

        <!-- 登出按鈕 -->
        <ul class="nav flex-column">
          <li class="nav-item">
            <a
              class="nav-link logout-link d-flex align-items-center gap-3 px-3 py-2 rounded-3"
              href="#"
              @click.prevent="logout"
            >
              <i class="fas fa-sign-out-alt fa-fw fs-5"></i>
              <span>登出</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark-sidebar {
  background-color: #0f172a !important;
  min-height: 100vh;
}

.fs-7 {
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  font-weight: 600 !important;
}

.custom-nav-link {
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.custom-nav-link:hover {
  color: #f8fafc;
  background-color: rgba(255, 255, 255, 0.05);
}

.custom-nav-link.active,
.router-link-active {
  color: #ffffff !important;
  background-color: #4f46e5 !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.logout-link {
  color: #f87171;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-link:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}
</style>
