import { createRouter, createWebHistory } from "vue-router";
//import HelloWorld from '../components/HelloWorld.vue'
import Login from "../components/pages/Login.vue";
import Dashboard from "../components/Dashboard.vue";
import Products from "../components/pages/Products.vue";
import OrdersDemo from "../components/pages/OrdersDemo.vue";
import CustomerCheckout from "../components/pages/CustomerCheckout.vue";
import Storefront from "../components/pages/Storefront.vue";
import StoreCheckout from "../components/pages/StoreCheckout.vue";

import axios from "axios";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/store",
      name: "Storefront",
      component: Storefront,
    },
    {
      path: "/checkout",
      name: "StoreCheckout",
      component: StoreCheckout,
    },
    
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/admin",
      name: "Dashboard",
      component: Dashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: "products",
          name: "Products",
          component: Products,
        },
        {
          path: "customer_order",
          name: "OrdersDemo",
          component:OrdersDemo ,
        },
        {
          path: "customer_checkout/:orderId",
          name: "CustomerCheckout",
          component:CustomerCheckout ,
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/login",
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
    if (token) {
      axios.defaults.headers.common["Authorization"] = token;
    }
    const api = `${import.meta.env.VITE_APP_URL}/api/user/check`;

    try {
      const response = await axios.post(api);

      if (!response.data.success) {
        return "/login";
      }
    } catch (error) {
      return "/login";
    }
  }
});

export default router;
