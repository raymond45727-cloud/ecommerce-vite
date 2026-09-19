<script setup>
import { ref, onMounted } from "vue";
import { Modal } from "bootstrap";
import { useRouter } from "vue-router";
import axios from "axios";
import LoadingLib from "vue-loading-overlay";
import "vue-loading-overlay/dist/css/index.css";

const Loading = LoadingLib.Component || LoadingLib;

const router = useRouter();
const products = ref([]);
const product = ref({});
const cart = ref({ carts: [] });
const form = ref({
  user: {
    name: "",
    email: "",
    tel: "",
    address: "",
  },
  message: "",
});
const modalRef = ref(null);
const qty = ref(1);
let myModal = null;
const isLoading = ref(false);

const getProducts = async () => {
  isLoading.value = true;
  try {
    const firstApi = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/products?page=1`;
    const firstResponse = await axios.get(firstApi);

    if (firstResponse.data.success) {
      let allProducts = [...firstResponse.data.products];
      const totalPages = firstResponse.data.pagination.total_pages;

      for (let page = 2; page <= totalPages; page++) {
        const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/products?page=${page}`;
        const response = await axios.get(api);
        if (response.data.success) {
          allProducts = [...allProducts, ...response.data.products];
        }
      }

      products.value = allProducts;
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};

const getProduct = async (id) => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/product/${id}`;
  isLoading.value = true;

  try {
    const response = await axios.get(api);

    if (response.data.success) {
      product.value = response.data.product;
      myModal.show();
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};

const addToCart = async (id) => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/cart`;
  const cartData = {
    product_id: id,
    qty: qty.value,
  };

  isLoading.value = true;
  try {
    const response = await axios.post(api, { data: cartData });

    if (response.data.success) {
      myModal.hide();
      await getCart();
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};

const getCart = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/cart`;
  isLoading.value = true;
  try {
    const response = await axios.get(api);

    if (response.data.success) {
      cart.value = response.data.data;
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};

const removeCartItem = async (id) => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/cart/${id}`;
  isLoading.value = true;
  try {
    const response = await axios.delete(api);

    if (response.data.success) {
      await getCart();
    }
  } catch (err) {
    console.dir(err);
  } finally {
    isLoading.value = false;
  }
};

const createOrder = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/order`;

  try {
    const response = await axios.post(api, { data: form.value });

    if (response.data.success) {
      alert(response.data.message);
      const orderId = response.data.orderId;

      router.push(`/admin/customer_checkout/${orderId}`);

      form.value = {
        user: { name: "", email: "", tel: "", address: "" },
        message: "",
      };
      await getCart();
    } else {
      alert(response.data.message);
    }
  } catch (err) {
    console.dir(err);
  }
};

onMounted(() => {
  myModal = new Modal(modalRef.value);
  getProducts();
  getCart();
});
</script>

<template>
  <div class="order-demo-container py-3">
    <Loading :active="isLoading" />

    <div class="mb-4">
      <h2 class="fw-bold text-white mb-1">模擬購物選購區</h2>
      <p class="text-secondary small">前台顧客選購體驗與即時結帳流程模擬</p>
    </div>

    <div class="row g-4 mb-5">
      <div class="col-md-6 col-lg-4" v-for="item in products" :key="item.id">
        <div class="card dark-card h-100 border-0 shadow-sm">
          <div
            class="product-img-wrapper"
            :style="{ backgroundImage: `url(${item.imageUrl})` }"
          ></div>

          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title text-white fw-bold me-2 mb-0 text-truncate">
                {{ item.title }}
              </h5>
              <span class="badge category-badge px-2 py-1 fs-7">
                {{ item.category }}
              </span>
            </div>

            <p class="card-text text-secondary small line-clamp-2 mb-4">
              {{ item.content || "高品質精選商品，提供優質的使用體驗。" }}
            </p>

            <div
              class="mt-auto d-flex justify-content-between align-items-baseline"
            >
              <del class="small text-muted" v-if="item.price">
                ${{ item.origin_price?.toLocaleString() }}
              </del>
              <div class="h5 text-primary-glow fw-bold mb-0">
                ${{ (item.price || item.origin_price)?.toLocaleString() }}
              </div>
            </div>
          </div>

          <div class="card-footer dark-card-footer d-flex gap-2 p-3">
            <button
              type="button"
              class="btn btn-outline-light btn-sm w-50"
              @click="getProduct(item.id)"
            >
              <i class="fas fa-eye me-1"></i> 查看細節
            </button>
            <button
              type="button"
              class="btn btn-primary-glow btn-sm w-50"
              @click="addToCart(item.id)"
            >
              <i class="fas fa-cart-plus me-1"></i> 加購物車
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="modal fade"
      id="productDetailModal"
      ref="modalRef"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content dark-modal border-0">
          <div
            class="modal-header border-secondary border-opacity-25 text-white"
          >
            <h5 class="modal-title fw-bold">{{ product.title }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body text-light">
            <div class="text-center mb-3">
              <img
                :src="product.imageUrl"
                class="img-fluid rounded shadow-sm modal-product-img"
                alt="產品圖片"
              />
            </div>
            <span class="badge category-badge mb-3">{{
              product.category
            }}</span>
            <p class="text-secondary">{{ product.description }}</p>
            <p class="text-secondary small">{{ product.content }}</p>

            <div
              class="d-flex justify-content-between align-items-baseline my-3"
            >
              <del class="text-muted" v-if="product.price">
                原價 ${{ product.origin_price }}
              </del>
              <div class="h4 text-primary-glow fw-bold" v-if="product.price">
                特價 ${{ product.price }}
              </div>
            </div>

            <div class="mb-3 mt-3">
              <label class="form-label text-secondary small">選購數量</label>
              <select class="form-select dark-input" v-model.number="qty">
                <option v-for="n in 10" :key="n" :value="n">
                  選購 {{ n }} {{ product.unit }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer border-secondary border-opacity-25">
            <span class="me-auto text-white fw-medium">
              小計
              <span class="text-primary-glow fs-5"
                >${{ (product.price * qty)?.toLocaleString() }}</span
              >
            </span>
            <button
              type="button"
              class="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              關閉
            </button>
            <button
              type="button"
              class="btn btn-primary-glow"
              @click="addToCart(product.id)"
            >
              加入購物車
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-7">
        <div class="dark-card p-4 rounded-3 h-100">
          <h4 class="text-white fw-bold mb-4 d-flex align-items-center gap-2">
            <i class="fas fa-shopping-cart text-primary-glow"></i> 購物車清單
          </h4>
          <div class="table-responsive">
            <table class="table dark-table align-middle">
              <thead>
                <tr>
                  <th style="width: 50px"></th>
                  <th>品名</th>
                  <th style="width: 100px">數量</th>
                  <th class="text-end" style="width: 100px">單價</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cart.carts" :key="item.id">
                  <td>
                    <button
                      type="button"
                      class="btn btn-link text-danger p-0"
                      @click="removeCartItem(item.id)"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                  <td class="text-white fw-medium">{{ item.product.title }}</td>
                  <td class="text-secondary">
                    {{ item.qty }} / {{ item.product.unit }}
                  </td>
                  <td class="text-end text-white">
                    ${{ item.final_total?.toLocaleString() }}
                  </td>
                </tr>
                <tr v-if="!cart.carts || cart.carts.length === 0">
                  <td colspan="4" class="text-center py-4 text-secondary">
                    購物車目前是空的，快去選購商品吧！
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="cart.carts && cart.carts.length > 0">
                <tr>
                  <td colspan="3" class="text-end text-secondary border-0">
                    總計
                  </td>
                  <td class="text-end text-white border-0">
                    ${{ cart.total?.toLocaleString() }}
                  </td>
                </tr>
                <tr>
                  <td
                    colspan="3"
                    class="text-end text-success fw-bold border-0"
                  >
                    折扣價
                  </td>
                  <td class="text-end text-success fw-bold fs-5 border-0">
                    ${{ cart.final_total?.toLocaleString() }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="dark-card p-4 rounded-3">
          <h4 class="text-white fw-bold mb-4 d-flex align-items-center gap-2">
            <i class="fas fa-user-edit text-primary-glow"></i> 顧客收件資訊
          </h4>

          <VForm v-slot="{ errors }" @submit="createOrder">
            <div class="mb-3">
              <label for="email" class="form-label text-secondary small"
                >Email</label
              >
              <VField
                id="email"
                name="Email"
                type="email"
                class="form-control dark-input"
                :class="{ 'is-invalid': errors['Email'] }"
                placeholder="請輸入 Email"
                rules="email|required"
                v-model="form.user.email"
              />
              <ErrorMessage name="Email" class="invalid-feedback" />
            </div>

            <div class="mb-3">
              <label for="username" class="form-label text-secondary small"
                >收件人姓名</label
              >
              <VField
                id="username"
                name="姓名"
                type="text"
                class="form-control dark-input"
                :class="{ 'is-invalid': errors['姓名'] }"
                placeholder="請輸入姓名"
                rules="required"
                v-model="form.user.name"
              />
              <ErrorMessage name="姓名" class="invalid-feedback" />
            </div>

            <div class="mb-3">
              <label for="usertel" class="form-label text-secondary small"
                >收件人電話</label
              >
              <VField
                id="usertel"
                name="電話"
                type="tel"
                class="form-control dark-input"
                :class="{ 'is-invalid': errors['電話'] }"
                placeholder="請輸入電話"
                rules="required|min:8"
                v-model="form.user.tel"
              />
              <ErrorMessage name="電話" class="invalid-feedback" />
            </div>

            <div class="mb-3">
              <label for="useraddress" class="form-label text-secondary small"
                >收件人地址</label
              >
              <VField
                id="useraddress"
                name="地址"
                type="text"
                class="form-control dark-input"
                :class="{ 'is-invalid': errors['地址'] }"
                placeholder="請輸入地址"
                rules="required"
                v-model="form.user.address"
              />
              <ErrorMessage name="地址" class="invalid-feedback" />
            </div>

            <div class="mb-4">
              <label for="comment" class="form-label text-secondary small"
                >留言</label
              >
              <textarea
                id="comment"
                class="form-control dark-input"
                cols="30"
                rows="3"
                v-model="form.message"
              ></textarea>
            </div>

            <button
              type="submit"
              class="btn btn-primary-glow w-100 py-2 fw-bold"
            >
              送出訂單
            </button>
          </VForm>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dark-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.dark-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.dark-card-footer {
  background-color: #0f172a;
  border-top: 1px solid #334155;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}

.product-img-wrapper {
  height: 180px;
  background-size: cover;
  background-position: center;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  filter: brightness(0.88);
  transition: filter 0.3s ease;
}

.dark-card:hover .product-img-wrapper {
  filter: brightness(1);
}

.modal-product-img {
  max-height: 250px;
  object-fit: contain;
}

.btn-primary-glow {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.btn-primary-glow:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: #ffffff;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
}

.text-primary-glow {
  color: #818cf8;
}

.category-badge {
  background-color: #334155;
  color: #cbd5e1;
  border: 1px solid #475569;
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

.dark-table tfoot tr {
  background-color: transparent !important;
}

.dark-table tfoot td {
  border: none !important;
}

.dark-input {
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
}

.dark-input:focus {
  background-color: #0f172a;
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25);
}

.dark-input::placeholder {
  color: #64748b;
}

.dark-modal {
  background-color: #1e293b;
  border: 1px solid #334155;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
