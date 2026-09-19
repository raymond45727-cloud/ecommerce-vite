<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import emitter from '../methods/pushMessageState';

const messages = ref([]);

const removeMessage = (num) => {
  messages.value.splice(num, 1);
};

const updateMessage = (message, status = 'warning') => {
  const timestamp = Math.floor(new Date() / 1000);
  messages.value.push({ message, status, timestamp });

  setTimeout(() => {
    messages.value.forEach((item, i) => {
      if (item.timestamp === timestamp) {
        messages.value.splice(i, 1);
      }
    });
  }, 5000);
};

onMounted(() => {
  emitter.on('message:push', (data) => {
    const { message, status } = data;
    updateMessage(message, status);
  });
});

onUnmounted(() => {
  emitter.off('message:push');
});
</script>

<template>
  <div class="message-alert">
    <div
      class="alert alert-dismissible"
      :class="'alert-' + item.status"
      v-for="(item, i) in messages"
      :key="item.timestamp"
    >
      {{ item.message }}
      
      <button
        type="button"
        class="btn-close"
        @click="removeMessage(i)"
        aria-label="Close"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.message-alert {
  position: fixed;
  max-width: 50%;
  top: 56px;
  right: 20px;
  z-index: 1100;
}
</style>
