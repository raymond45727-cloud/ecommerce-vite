<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const user = ref({
  username: "",
  password: "",
});
const router = useRouter();
const isLoading = ref(false);

const signin = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/admin/signin`;
  isLoading.value = true;
  try {
    const response = await axios.post(api, user.value);
    if (response.data.success) {
      const token = response.data.token;
      const expired = response.data.expired;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;
      router.push("/admin/products");
    } else {
      alert(response.data.message);
    }
  } catch (err) {
    console.log("登入失敗!", err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper d-flex align-items-center justify-content-center min-vh-100 w-100">
    <div class="login-card p-4 p-sm-5 rounded-4 border border-secondary border-opacity-25 shadow-lg w-100">
      <form @submit.prevent="signin">
        
        <div class="text-center mb-4">
          <div class="brand-icon bg-primary bg-opacity-20 text-primary-glow rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
            <i class="bi bi-shield-lock-fill fs-3"></i>
          </div>
          <h1 class="h4 fw-bold mb-1 text-light">後台管理系統</h1>
          <p class="text-secondary small mb-0">請輸入管理者帳號密碼</p>
        </div>

        
        <div class="form-floating mb-3">
          <input
            type="email"
            class="form-control dark-input text-light"
            id="floatingInput"
            placeholder="name@example.com"
            v-model="user.username"
            required
          />
          <label for="floatingInput" class="text-secondary">Email address</label>
        </div>

        <div class="form-floating mb-3">
          <input
            type="password"
            class="form-control dark-input text-light"
            id="floatingPassword"
            placeholder="Password"
            v-model="user.password"
            required
          />
          <label for="floatingPassword" class="text-secondary">Password</label>
        </div>

        <div class="form-check text-start mb-4">
          <input
            class="form-check-input dark-checkbox"
            type="checkbox"
            id="rememberMe"
          />
          <label class="form-check-label text-secondary small" for="rememberMe">
            記住我的登入狀態
          </label>
        </div>

        
        <button 
          class="btn btn-primary-custom w-100 py-2 fw-medium rounded-3 d-flex align-items-center justify-content-center gap-2" 
          type="submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
          <span>{{ isLoading ? '登入中...' : '登入系統' }}</span>
        </button>

        <p class="mt-4 mb-0 text-center text-secondary small">&copy; 2026 E-Commerce Admin</p>
      </form>
    </div>
  </div>
</template>

<style scoped>

.login-wrapper {
  background-color: #0f172a; /* Slate 900 */
}


.login-card {
  max-width: 400px;
  background-color: #1e293b; /* Slate 800 */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.brand-icon {
  width: 56px;
  height: 56px;
  background-color: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}


.dark-input {
  background-color: #0f172a !important;
  border-color: #334155 !important;
}

.dark-input:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25) !important;
}


.form-floating > .form-control:focus ~ label,
.form-floating > .form-control:not(:placeholder-shown) ~ label {
  background-color: transparent;
  color: #94a3b8;
}


.btn-primary-custom {
  background-color: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  transition: all 0.2s ease;
}

.btn-primary-custom:hover {
  background-color: #4338ca;
  border-color: #4338ca;
}

.btn-primary-custom:disabled {
  background-color: #3730a3;
  border-color: #3730a3;
}
</style>
