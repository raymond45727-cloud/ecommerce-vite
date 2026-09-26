<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const productAccents = ["#4deaff", "#a56bff", "#43d8b5", "#ff557a"];
const products = ref([]);
const allCategory = "全部商品";
const categories = computed(() => [allCategory, ...new Set(products.value.map((item) => item.category).filter(Boolean))]);
const activeCategory = ref(allCategory);
const search = ref("");
const cartOpen = ref(false);
const notice = ref("");
const cart = ref([]);
const apiError = ref("");
const visibleProducts = computed(() => products.value.filter((product) =>
  (activeCategory.value === allCategory || product.category === activeCategory.value) &&
  product.name.toLowerCase().includes(search.value.trim().toLowerCase()),
));
const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const apiPath = (path) => `${import.meta.env.VITE_APP_URL}/api/${import.meta.env.VITE_APP_PATH}/${path}`;
function showNotice(message) {
  notice.value = message;
  window.setTimeout(() => (notice.value = ""), 2600);
}
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function loadProducts() {
  try {
    const first = await axios.get(apiPath("products?page=1"));
    if (!first.data.success) throw new Error(first.data.message || "商品載入失敗");
    let allProducts = [...first.data.products];
    for (let page = 2; page <= (first.data.pagination?.total_pages || 1); page += 1) {
      const response = await axios.get(apiPath(`products?page=${page}`));
      if (response.data.success) allProducts.push(...response.data.products);
    }
    products.value = allProducts
      .filter((item) => item.is_enabled === undefined || Number(item.is_enabled) === 1)
      .map((item, index) => ({
      id: item.id,
      name: item.title,
      category: item.category || "其他裝備",
      price: item.price,
      original: item.origin_price || item.price,
      tag: index < 2 ? "競技裝備" : "玩家精選",
      color: productAccents[index % productAccents.length],
      image: item.imageUrl || item.imagesUrl?.[0] || "",
        product: item,
      }));
    if (activeCategory.value !== allCategory && !categories.value.includes(activeCategory.value)) activeCategory.value = allCategory;
    apiError.value = "";
    await loadCart();
  } catch (error) {
    products.value = [];
    apiError.value = error.response?.data?.message || error.message || "暫時無法連線到商品服務";
    showNotice(`商品服務連線失敗：${apiError.value}`);
  }
}
async function loadCart() {
  try {
    const response = await axios.get(apiPath("cart"));
    if (!response.data.success) throw new Error(response.data.message || "購物車載入失敗");
    const rows = response.data.data?.carts || [];
    cart.value = rows.map((row) => ({
      id: row.product.id,
      cartId: row.id,
      name: row.product.title,
      category: row.product.category,
      price: row.product.price,
      image: row.product.imageUrl || row.product.imagesUrl?.[0] || "",
      quantity: row.qty,
    }));
    apiError.value = "";
  } catch (error) {
    apiError.value = error.response?.data?.message || error.message || "暫時無法連線到購物車服務";
    showNotice(`購物車服務連線失敗：${apiError.value}`);
  }
}
async function addToCart(product) {
  if (apiError.value) return showNotice("目前無法連線到商店服務，請稍後再試。");
  try {
    const response = await axios.post(apiPath("cart"), { data: { product_id: product.id, qty: 1 } });
    if (!response.data.success) throw new Error(response.data.message || "加入購物車失敗");
    await loadCart();
    showNotice(`${product.name} 已加入購物袋`);
  } catch (error) {
    showNotice(error.response?.data?.message || error.message || "加入購物袋失敗");
  }
}
async function changeQuantity(item, amount) {
  const quantity = item.quantity + amount;
  try {
    const response = quantity <= 0
      ? await axios.delete(apiPath(`cart/${item.cartId}`))
      : await axios.put(apiPath(`cart/${item.cartId}`), { data: { product_id: item.id, qty: quantity } });
    if (!response.data.success) throw new Error(response.data.message || "更新購物車失敗");
    await loadCart();
  } catch (error) {
    showNotice(error.response?.data?.message || "更新購物車失敗");
  }
}
const imageUrl = (id, width = 700) => !id ? "" : id.startsWith("http") ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
onMounted(() => {
  loadProducts();
  window.addEventListener("focus", loadProducts);
});
onUnmounted(() => window.removeEventListener("focus", loadProducts));
</script>

<template>
  <div class="storefront">
    <div class="announcement">GEAR UP YOUR GAME <strong>HELLO10</strong> 新會員首購折 $100 <span>✦</span> 滿 $1,500 免運</div>
    <header class="store-header">
      <a class="brand" href="#top" aria-label="NEXUS 電競裝備首頁"><span class="brand-mark">N</span><span>NEXUS 裝備研究所<small>GEAR UP · PLAY BETTER</small></span></a>
      <nav class="main-nav" aria-label="主要導覽"><a href="#shop" @click.prevent="scrollToSection('shop')">探索裝備</a><a href="#story" @click.prevent="scrollToSection('story')">裝備優勢</a><a href="#footer" @click.prevent="scrollToSection('footer')">聯絡我們</a></nav>
      <div class="header-actions"><label class="search-box"><span>⌕</span><input v-model="search" placeholder="搜尋裝備、品牌…" aria-label="搜尋裝備"></label><button class="bag-button" @click="cartOpen = true" aria-label="開啟購物袋">裝備清單 <span>{{ cartCount }}</span></button></div>
    </header>

    <main id="top">
      <section class="hero">
        <img class="hero-image" :src="imageUrl('photo-1542751371-adc38448a05e', 2000)" alt="電競賽事舞台與沉浸式燈光" />
        <div class="hero-shade"></div><div class="hero-content"><p class="eyebrow">PRECISION GEAR · PLAY WITHOUT LIMITS</p><h1>進入你的<br /><em>主場領域。</em></h1><p class="hero-copy">為每一次操作、每一場勝利，打造更好的裝備。<br />探索精選電競周邊，升級你的遊戲體驗。</p><a class="hero-cta" href="#shop">探索裝備 <span>↗</span></a></div>
        <div class="hero-note"><span>RGB READY</span><i></i> GEAR UP · PLAY BETTER</div>
      </section>

      <section class="value-strip" id="story"><div><span>⌁</span><p><strong>精選電競裝備</strong><small>鍵鼠周邊，一站升級</small></p></div><div><span>◉</span><p><strong>安心配送</strong><small>滿 $1,500 即享免運</small></p></div><div><span>↺</span><p><strong>七日鑑賞</strong><small>支援退換，選購放心</small></p></div><div><span>⌘</span><p><strong>為玩家而生</strong><small>專注操作與遊戲體驗</small></p></div></section>

      <section class="shop-section" id="shop"><div class="section-heading"><div><p class="eyebrow">GEAR UP · STAY SHARP</p><h2>為你的<span>勝利裝備。</span></h2><p class="section-desc">從桌面到賽場，找到讓操作更到位的裝備。</p></div><a href="#shop" class="all-link">探索全部裝備 <span>→</span></a></div>
        <div class="shop-toolbar"><div class="category-tabs"><button v-for="category in categories" :key="category" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button></div><span class="result-count">{{ visibleProducts.length }} 件裝備</span></div>
        <div v-if="visibleProducts.length" class="product-grid"><article v-for="(product, index) in visibleProducts" :key="product.id" class="product-card" :style="{ '--delay': `${index * 55}ms` }"><div class="product-image-wrap" :style="{ backgroundColor: product.color + '22' }"><img :src="imageUrl(product.image)" :alt="product.name" loading="lazy" /><span class="product-tag">{{ product.tag }}</span><button class="quick-add" @click="addToCart(product)">＋ 加入購物袋</button></div><div class="product-info"><div><span class="product-category">{{ product.category }}</span><h3>{{ product.name }}</h3></div><div class="product-price"><strong>NT$ {{ product.price.toLocaleString() }}</strong><del>{{ product.original.toLocaleString() }}</del></div></div></article></div>
        <div v-else class="empty-state"><template v-if="apiError">{{ apiError }}<br /><button class="reload-products" @click="loadProducts">重新載入商品</button></template><template v-else>找不到符合的裝備，試試其他關鍵字或分類。</template></div>
        <div class="collection-note"><span>✳</span><p>ENGINEERED FOR YOUR NEXT VICTORY.</p><span>✳</span></div>
      </section>
      <section class="newsletter"><div><p class="eyebrow">JOIN THE NEXT LEVEL</p><h2>掌握新品與裝備情報。</h2><p>訂閱電競裝備快訊，優先收到新品上市與限時優惠。</p></div><form @submit.prevent="notice = '已加入裝備情報名單！'"><input type="email" required placeholder="你的 Email 地址" aria-label="Email 地址" /><button type="submit">訂閱情報 <span>→</span></button></form></section>
    </main>
    <footer id="footer" class="store-footer"><a class="brand footer-brand" href="#top"><span class="brand-mark">N</span><span>NEXUS 裝備研究所<small>GEAR UP · PLAY BETTER</small></span></a><p>精準操控，穩定輸出。<br />準備好迎接下一場勝利。</p><span>© 2025 NEXUS GEAR LAB</span></footer>

    <Transition name="toast"><div v-if="notice" class="toast-message">✳ &nbsp;{{ notice }}</div></Transition>
    <Transition name="fade"><div v-if="cartOpen" class="drawer-backdrop" @click.self="cartOpen = false"><aside class="cart-drawer"><div class="drawer-heading"><div><p class="eyebrow">YOUR LOADOUT</p><h2>裝備清單 <span>({{ cartCount }})</span></h2></div><button class="close-button" @click="cartOpen = false" aria-label="關閉裝備清單">×</button></div><div v-if="cart.length" class="cart-items"><article v-for="item in cart" :key="item.id" class="cart-item"><img :src="imageUrl(item.image, 220)" :alt="item.name" /><div class="cart-item-copy"><span>{{ item.category }}</span><h3>{{ item.name }}</h3><strong>NT$ {{ (item.price * item.quantity).toLocaleString() }}</strong><div class="quantity"><button @click="changeQuantity(item, -1)">−</button><span>{{ item.quantity }}</span><button @click="changeQuantity(item, 1)">＋</button></div></div></article></div><div v-else class="cart-empty"><span>✳</span><p>裝備清單還是空的。<br />挑選合適裝備，升級你的遊戲體驗。</p><button @click="cartOpen = false">探索電競裝備 →</button></div><div v-if="cart.length" class="cart-summary"><div><span>小計</span><strong>NT$ {{ cartTotal.toLocaleString() }}</strong></div><small>滿 $1,500 即享免運</small><button @click="router.push('/checkout')">前往結帳 <span>→</span></button></div></aside></div></Transition>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap');
.storefront{--ink:#eee9e0;--muted:#a9a398;--dim:#77746d;--panel:#1b1c1a;--line:#ffffff18;--accent:#c7a77d;background:#141513;color:var(--ink);min-height:100vh;font-family:'DM Sans','Noto Serif TC',sans-serif;font-size:14px;letter-spacing:.035em}.storefront *{box-sizing:border-box}.storefront a{color:inherit;text-decoration:none}.announcement{height:34px;background:#a88c6d;color:#181713;text-align:center;font-size:11px;letter-spacing:.09em;display:flex;align-items:center;justify-content:center;gap:8px}.announcement strong{font-weight:700}.announcement span{opacity:.5;margin:0 5px}.store-header{height:84px;padding:0 max(calc((100vw - 1240px)/2),6.2vw);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);gap:32px}.brand{display:flex;align-items:center;gap:11px;font-family:'Noto Serif TC',serif;font-size:16px;font-weight:600;white-space:nowrap}.brand-mark{width:35px;height:35px;border:1px solid #c7a77d80;color:var(--accent);display:grid;place-items:center;font-size:18px;font-weight:400}.brand small{display:block;font:8px 'DM Sans',sans-serif;letter-spacing:.18em;color:var(--dim);margin-top:2px}.main-nav{display:flex;gap:37px;color:#c2beb5;font-size:12px}.main-nav a{transition:color .2s}.main-nav a:hover{color:var(--accent)}.header-actions{display:flex;align-items:center;gap:26px}.search-box{border-bottom:1px solid #ffffff35;padding:7px 0;display:flex;gap:9px;align-items:center;color:var(--muted)}.search-box span{font-size:20px}.search-box input{width:150px;border:0;outline:none;background:transparent;color:var(--ink);font:11px inherit}.search-box input::placeholder{color:#85827a}.bag-button{border:0;background:none;color:var(--ink);font:11px inherit;cursor:pointer;white-space:nowrap}.bag-button span{margin-left:6px;background:#a88c6d;color:#191815;width:22px;height:22px;display:inline-grid;place-items:center;border-radius:50%;font-size:10px}.hero{height:585px;position:relative;overflow:hidden}.hero-image,.hero-shade{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.hero-image{object-position:center 52%;filter:saturate(.66)}.hero-shade{background:linear-gradient(90deg,rgba(15,16,14,.89) 0%,rgba(15,16,14,.72) 40%,rgba(15,16,14,.1) 100%),linear-gradient(0deg,rgba(15,16,14,.36),transparent 24%)}.hero-content{position:absolute;top:50%;left:max(calc((100vw - 1130px)/2),11%);transform:translateY(-48%)}.eyebrow{font:9px 'DM Sans',sans-serif;letter-spacing:.23em;color:var(--accent);margin:0 0 18px}.hero h1{font:500 clamp(42px,5vw,68px)/1.34 'Noto Serif TC',serif;letter-spacing:.08em;color:#f3eee5;margin:0 0 19px}.hero h1 em{font-style:normal;color:#d0b18a}.hero-copy{font:12px/2 'Noto Serif TC',serif;color:#c9c3b9;letter-spacing:.1em}.hero-cta{display:inline-flex;gap:40px;align-items:center;margin-top:31px;padding:14px 19px;border:1px solid #d0b18a80;color:#eee9e0;font-size:11px;letter-spacing:.1em;transition:.2s}.hero-cta:hover{background:#c7a77d;color:#171713}.hero-cta span{font-size:16px}.hero-note{position:absolute;right:max(calc((100vw - 1200px)/2),7%);bottom:32px;display:flex;align-items:center;gap:12px;color:#c5bfb4;font:9px 'DM Sans',sans-serif;letter-spacing:.17em}.hero-note span{color:var(--accent)}.hero-note i{width:50px;border-top:1px solid #c7a77d}.value-strip{max-width:1120px;margin:auto;min-height:122px;display:grid;grid-template-columns:repeat(4,1fr);align-items:center;border-bottom:1px solid var(--line)}.value-strip>div{display:flex;align-items:center;justify-content:center;gap:14px;border-right:1px solid var(--line)}.value-strip>div:last-child{border:0}.value-strip>div>span{font-size:20px;color:var(--accent)}.value-strip p{display:grid;gap:6px;margin:0}.value-strip strong{font:12px 'Noto Serif TC',serif;font-weight:500}.value-strip small{font-size:9px;color:var(--dim)}.shop-section{max-width:1120px;margin:0 auto;padding:100px 0 84px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:42px}.section-heading .eyebrow{margin-bottom:14px}.section-heading h2,.newsletter h2{font:500 31px 'Noto Serif TC',serif;letter-spacing:.12em;margin:0;color:#eee9e0}.section-heading h2 span{color:#c8aa85}.section-desc{color:var(--muted);font:11px 'Noto Serif TC',serif;letter-spacing:.08em;margin-top:12px}.all-link{font-size:10px;color:#c8aa85;padding-bottom:6px}.all-link span{margin-left:18px}.shop-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.category-tabs{display:flex;gap:24px}.category-tabs button{border:0;background:none;color:#88857c;padding:0 0 8px;font:11px inherit;cursor:pointer;position:relative}.category-tabs button.active,.category-tabs button:hover{color:#e7d5bd}.category-tabs button.active:after{position:absolute;content:'';bottom:0;left:0;right:0;border-bottom:1px solid #c7a77d}.result-count{font-size:10px;color:#77746d}.product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:38px 22px}.product-card{animation:rise .45s both;animation-delay:var(--delay)}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.product-image-wrap{position:relative;overflow:hidden;aspect-ratio: .88;background:#242522}.product-image-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.7,.2,1),opacity .3s;filter:saturate(.82)}.product-card:hover .product-image-wrap img{transform:scale(1.045);opacity:.76}.product-tag{position:absolute;left:13px;top:13px;padding:6px 9px;background:#171815d9;color:#dfc5a3;font-size:9px;letter-spacing:.08em}.quick-add{position:absolute;bottom:13px;left:13px;right:13px;height:39px;border:1px solid #eee9e077;background:#171815db;color:#f0ece4;cursor:pointer;font:10px inherit;letter-spacing:.08em;transform:translateY(9px);opacity:0;transition:.2s}.product-card:hover .quick-add,.quick-add:focus{transform:translateY(0);opacity:1}.product-info{padding:15px 1px 0;display:flex;justify-content:space-between;gap:8px}.product-category{font-size:9px;color:#928b80;letter-spacing:.1em}.product-info h3{font:12px 'Noto Serif TC',serif;font-weight:500;letter-spacing:.06em;margin:6px 0 0;color:#e5e0d7}.product-price{text-align:right;white-space:nowrap;display:grid;align-content:start;gap:6px}.product-price strong{font:11px 'DM Sans',sans-serif;color:#d8c1a3;font-weight:500}.product-price del{font-size:9px;color:#716f68}.empty-state{padding:70px 0;text-align:center;color:var(--muted)}.collection-note{display:flex;justify-content:center;align-items:center;gap:18px;margin-top:69px;color:#aaa397}.collection-note p{font:11px 'Noto Serif TC',serif;letter-spacing:.11em}.collection-note span{color:#c7a77d;font-size:11px}.newsletter{background:#1e201d;padding:49px max(calc((100vw - 1120px)/2),8vw);display:flex;align-items:center;justify-content:space-between;gap:40px}.newsletter .eyebrow{margin-bottom:12px}.newsletter h2{font-size:22px}.newsletter p:not(.eyebrow){font-size:10px;color:#a39e93;margin-top:11px}.newsletter form{display:flex;border-bottom:1px solid #777268;min-width:350px}.newsletter input{background:none;border:0;outline:none;color:var(--ink);padding:13px 3px;font:10px inherit;flex:1}.newsletter input::placeholder{color:#88847c}.newsletter form button{border:0;background:transparent;color:#d1b18a;font:10px inherit;cursor:pointer}.newsletter form button span{margin-left:18px}.store-footer{max-width:1120px;margin:auto;padding:46px 0 28px;display:grid;grid-template-columns:1fr 1.2fr auto;align-items:center;gap:30px}.footer-brand{width:max-content}.store-footer>p{font:10px/1.9 'Noto Serif TC',serif;color:#9e998f}.store-footer>span{font-size:9px;color:#77746d}.toast-message{position:fixed;z-index:15;bottom:26px;left:50%;transform:translateX(-50%);background:#e2d2ba;color:#201e19;padding:14px 24px;box-shadow:0 8px 35px #0008;font:11px 'Noto Serif TC',serif;white-space:nowrap}.toast-enter-active,.toast-leave-active,.fade-enter-active,.fade-leave-active{transition:opacity .2s}.toast-enter-from,.toast-leave-to,.fade-enter-from,.fade-leave-to{opacity:0}.drawer-backdrop{position:fixed;z-index:20;inset:0;background:#0009;display:flex;justify-content:flex-end}.cart-drawer{width:min(440px,100%);height:100%;background:#1a1b19;padding:30px;display:flex;flex-direction:column;box-shadow:-15px 0 55px #0005}.drawer-heading{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:20px}.drawer-heading .eyebrow{margin-bottom:8px}.drawer-heading h2{font:20px 'Noto Serif TC',serif;margin:0;color:var(--ink)}.drawer-heading h2 span{font:12px 'DM Sans',sans-serif;color:var(--muted)}.close-button{border:0;background:transparent;color:var(--ink);font:28px sans-serif;cursor:pointer}.cart-items{overflow:auto;flex:1}.cart-item{display:flex;gap:17px;padding:19px 0;border-bottom:1px solid var(--line)}.cart-item img{width:92px;height:110px;object-fit:cover}.cart-item-copy{flex:1}.cart-item-copy>span{font-size:9px;color:var(--muted)}.cart-item-copy h3{font:12px 'Noto Serif TC',serif;margin:6px 0 10px}.cart-item-copy>strong{font:11px 'DM Sans',sans-serif;color:#d8c1a3}.quantity{display:flex;align-items:center;gap:15px;margin-top:10px;color:var(--ink)}.quantity button{width:23px;height:23px;background:transparent;border:1px solid #ffffff35;color:var(--ink);cursor:pointer}.quantity span{font-size:10px}.cart-summary{border-top:1px solid var(--line);padding-top:18px}.cart-summary>div{display:flex;justify-content:space-between;font-size:12px}.cart-summary>div strong{color:#d8c1a3;font-weight:500}.cart-summary>small{display:block;color:var(--muted);font-size:9px;margin-top:9px}.cart-summary>button,.cart-empty button{margin-top:18px;width:100%;padding:14px;border:0;background:#c5a47d;color:#1a1916;font:11px inherit;cursor:pointer}.cart-summary>button span{margin-left:22px}.cart-empty{flex:1;display:grid;place-content:center;text-align:center;justify-items:center;color:var(--muted);font:12px/1.9 'Noto Serif TC',serif}.cart-empty>span{font-size:28px;color:var(--accent)}
@media(max-width:900px){.store-header{padding:0 5%;gap:18px}.main-nav{gap:17px}.search-box input{width:105px}.shop-section{padding:76px 5%}.value-strip{margin:0 5%}.newsletter{padding:42px 5%}.store-footer{padding:40px 5% 25px}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 16px}.hero-content{left:9%}}
@media(max-width:620px){.announcement{font-size:9px}.store-header{height:70px;padding:0 5%;gap:8px}.brand{font-size:13px;gap:7px}.brand-mark{width:30px;height:30px;font-size:15px}.brand small{font-size:7px}.main-nav{display:none}.header-actions{gap:12px}.search-box input{width:90px;font-size:9px}.bag-button{font-size:10px}.hero{height:510px}.hero-image{object-position:60% center}.hero-shade{background:linear-gradient(90deg,#0f100ee8,#0f100e88 70%,#0f100e33)}.hero-content{left:7%;right:6%}.hero h1{font-size:43px}.hero-copy{font-size:10px}.hero-note{right:7%;font-size:8px}.value-strip{grid-template-columns:repeat(2,1fr);padding:13px 0}.value-strip>div{justify-content:flex-start;padding:15px 8px;border-right:0}.value-strip>div:nth-child(odd){border-right:1px solid var(--line)}.value-strip>div:nth-child(-n+2){border-bottom:1px solid var(--line)}.value-strip>div>span{font-size:17px}.value-strip small{font-size:8px}.shop-section{padding:64px 5%}.section-heading{align-items:flex-start}.section-heading h2{font-size:26px}.section-desc{font-size:9px}.all-link{font-size:9px;white-space:nowrap;margin-top:37px}.shop-toolbar{align-items:flex-end}.category-tabs{gap:14px;flex-wrap:wrap}.category-tabs button{font-size:10px}.result-count{font-size:8px;white-space:nowrap;padding-bottom:8px}.product-grid{gap:26px 11px}.product-info{display:block}.product-info h3{font-size:11px}.product-price{display:flex;gap:7px;align-items:center;text-align:left;margin-top:8px}.product-price strong{font-size:10px}.product-price del{font-size:8px}.product-tag{left:8px;top:8px;font-size:8px}.quick-add{opacity:1;transform:none;left:7px;right:7px;bottom:7px;height:32px;font-size:9px}.collection-note{gap:8px;margin-top:46px}.collection-note p{font-size:9px}.newsletter{display:block;padding:37px 6%}.newsletter h2{font-size:19px}.newsletter form{min-width:0;margin-top:20px}.store-footer{grid-template-columns:1fr 1fr;gap:19px 10px}.store-footer>span{grid-column:1/-1}.cart-drawer{padding:22px}.toast-message{max-width:90vw;font-size:10px;text-align:center;white-space:normal}}
/* Readability: raise small interface text while keeping the visual hierarchy. */
.storefront .announcement{font-size:13px}.storefront .brand small{font-size:10px}.storefront .main-nav{font-size:14px}.storefront .search-box input,.storefront .bag-button{font-size:13px}.storefront .hero-copy{font-size:14px;line-height:2.1}.storefront .hero-cta{font-size:13px}.storefront .hero-note{font-size:11px}.storefront .value-strip strong{font-size:14px}.storefront .value-strip small{font-size:12px}.storefront .eyebrow{font-size:11px}.storefront .section-desc{font-size:13px}.storefront .all-link,.storefront .category-tabs button{font-size:12px}.storefront .result-count{font-size:12px}.storefront .product-tag{font-size:11px}.storefront .product-category{font-size:11px}.storefront .product-info h3{font-size:14px;line-height:1.6}.storefront .product-price strong{font-size:13px}.storefront .product-price del{font-size:11px}.storefront .quick-add{font-size:12px}.storefront .collection-note p{font-size:13px}.storefront .newsletter p:not(.eyebrow){font-size:12px}.storefront .newsletter input,.storefront .newsletter form button{font-size:12px}.storefront .store-footer>p{font-size:12px}.storefront .store-footer>span{font-size:11px}.storefront .cart-item-copy>span,.storefront .cart-item-copy>strong,.storefront .cart-summary>div,.storefront .cart-summary>button{font-size:13px}.storefront .cart-item-copy h3{font-size:14px}.storefront .quantity span{font-size:12px}.storefront .cart-summary>small{font-size:11px}.storefront .cart-empty{font-size:14px}.storefront .cart-empty button{font-size:13px}
@media(max-width:620px){.storefront .announcement{font-size:10px}.storefront .main-nav{font-size:13px}.storefront .hero-copy{font-size:12px}.storefront .hero-note{font-size:9px}.storefront .value-strip strong{font-size:13px}.storefront .value-strip small{font-size:10px}.storefront .section-desc{font-size:11px}.storefront .category-tabs button{font-size:11px}.storefront .result-count{font-size:9px}.storefront .product-info h3{font-size:12px}.storefront .product-category{font-size:10px}.storefront .product-price strong{font-size:11px}.storefront .product-price del{font-size:9px}.storefront .collection-note p{font-size:10px}.storefront .newsletter p:not(.eyebrow){font-size:11px}.storefront .store-footer>p{font-size:11px}}
</style>

<style>
.storefront{--ink:#edf7ff;--muted:#9caec2;--dim:#718198;--panel:#111722;--line:#94b7d52b;--accent:#4deaff;background:#070a10;color:var(--ink);font-family:'DM Sans','Noto Sans TC',sans-serif;letter-spacing:.025em}
.storefront .announcement{height:38px;background:#0b101a;color:#b4c5dc;border-bottom:1px solid #4deaff38;font-size:12px;letter-spacing:.14em}.storefront .announcement strong{color:#4deaff}.storefront .announcement span{color:#c85cff;opacity:1}
.storefront .store-header{background:#090c13ed;border-bottom-color:#4deaff24;backdrop-filter:blur(12px)}.storefront .brand{font-family:'DM Sans','Noto Sans TC',sans-serif;letter-spacing:.08em}.storefront .brand-mark{border:1px solid #4deaff;color:#4deaff;box-shadow:0 0 17px #4deaff25;font-family:'DM Sans',sans-serif}.storefront .brand small{color:#718198;letter-spacing:.22em}.storefront .main-nav{color:#bbc9dc}.storefront .main-nav a:hover,.storefront .all-link:hover{color:#4deaff}.storefront .search-box{border-color:#8297b04a}.storefront .bag-button span{background:#4deaff;color:#071018;font-weight:700;box-shadow:0 0 13px #4deaff6b}
.storefront .hero{height:620px;background:#080c14}.storefront .hero-image{object-position:center 44%;filter:saturate(.8) contrast(1.12)}.storefront .hero-shade{background:linear-gradient(90deg,#080b12f5 0%,#0a0e19db 38%,#0a0e1980 65%,#090d16a8 100%),linear-gradient(0deg,#070a10 0%,transparent 26%)}.storefront .hero:after{content:"";pointer-events:none;position:absolute;inset:0;background:repeating-linear-gradient(0deg,#ffffff05 0px,#ffffff05 1px,transparent 1px,transparent 4px);mix-blend-mode:screen}.storefront .hero-content{z-index:1}.storefront .hero .eyebrow{color:#56eaff;text-shadow:0 0 17px #4deaff66;letter-spacing:.23em}.storefront .hero h1{font:800 clamp(48px,6.2vw,78px)/1.18 'DM Sans','Noto Sans TC',sans-serif;letter-spacing:.015em;text-transform:uppercase;text-shadow:0 7px 34px #000b}.storefront .hero h1 em{color:#67edff;text-shadow:0 0 28px #36dfff72}.storefront .hero-copy{font-family:'DM Sans','Noto Sans TC',sans-serif;color:#c4d1e0;letter-spacing:.045em}.storefront .hero-cta{background:linear-gradient(100deg,#4deaff,#a569ff);color:#071018;border:0;font-weight:700;clip-path:polygon(0 0,100% 0,100% 70%,91% 100%,0 100%);box-shadow:0 0 24px #4deaff4a}.storefront .hero-cta:hover{background:linear-gradient(100deg,#a569ff,#4deaff);color:#071018;transform:translateY(-2px)}.storefront .hero-note{color:#b5c3d5}.storefront .hero-note span,.storefront .hero-note i{color:#4deaff;border-color:#4deaff}
.storefront .value-strip{border-color:#94b7d526}.storefront .value-strip>div{border-color:#94b7d526}.storefront .value-strip>div>span{color:#60eaff;text-shadow:0 0 12px #4deaff66}.storefront .value-strip strong{font-family:'DM Sans','Noto Sans TC',sans-serif;color:#e5f2ff}.storefront .value-strip small{color:#94a5bb}.storefront .shop-section{padding-top:92px}.storefront .eyebrow{color:#58eaff}.storefront .section-heading h2,.storefront .newsletter h2{font-family:'DM Sans','Noto Sans TC',sans-serif;font-weight:750;letter-spacing:.04em}.storefront .section-heading h2 span{color:#58eaff;text-shadow:0 0 20px #4deaff4d}.storefront .section-desc{color:#a5b4c7}.storefront .all-link{color:#62eaff}
.storefront .shop-toolbar{border-bottom:1px solid #94b7d526;padding-bottom:3px}.storefront .category-tabs button{color:#93a3b8}.storefront .category-tabs button.active,.storefront .category-tabs button:hover{color:#67edff}.storefront .category-tabs button.active:after{border-color:#4deaff;box-shadow:0 0 10px #4deaff}.storefront .result-count{color:#8798ae}.storefront .product-grid{gap:30px 20px}.storefront .product-card{background:linear-gradient(145deg,#141b27,#0c111a);border:1px solid #93b6d526;padding:9px;transition:border-color .2s,transform .2s,box-shadow .2s}.storefront .product-card:hover{border-color:#4deaff91;transform:translateY(-4px);box-shadow:0 10px 35px #0008,0 0 20px #4deaff16}.storefront .product-image-wrap{aspect-ratio:1;background:#101725!important}.storefront .product-image-wrap img{filter:saturate(.88) contrast(1.08)}.storefront .product-tag{background:#0b101ce8;color:#63edff;border:1px solid #4deaff70;letter-spacing:.1em}.storefront .product-category{color:#8ea1b8}.storefront .product-info h3{color:#edf5ff;font-family:'DM Sans','Noto Sans TC',sans-serif;font-weight:600}.storefront .product-price strong{color:#68eaff;font-weight:700}.storefront .product-price del{color:#728198}.storefront .quick-add{background:linear-gradient(100deg,#4deaff,#a56bff);border:0;color:#071018;font-weight:700}.storefront .product-card:hover .quick-add{box-shadow:0 0 22px #4deaff53}.storefront .collection-note{color:#b3c1d4}.storefront .collection-note span{color:#bb65ff;text-shadow:0 0 12px #bb65ff}.storefront .newsletter{background:linear-gradient(110deg,#111a29,#171126);border-top:1px solid #4deaff3b;border-bottom:1px solid #b55cff2b}.storefront .newsletter p:not(.eyebrow){color:#a9b9cd}.storefront .newsletter form{border-color:#56eaff77}.storefront .newsletter input{color:#effaff}.storefront .newsletter form button{color:#5beaff;font-weight:700}.storefront .store-footer{border-color:#94b7d52b}.storefront .store-footer>p{color:#a6b5c7}.storefront .store-footer>span{color:#73839a}
.storefront .cart-drawer{background:#0d121b;border-left:1px solid #4deaff45}.storefront .drawer-heading{border-color:#94b7d533}.storefront .drawer-heading .eyebrow{color:#61eaff}.storefront .drawer-heading h2{font-family:'DM Sans','Noto Sans TC',sans-serif}.storefront .close-button{color:#d9e9fa}.storefront .cart-item{border-color:#94b7d526}.storefront .cart-item-copy>strong,.storefront .cart-summary>div strong{color:#64eaff}.storefront .quantity button{border-color:#4deaff65;color:#6feeff}.storefront .cart-summary{border-color:#94b7d540}.storefront .cart-summary>button,.storefront .cart-empty button{background:linear-gradient(100deg,#4deaff,#a56bff);font-weight:700}.storefront .toast-message{background:#101b29;color:#7cf0ff;border:1px solid #4deaff79;box-shadow:0 0 30px #4deaff32}
.storefront .reload-products{margin-top:14px;padding:9px 15px;border:1px solid #4deaff80;background:#111b28;color:#63eaff;cursor:pointer}
@media(max-width:620px){.storefront .hero{height:520px}.storefront .hero h1{font-size:43px}.storefront .hero-shade{background:linear-gradient(90deg,#080b12f2,#0a0e19bc 75%,#090d168c)}.storefront .shop-section{padding-top:60px}.storefront .product-card{padding:6px}.storefront .value-strip>div>span{color:#60eaff}}
</style>
