<script setup>

defineProps({
  pages: {
    type: Object,
    default: () => ({})
  }
});
const emit = defineEmits(['change-page']);


const updatePage = (page) => {
  emit('change-page', page);
};
</script>

<template>
  <nav aria-label="Page navigation example">
    <ul class="pagination">
      
      <li class="page-item" :class="{ 'disabled': !pages.has_pre }">
        <a class="page-link" href="#" @click.prevent="updatePage(pages.current_page - 1)">
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>

      
      <li
        class="page-item"
        v-for="page in pages.total_pages"
        :key="page"
        :class="{ 'active': pages.current_page === page }"
      >
        <a class="page-link" href="#" @click.prevent="updatePage(page)">{{ page }}</a>
      </li>

      
      <li class="page-item" :class="{ 'disabled': !pages.has_next }">
        <a class="page-link" href="#" @click.prevent="updatePage(pages.current_page + 1)">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
    </ul>
  </nav>
</template>