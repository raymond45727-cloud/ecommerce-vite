<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const order = ref({
  user: {},
});
const orderId = ref(route.params.orderId);

const getOrder = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/order/${orderId.value}`;

  try {
    const response = await axios.get(api);
    if (response.data.success) {
      order.value = response.data.order;
    } else {
      alert(response.data.message);
    }
  } catch (err) {
    console.dir(err);
  }
};

const payOrder = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/pay/${orderId.value}`;

  try {
    const response = await axios.post(api);

    if (response.data.success) {
      alert(response.data.message);
      getOrder();
    } else {
      alert(response.data.message);
    }
  } catch (err) {
    console.dir(err);
  }
};

onMounted(() => {
  getOrder();
});
</script>

<template>
  <div class="checkout-container py-3">
    <div class="mb-4">
      <h2 class="fw-bold text-white mb-1">顧客結帳確認</h2>
      <p class="text-secondary small">訂單明細核對與完成付款作業</p>
    </div>

    <div class="row justify-content-center">
      <form class="col-lg-8 col-xl-7" @submit.prevent="payOrder">
        <div class="dark-card p-4 rounded-3 mb-4">
          <h4 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="fas fa-receipt text-primary-glow"></i> 購買品項明細
          </h4>
          <div class="table-responsive">
            <table class="table dark-table align-middle mb-0">
              <thead>
                <tr>
                  <th>品名</th>
                  <th style="width: 120px">數量</th>
                  <th class="text-end" style="width: 120px">小計</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.products" :key="item.id">
                  <td class="text-white fw-medium">{{ item.product.title }}</td>
                  <td class="text-secondary">
                    {{ item.qty }} / {{ item.product.unit }}
                  </td>
                  <td class="text-end text-white">
                    ${{ item.final_total?.toLocaleString() }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="text-end text-secondary border-0 pt-3">
                    應付總金額
                  </td>
                  <td
                    class="text-end text-primary-glow fw-bold fs-4 border-0 pt-3"
                  >
                    ${{ order.total?.toLocaleString() }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="dark-card p-4 rounded-3 mb-4">
          <h4 class="text-white fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="fas fa-user-check text-primary-glow"></i> 訂購人與付款資訊
          </h4>
          <div class="table-responsive">
            <table class="table dark-table align-middle mb-0">
              <tbody>
                <tr>
                  <th style="width: 130px" class="text-secondary">Email</th>
                  <td class="text-white">{{ order.user.email }}</td>
                </tr>
                <tr>
                  <th class="text-secondary">姓名</th>
                  <td class="text-white">{{ order.user.name }}</td>
                </tr>
                <tr>
                  <th class="text-secondary">收件人電話</th>
                  <td class="text-white">{{ order.user.tel }}</td>
                </tr>
                <tr>
                  <th class="text-secondary">收件人地址</th>
                  <td class="text-white">{{ order.user.address }}</td>
                </tr>
                <tr>
                  <th class="text-secondary">付款狀態</th>
                  <td>
                    <span
                      v-if="!order.is_paid"
                      class="badge bg-danger text-white px-3 py-2"
                    >
                      <i class="fas fa-exclamation-circle me-1"></i> 尚未付款
                    </span>
                    <span v-else class="badge bg-success text-white px-3 py-2">
                      <i class="fas fa-check-circle me-1"></i> 付款完成
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="text-end" v-if="order.is_paid === false">
          <button class="btn btn-primary-glow btn-lg px-5 fw-bold">
            <i class="fas fa-credit-card me-2"></i> 確認付款去
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.dark-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark-table {
  color: #cbd5e1 !important;
  --bs-table-bg: transparent !important;
}

.dark-table th {
  background-color: #0f172a !important;
  color: #94a3b8 !important;
  border-bottom: 1px solid #334155 !important;
}

.dark-table tbody tr {
  background-color: #1e293b !important;
}

.dark-table td {
  color: #f8fafc !important;
  border-bottom: 1px solid #334155 !important;
  background-color: transparent !important;
}

.btn-primary-glow {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
}

.btn-primary-glow:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
  transform: translateY(-2px);
}

.text-primary-glow {
  color: #818cf8;
}
</style>
