<script setup>
import axios from "axios";
import { RouterView } from "vue-router";
import Navbar from "./pages/Navbar.vue";
import Sidebar from "./pages/Sidebar.vue";
import Alertmessage from "./Alertmessage.vue";

const token = document.cookie.replace(
  /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
  "$1",
);

axios.defaults.headers.common["Authorization"] = token;
</script>

<template>
  <Navbar />
  <Alertmessage />
  <div class="container-fluid">
    <div class="row">
      <Sidebar />
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
        <RouterView />
      </main>
    </div>
  </div>
</template>
