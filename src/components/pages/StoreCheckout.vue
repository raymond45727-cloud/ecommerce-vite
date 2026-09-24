<script setup>
import { computed, nextTick, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const cart = ref(JSON.parse(localStorage.getItem("atelier-cart") || "[]"));
const order = ref(null);
const isSubmitting = ref(false);
const isPaying = ref(false);
const submitError = ref("");
const paymentError = ref("");
const form = reactive({ name: "", email: "", phone: "", city: "", address: "", delivery: "home", payment: "cod", note: "" });
const errors = reactive({ name: "", email: "", phone: "", city: "", address: "" });
const subtotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const shipping = computed(() => subtotal.value >= 1500 ? 0 : form.delivery === "store" ? 60 : 80);
const total = computed(() => subtotal.value + shipping.value);
const apiPath = (path) => `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/${path}`;
const imageUrl = (url) => !url ? "" : url.startsWith("http") ? url : `https://images.unsplash.com/${url}?auto=format&fit=crop&w=220&q=80`;

const validators = {
  name: (value) => value.trim().length >= 2 ? "" : "請輸入至少 2 個字的收件人姓名。",
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "請輸入有效的 Email 地址。",
  phone: (value) => /^09\d{8}$/.test(value.replace(/[\s-]/g, "")) ? "" : "請輸入有效的台灣手機號碼，例如 0912345678。",
  city: (value) => value.trim() ? "" : "請填寫收件縣市。",
  address: (value) => value.trim().length >= 6 ? "" : "請填寫完整地址（至少 6 個字）。",
};
function validateField(field) {
  errors[field] = validators[field](form[field]);
  return !errors[field];
}
function clearFieldError(field) {
  if (errors[field]) validateField(field);
}
async function submitOrder() {
  submitError.value = "";
  if (!Object.keys(validators).map(validateField).every(Boolean)) {
    await nextTick();
    document.querySelector(".checkout-form input[aria-invalid='true']")?.focus();
    return;
  }
  isSubmitting.value = true;
  try {
    const message = [
      `配送方式：${form.delivery === "home" ? "宅配到府" : "超商取貨"}`,
      `付款方式：${form.payment === "cod" ? "貨到付款" : "銀行轉帳"}`,
      `運費：NT$ ${shipping.value}`,
      form.note && `備註：${form.note}`,
    ].filter(Boolean).join("；");
    const response = await axios.post(apiPath("order"), {
      data: { user: { name: form.name, email: form.email, tel: form.phone, address: `${form.city}${form.address}` }, message },
    });
    if (!response.data.success || !response.data.orderId) throw new Error(response.data.message || "訂單建立失敗，請確認購物車後再試一次。");
    let actualOrder = null;
    try {
      const result = await axios.get(apiPath(`order/${response.data.orderId}`));
      if (result.data.success) actualOrder = result.data.order;
    } catch {
      // Keep the API-created order confirmation even if the optional detail request fails.
    }
    order.value = { id: response.data.orderId, total: actualOrder?.total ?? response.data.total ?? subtotal.value, isPaid: actualOrder?.is_paid ?? false };
    localStorage.removeItem("atelier-cart");
    cart.value = [];
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    submitError.value = error.response?.data?.message || error.message || "訂單送出失敗，請稍後再試。";
  } finally {
    isSubmitting.value = false;
  }
}
async function payOrder() {
  if (!order.value?.id) return;
  isPaying.value = true;
  paymentError.value = "";
  try {
    const response = await axios.post(apiPath(`pay/${order.value.id}`));
    if (!response.data.success) throw new Error(response.data.message || "模擬付款失敗，請再試一次。");
    order.value.isPaid = true;
  } catch (error) {
    paymentError.value = error.response?.data?.message || error.message || "模擬付款失敗，請稍後再試。";
  } finally {
    isPaying.value = false;
  }
}
</script>

<template>
  <div class="checkout-page">
    <header class="checkout-header"><a class="checkout-brand" href="/ecommerce-vite/">NEXUS 裝備研究所 <small>GEAR UP · PLAY BETTER</small></a><a href="/ecommerce-vite/" class="back-link">← 返回裝備商店</a></header>
    <main class="checkout-main">
      <section v-if="order" class="success-card">
        <span class="success-icon">✳</span><p class="checkout-eyebrow">ORDER CONFIRMED</p>
        <h1>謝謝你，訂單成立了。</h1><p>我們已收到你的訂單，裝備準備完成後將盡快出貨。</p>
        <div class="order-number"><span>訂單編號</span><strong>{{ order.id }}</strong></div>
        <div class="success-total"><span>訂單金額</span><strong>NT$ {{ order.total.toLocaleString() }}</strong></div>
        <p class="payment-status" :class="{ paid: order.isPaid }">{{ order.isPaid ? "付款已完成" : "訂單已建立，尚未付款" }}</p>
        <p v-if="paymentError" class="form-error" role="alert">{{ paymentError }}</p>
        <button v-if="!order.isPaid" class="primary-button" :disabled="isPaying" @click="payOrder">{{ isPaying ? "付款處理中…" : "前往模擬付款" }} <span>→</span></button>
        <button v-else class="primary-button" @click="router.push('/')">回到首頁 <span>→</span></button>
      </section>
      <template v-else>
        <div class="checkout-title"><p class="checkout-eyebrow">A FEW DETAILS, THEN IT'S YOURS</p><h1>確認裝備訂單。</h1><p>確認收件與配送資訊，準備迎接你的新裝備。</p></div>
        <div v-if="cart.length" class="checkout-layout">
          <form class="checkout-form" novalidate @submit.prevent="submitOrder">
            <section class="form-section"><div class="form-heading"><span>01</span><h2>收件人資訊</h2></div><div class="form-grid">
              <label :class="{ invalid: errors.name }">姓名<input v-model.trim="form.name" autocomplete="name" placeholder="收件人姓名" :aria-invalid="!!errors.name" @blur="validateField('name')" @input="clearFieldError('name')" /><span v-if="errors.name" class="field-error">{{ errors.name }}</span></label>
              <label :class="{ invalid: errors.email }">Email<input v-model.trim="form.email" type="email" autocomplete="email" placeholder="example@email.com" :aria-invalid="!!errors.email" @blur="validateField('email')" @input="clearFieldError('email')" /><span v-if="errors.email" class="field-error">{{ errors.email }}</span></label>
              <label :class="{ invalid: errors.phone }">聯絡電話<input v-model.trim="form.phone" type="tel" autocomplete="tel" placeholder="09XX-XXX-XXX" :aria-invalid="!!errors.phone" @blur="validateField('phone')" @input="clearFieldError('phone')" /><span v-if="errors.phone" class="field-error">{{ errors.phone }}</span></label>
              <label :class="{ invalid: errors.city }">縣市<input v-model.trim="form.city" autocomplete="address-level1" placeholder="例如：台北市" :aria-invalid="!!errors.city" @blur="validateField('city')" @input="clearFieldError('city')" /><span v-if="errors.city" class="field-error">{{ errors.city }}</span></label>
              <label class="full-field" :class="{ invalid: errors.address }">收件地址<input v-model.trim="form.address" autocomplete="street-address" placeholder="請填寫完整地址" :aria-invalid="!!errors.address" @blur="validateField('address')" @input="clearFieldError('address')" /><span v-if="errors.address" class="field-error">{{ errors.address }}</span></label>
            </div></section>
            <section class="form-section"><div class="form-heading"><span>02</span><h2>配送方式</h2></div><div class="option-list">
              <label class="choice-card" :class="{ selected: form.delivery === 'home' }"><input v-model="form.delivery" type="radio" value="home" /><span><strong>宅配到府</strong><small>配送至指定地址，約 2–4 個工作天</small></span><b>{{ shipping === 0 ? "免運" : "NT$ 80" }}</b></label>
              <label class="choice-card" :class="{ selected: form.delivery === 'store' }"><input v-model="form.delivery" type="radio" value="store" /><span><strong>超商取貨</strong><small>取貨資訊將透過 Email 通知</small></span><b>{{ shipping === 0 ? "免運" : "NT$ 60" }}</b></label>
            </div></section>
            <section class="form-section"><div class="form-heading"><span>03</span><h2>付款方式</h2></div><div class="option-list">
              <label class="choice-card" :class="{ selected: form.payment === 'cod' }"><input v-model="form.payment" type="radio" value="cod" /><span><strong>貨到付款</strong><small>模擬訂單建立後可進行模擬付款</small></span></label>
              <label class="choice-card" :class="{ selected: form.payment === 'transfer' }"><input v-model="form.payment" type="radio" value="transfer" /><span><strong>銀行轉帳</strong><small>付款選項會記錄在訂單備註中</small></span></label>
            </div></section>
            <section class="form-section note-section"><label>訂單備註 <span>選填</span><textarea v-model.trim="form.note" rows="3" placeholder="有什麼想告訴我們的嗎？"></textarea></label></section>
            <p v-if="submitError" class="form-error" role="alert">{{ submitError }}</p>
            <button class="primary-button submit-button" type="submit" :disabled="isSubmitting">{{ isSubmitting ? "正在建立訂單…" : `確認訂單・NT$ ${total.toLocaleString()}` }} <span>→</span></button>
            <p class="secure-note">✳ &nbsp;送出訂單即代表你同意 NEXUS GEAR LAB 的購物須知。</p>
          </form>
          <aside class="order-summary"><p class="checkout-eyebrow">YOUR ORDER</p><h2>訂單摘要 <span>({{ cart.reduce((sum, item) => sum + item.quantity, 0) }} 件)</span></h2>
            <div class="summary-items"><article v-for="item in cart" :key="item.id" class="summary-item"><div class="summary-image"><img :src="imageUrl(item.image)" :alt="item.name" /><span>{{ item.quantity }}</span></div><div class="summary-item-copy"><strong>{{ item.name }}</strong><small>{{ item.category }}</small></div><b>NT$ {{ (item.price * item.quantity).toLocaleString() }}</b></article></div>
            <div class="summary-line"><span>商品小計</span><strong>NT$ {{ subtotal.toLocaleString() }}</strong></div><div class="summary-line"><span>運費</span><strong>{{ shipping === 0 ? "免運" : `NT$ ${shipping}` }}</strong></div><p class="shipping-hint">{{ shipping === 0 ? "已享有免運優惠" : `再消費 NT$ ${(1500 - subtotal).toLocaleString()} 即可享免運` }}</p><div class="summary-total"><span>應付總額</span><strong>NT$ {{ total.toLocaleString() }}</strong></div>
          </aside>
        </div>
        <div v-else class="empty-checkout"><span>✳</span><h2>裝備清單裡還沒有商品。</h2><p>先到商店挑選想升級的電競裝備。</p><button class="primary-button" @click="router.push('/')">回到裝備商店 <span>→</span></button></div>
      </template>
    </main>
    <footer class="checkout-footer">© 2025 NEXUS GEAR LAB <span>GEAR UP · PLAY BETTER.</span></footer>
  </div>
</template>

<style>
.checkout-page{--paper:#eee9e0;--muted:#aaa59a;--gold:#c7a77d;min-height:100vh;background:#141513;color:var(--paper);font:15px/1.65 'DM Sans','Noto Serif TC',sans-serif;letter-spacing:.035em}.checkout-page *{box-sizing:border-box}.checkout-header{height:78px;padding:0 max(calc((100vw - 1120px)/2),6%);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff20}.checkout-brand{color:var(--paper);font:600 17px 'Noto Serif TC',serif;text-decoration:none}.checkout-brand small{display:block;margin-top:4px;color:#858178;font:10px 'DM Sans',sans-serif;letter-spacing:.18em}.back-link{color:var(--muted);font-size:13px;text-decoration:none}.checkout-main{max-width:1120px;margin:auto;padding:64px 0 90px}.checkout-title{margin-bottom:38px}.checkout-eyebrow{font:11px 'DM Sans',sans-serif;letter-spacing:.22em;color:var(--gold);margin:0 0 12px}.checkout-title h1,.success-card h1{font:500 32px 'Noto Serif TC',serif;letter-spacing:.1em;margin:0}.checkout-title>p:last-child,.success-card>p:not(.checkout-eyebrow){color:var(--muted);font:14px/1.8 'Noto Serif TC',serif;margin:12px 0 0}.checkout-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:62px;align-items:start}.checkout-form{min-width:0}.form-section{padding:0 0 30px;margin-bottom:29px;border-bottom:1px solid #ffffff20}.form-heading{display:flex;align-items:center;gap:12px;margin-bottom:21px}.form-heading>span{color:var(--gold);font-size:12px}.form-heading h2,.order-summary h2{font:500 18px 'Noto Serif TC',serif;margin:0}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 16px}.form-grid label,.note-section label{display:grid;gap:8px;color:#d0cbc2;font-size:14px}.form-grid input,.note-section textarea{width:100%;background:#1d1e1b;color:var(--paper);border:1px solid #ffffff35;padding:13px 12px;font:14px/1.5 'DM Sans','Noto Serif TC',sans-serif;outline:none}.form-grid input:focus,.note-section textarea:focus{border-color:var(--gold)}.form-grid input::placeholder,.note-section textarea::placeholder{color:#8f8a80}.form-grid label.invalid input{border-color:#d87970}.field-error{color:#f0988d;font-size:12px;line-height:1.5}.full-field{grid-column:1/-1}.option-list{display:grid;gap:10px}.choice-card{display:flex;align-items:center;gap:13px;padding:15px;border:1px solid #ffffff30;cursor:pointer}.choice-card.selected{border-color:var(--gold)}.choice-card input{accent-color:var(--gold)}.choice-card>span{display:grid;gap:4px;flex:1}.choice-card strong{font-size:14px;font-weight:500}.choice-card small{font-size:12px;color:var(--muted)}.choice-card>b{font-size:13px;color:#d8c1a3;font-weight:500}.note-section label>span{color:#8f8a80;font-size:12px}.note-section textarea{resize:vertical}.primary-button{width:100%;padding:15px 18px;background:#c5a47d;color:#191815;border:0;font:500 14px 'DM Sans','Noto Serif TC',sans-serif;letter-spacing:.08em;cursor:pointer}.primary-button span{margin-left:16px}.primary-button:disabled{opacity:.6;cursor:wait}.secure-note{text-align:center;color:#858178;font-size:12px;margin-top:13px}.form-error{margin:0 0 14px;padding:12px;border:1px solid #d87970;color:#f0a29a;font-size:13px;line-height:1.6}.order-summary{position:sticky;top:22px;padding:25px;background:#1b1c1a;border:1px solid #ffffff20}.order-summary h2{margin-bottom:18px}.order-summary h2 span{font:12px 'DM Sans',sans-serif;color:var(--muted)}.summary-items{max-height:300px;overflow:auto}.summary-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #ffffff18}.summary-image{width:58px;height:68px;position:relative;flex:none}.summary-image img{width:100%;height:100%;object-fit:cover}.summary-image span{position:absolute;top:-6px;right:-6px;background:#c5a47d;color:#171612;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-size:11px}.summary-item-copy{flex:1;display:grid;gap:4px}.summary-item-copy strong{font:13px 'Noto Serif TC',serif;font-weight:500}.summary-item-copy small,.summary-item>b{font-size:12px;color:var(--muted)}.summary-item>b{color:#d8c1a3;white-space:nowrap}.summary-line{display:flex;justify-content:space-between;margin-top:17px;color:var(--muted);font-size:13px}.summary-line strong{color:var(--paper);font-weight:400}.shipping-hint{font-size:12px;color:#d0ad83;margin:10px 0 17px}.summary-total{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #ffffff28;padding-top:17px;font-size:14px}.summary-total strong{font:500 18px 'DM Sans',sans-serif;color:#d8c1a3}.empty-checkout,.success-card{max-width:640px;margin:65px auto;text-align:center;padding:48px 40px;background:#1b1c1a;border:1px solid #ffffff20}.success-icon,.empty-checkout>span{color:var(--gold);font-size:30px}.success-card h1{font-size:27px}.success-card>p:not(.checkout-eyebrow){margin-bottom:8px}.order-number,.success-total{display:flex;justify-content:space-between;padding:15px 0;border-bottom:1px solid #ffffff22;text-align:left;font-size:13px;color:var(--muted)}.order-number{margin-top:26px}.order-number strong,.success-total strong{color:#d8c1a3;font-weight:500}.payment-status{margin:18px 0 0;color:#e2b171;font-size:14px}.payment-status.paid{color:#9fc79b}.success-card .form-error{margin-top:14px}.success-card .primary-button{max-width:300px;margin-top:20px}.empty-checkout h2{font:19px 'Noto Serif TC',serif;margin:17px 0 8px}.empty-checkout p{font-size:14px;color:var(--muted);margin-bottom:25px}.empty-checkout .primary-button{max-width:280px}.checkout-footer{max-width:1120px;margin:auto;border-top:1px solid #ffffff20;padding:25px 0;display:flex;justify-content:space-between;color:#89847b;font-size:12px}.checkout-footer span{color:var(--muted)}
@media(max-width:900px){.checkout-main{padding:48px 5% 65px}.checkout-layout{grid-template-columns:minmax(0,1fr) 310px;gap:28px}.checkout-footer{margin:0 5%}}@media(max-width:650px){.checkout-header{height:68px;padding:0 5%}.checkout-brand{font-size:15px}.checkout-main{padding:38px 5% 55px}.checkout-title h1{font-size:27px}.checkout-layout{grid-template-columns:1fr;gap:28px}.order-summary{position:static;grid-row:1}.form-grid{grid-template-columns:1fr;gap:15px}.full-field{grid-column:auto}.form-section{margin-bottom:23px;padding-bottom:24px}.checkout-footer{display:grid;gap:8px}.empty-checkout,.success-card{padding:35px 20px;margin:35px auto}.success-card h1{font-size:22px}}
</style>

<style>
.checkout-page{--gold:#4deaff;--paper:#eaf4ff;--muted:#9aaac0;background:radial-gradient(ellipse at 78% 0%,#111a2c 0%,#090d15 45%,#07090e 100%);font-family:'DM Sans','Noto Sans TC',sans-serif}.checkout-header{background:#090c13d9;border-bottom-color:#4deaff32;backdrop-filter:blur(12px)}.checkout-brand{font-family:'DM Sans','Noto Sans TC',sans-serif;letter-spacing:.04em}.checkout-brand small{color:#6ceaff;letter-spacing:.18em}.back-link{color:#a7b7cc}.checkout-eyebrow{color:#58eaff}.checkout-title h1,.success-card h1{font-family:'DM Sans','Noto Sans TC',sans-serif;font-weight:750;letter-spacing:.03em}.form-section,.checkout-footer{border-color:#92b6d52c}.form-heading>span{color:#59eaff}.form-grid input,.note-section textarea{background:#101621;border-color:#7289a33a}.form-grid input:focus,.note-section textarea:focus{border-color:#4deaff;box-shadow:0 0 0 2px #4deaff1d}.choice-card{border-color:#7289a33a;background:#0d131e}.choice-card.selected{border-color:#4deaff;box-shadow:inset 0 0 16px #4deaff0b}.choice-card input{accent-color:#4deaff}.choice-card>b,.summary-total strong,.summary-item>b{color:#5ceaff}.order-summary,.success-card,.empty-checkout{background:linear-gradient(145deg,#111a27,#0b1018);border-color:#86a9ca35;box-shadow:0 15px 45px #0005}.summary-total{border-color:#7e9ab53a}.primary-button{background:linear-gradient(100deg,#4deaff,#a66cff);color:#071018;font-weight:700;clip-path:polygon(0 0,100% 0,100% 76%,96% 100%,0 100%);transition:filter .2s,transform .2s}.primary-button:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}.payment-status{color:#f5c268}.payment-status.paid{color:#91e6b5}.form-error{background:#2a131b;border-color:#ff6681;color:#ff9cab}.checkout-footer{color:#75869d}.checkout-footer span{color:#99aac0}
</style>
