<script setup>
import axios from "axios";
import { ref, onMounted, reactive, watch } from "vue";
import { Modal } from "bootstrap";
import { useRoute, useRouter } from "vue-router";
import Pagination from "../Pagination.vue";
import emitter from "../../methods/pushMessageState";
import currency from "../../filters/currency.js";

const route = useRoute();
const router = useRouter();
const products = ref([]);
const tempProduct = ref({
  imagesUrl: [],
});
const pagination = ref({});
const isNew = ref(false);
const isLoading = ref(false);
const modalRef = ref(null);
const delProductModalRef = ref(null);
const delModal = ref(null);
const fileInput = ref(null);
let myModal = null;

const status = reactive({
  fileUploading: false,
  loadingItem: "",
});

const getProducts = async (page = 1) => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/admin/products?page=${page}`;

  console.log("API網址為", api);

  isLoading.value = true;
  try {
    const response = await axios.get(api);

    console.log("API回傳結果:", response.data);
    if (response.data.success) {
      products.value = response.data.products;
      console.log("完整商品陣列:", response.data.products);
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.log("抓取產品失敗!", error);
  } finally {
    isLoading.value = false;
  }
};
const changePage = (page = 1) => {
  router.push({ query: { page } });
};

const updateProduct = async () => {
  let api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/admin/product`;
  let httpMethod = "post";

  if (!isNew.value) {
    api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/admin/product/${tempProduct.value.id}`;
    httpMethod = "put";
  }
  console.log("API網址為", api);

  isLoading.value = true;
  try {
    const response = await axios[httpMethod](api, { data: tempProduct.value });

    console.log("API回傳結果:", response.data);
    if (response.data.success) {
      myModal.hide();
      getProducts();
      emitter.emit("message:push", {
        message: response.data.message,
        status: "success",
      });
    } else {
      let errorMsg = Array.isArray(response.data.message)
        ? response.data.message.join("、")
        : response.data.message;

      errorMsg = errorMsg
        .replace("title", "標題")
        .replace("category", "分類")
        .replace("unit", "單位")
        .replace("origin_price", "原價")
        .replace("price", "售價")
        .replace(/欄位為必填/g, "為必填欄位");

      emitter.emit("message:push", {
        message: `新增失敗：${errorMsg}`,
        status: "danger",
      });
    }
  } catch (error) {
    emitter.emit("message:push", {
      message: error.response?.data?.message || "系統連線異常",
      status: "danger",
    });
  } finally {
    isLoading.value = false;
  }
};

const uploadFile = async () => {
  const uploadedFile = fileInput.value.files[0];

  if (!uploadedFile) return;

  const formData = new FormData();
  formData.append("file-to-upload", uploadedFile);

  status.fileUploading = true;

  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/admin/upload`;
  console.log("完整的上傳網址是：", api);
  try {
    const response = await axios.post(api, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success) {
      tempProduct.value.imageUrl = response.data.imageUrl;
      emitter.emit("message:push", {
        message: "圖片上傳成功",
        status: "success",
      });
    } else {
      emitter.emit("message:push", {
        message: response.data.message || "圖片上傳失敗",
        status: "danger",
      });
    }
  } catch (error) {
    console.dir(error);
    emitter.emit("message:push", {
      message: error.response?.data?.message || "圖片上傳連線異常",
      status: "danger",
    });
  } finally {
    status.fileUploading = false;
  }
};

const openModal = (isNewParam, item) => {
  if (isNewParam) {
    tempProduct.value = {};
  } else {
    tempProduct.value = { ...item };
  }
  isNew.value = isNewParam;
  myModal.show();
};

const openDelModal = (item) => {
  tempProduct.value = { ...item };

  delModal.value.show();
};

const delProduct = async () => {
  const api = `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/admin/product/${tempProduct.value.id}`;

  try {
    const response = await axios.delete(api);

    if (response.data.success) {
      alert(response.data.message);

      delModal.value.hide();

      getProducts();
    } else {
      alert(response.data.message);
      delModal.value.hide();
    }
  } catch (err) {
    console.dir(err);
  }
};
onMounted(() => {
  myModal = new Modal(modalRef.value);
  delModal.value = new Modal(delProductModalRef.value);
  watch(
    () => route.query.page,
    (newPage) => {
      getProducts(newPage || 1);
    },
    { immediate: true },
  );
});
</script>

<template>
  <div class="w-100">
    <VueLoading :active="isLoading" />

    
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold text-light mb-1">產品管理</h3>
        <p class="text-secondary small mb-0">管理系統內的商品資料與架上狀態</p>
      </div>
      <div>
        <button
          class="btn btn-primary-custom px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
          type="button"
          @click="openModal(true)"
        >
          <i class="fas fa-plus"></i>
          <span>建立新產品</span>
        </button>
      </div>
    </div>

    
    <div
      class="card dark-card border-0 shadow-lg rounded-4 overflow-hidden mb-4"
    >
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th width="120" class="ps-4">分類</th>
              <th>產品名稱</th>
              <th width="120" class="text-end">原價</th>
              <th width="120" class="text-end">售價</th>
              <th width="120" class="text-center">狀態</th>
              <th width="140" class="text-center pe-4">編輯</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in products" :key="item.id">
              <td class="ps-4">
                <span
                  class="badge bg-secondary bg-opacity-25 text-light fw-normal"
                  >{{ item.category }}</span
                >
              </td>
              <td class="fw-medium text-light">{{ item.title }}</td>
              <td class="text-end text-secondary text-decoration-line-through">
                {{ currency(item.origin_price) }}
              </td>
              <td class="text-end text-primary-glow fw-bold">
                {{ currency(item.price) }}
              </td>
              <td class="text-center">
                <span
                  class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-3 py-2"
                  v-if="item.is_enabled"
                  >啟用</span
                >
                <span
                  class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary border-opacity-25 px-3 py-2"
                  v-else
                  >未啟用</span
                >
              </td>
              <td class="text-center pe-4">
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-light border-secondary-subtle"
                    @click="openModal(false, item)"
                  >
                    編輯
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="openDelModal(item)"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

   
    <div class="d-flex justify-content-center">
      <Pagination :pages="pagination" @change-page="changePage" />
    </div>

    <div
  class="modal fade"
  id="productModal"
  ref="modalRef"
  tabindex="-1"
  aria-hidden="true"
>
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content dark-modal border-0 shadow-lg rounded-4 overflow-hidden">
      <div class="modal-header border-secondary border-opacity-25 bg-slate-900 py-3 px-4">
        <h5 class="modal-title fw-bold text-light d-flex align-items-center gap-2">
          <i class="bi bi-box-seam text-primary-glow"></i>
          <span>{{ isNew ? '新增產品' : '編輯產品' }}</span>
        </h5>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>

      <div class="modal-body p-4 text-light">
        <div class="row g-4">
          
          <div class="col-sm-4">
            <div class="mb-3">
              <label for="image" class="form-label small text-secondary">輸入圖片網址</label>
              <input
                type="text"
                class="form-control dark-input"
                id="image"
                placeholder="請輸入圖片連結"
                v-model="tempProduct.imageUrl"
              />
            </div>
            <div class="mb-3">
              <label for="customFile" class="form-label small text-secondary d-flex justify-content-between">
                <span>或 上傳圖片</span>
                <i class="fas fa-spinner fa-spin text-primary-glow" v-if="status.fileUploading"></i>
              </label>
              <input
                type="file"
                id="customFile"
                class="form-control dark-input"
                ref="fileInput"
                @change="uploadFile"
              />
            </div>

            
            <div class="image-preview-box rounded-3 overflow-hidden border border-secondary border-opacity-25 d-flex align-items-center justify-content-center bg-dark mt-3" style="min-height: 180px;">
              <img
                v-if="tempProduct.imageUrl"
                :src="tempProduct.imageUrl"
                class="img-fluid object-fit-cover w-100 h-100"
                alt="產品圖片"
              />
              <span v-else class="text-secondary small">無圖片預覽</span>
            </div>
          </div>

          
          <div class="col-sm-8">
            <div class="mb-3">
              <label for="title" class="form-label small text-secondary">標題</label>
              <input
                type="text"
                class="form-control dark-input"
                id="title"
                placeholder="請輸入標題"
                v-model="tempProduct.title"
              />
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="category" class="form-label small text-secondary">分類</label>
                <input
                  type="text"
                  class="form-control dark-input"
                  id="category"
                  placeholder="請輸入分類"
                  v-model="tempProduct.category"
                />
              </div>
              <div class="col-md-6">
                <label for="unit" class="form-label small text-secondary">單位</label>
                <input
                  type="text"
                  class="form-control dark-input"
                  id="unit"
                  placeholder="請輸入單位"
                  v-model="tempProduct.unit"
                />
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label for="origin_price" class="form-label small text-secondary">原價</label>
                <input
                  type="number"
                  class="form-control dark-input"
                  id="origin_price"
                  placeholder="請輸入原價"
                  v-model.number="tempProduct.origin_price"
                />
              </div>
              <div class="col-md-6">
                <label for="price" class="form-label small text-secondary">售價</label>
                <input
                  type="number"
                  class="form-control dark-input"
                  id="price"
                  placeholder="請輸入售價"
                  v-model.number="tempProduct.price"
                />
              </div>
            </div>

            <hr class="border-secondary border-opacity-25 my-4" />

            <div class="mb-3">
              <label for="description" class="form-label small text-secondary">產品描述</label>
              <textarea
                class="form-control dark-input"
                id="description"
                rows="2"
                placeholder="請輸入產品描述"
                v-model="tempProduct.description"
              ></textarea>
            </div>
            <div class="mb-3">
              <label for="content" class="form-label small text-secondary">說明內容</label>
              <textarea
                class="form-control dark-input"
                id="content"
                rows="2"
                placeholder="請輸入產品說明內容"
                v-model="tempProduct.content"
              ></textarea>
            </div>
            <div class="mb-3">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="is_enabled"
                  v-model="tempProduct.is_enabled"
                  :true-value="1"
                  :false-value="0"
                />
                <label class="form-check-label text-light small" for="is_enabled">是否啟用商品</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer border-secondary border-opacity-25 bg-slate-900 px-4 py-3">
        <button
          type="button"
          class="btn btn-outline-secondary px-4 rounded-3"
          data-bs-dismiss="modal"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary-custom px-4 rounded-3"
          @click="updateProduct"
        >
          確認儲存
        </button>
      </div>
    </div>
  </div>
</div>


<div
  class="modal fade"
  id="delProductModal"
  ref="delProductModalRef"
  tabindex="-1"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content dark-modal border-0 shadow-lg rounded-4 overflow-hidden">
      <div class="modal-header border-0 bg-danger bg-opacity-10 py-3 px-4">
        <h5 class="modal-title fw-bold text-danger d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>刪除產品確認</span>
        </h5>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div class="modal-body p-4 text-light">
        是否確定要刪除
        <strong class="text-danger fs-5 mx-1">{{ tempProduct?.title }}</strong>
        ？
        <p class="text-secondary small mb-0 mt-2">此動作無法復原，請確認是否繼續。</p>
      </div>
      <div class="modal-footer border-0 px-4 py-3">
        <button
          type="button"
          class="btn btn-outline-secondary px-4 rounded-3"
          data-bs-dismiss="modal"
        >
          取消
        </button>
        <button type="button" class="btn btn-danger px-4 rounded-3 shadow-sm" @click="delProduct">
          確認刪除
        </button>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<style scoped>
.dark-card {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.table-dark {
  --bs-table-bg: #1e293b;
  --bs-table-hover-bg: #334155;
  color: #94a3b8;
}

.table-dark th {
  background-color: #0f172a;
  color: #cbd5e1;
  font-weight: 600;
  border-bottom: 1px solid #334155;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.table-dark td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.text-primary-glow {
  color: #818cf8;
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

.dark-modal {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}


.dark-input {
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
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


.image-preview-box img {
  object-fit: cover;
}
</style>
