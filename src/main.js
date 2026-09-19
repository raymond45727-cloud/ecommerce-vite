import { createApp } from "vue";
import { Form, Field, ErrorMessage, defineRule, configure } from "vee-validate";
import * as AllRules from "@vee-validate/rules";
import { localize, setLocale } from "@vee-validate/i18n";
import zhTW from "@vee-validate/i18n/dist/locale/zh_TW.json";

import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/css/index.css";

import axios from "axios";
import App from "./App.vue";
import router from "./router/index.js";

Object.keys(AllRules).forEach((rule) => {
  if (rule !== "default" && rule !== "all") {
    defineRule(rule, AllRules[rule]);
  }
});

configure({
  generateMessage: localize({ zh_TW: zhTW }),
  validateOnInput: true,
});
setLocale("zh_TW");

axios.defaults.withCredentials = true;

const app = createApp(App);

app.component("VForm", Form);
app.component("VField", Field);
app.component("ErrorMessage", ErrorMessage);
app.component("VueLoading", Loading.Component || Loading);
app.use(router);
app.mount("#app");
