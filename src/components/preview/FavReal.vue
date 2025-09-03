<template>
  <el-button
    size="small"
    text
    :loading="loading"
    @click="toggle"
    :title="favorite ? '取消收藏' : '收藏'"
    class="fav-btn"
  >
    <el-icon v-if="!favorite"><Star /></el-icon>
    <el-icon v-else style="color:#f7c948;"><StarFilled /></el-icon>
  </el-button>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Star, StarFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { addFavorite, listFavorite, removeFavorite } from '../../services/favorites';

const props = defineProps({
  file: { type: Object, default: null }
});

const loading = ref(false);
const favorite = ref(null);

async function refresh() {
  if (!props.file || !props.file.fileId) { favorite.value = null; return; }
  try { favorite.value = await listFavorite(props.file); } catch { /* ignore */ }
}

async function toggle() {
  if (loading.value || !props.file) return;
  loading.value = true;
  try {
    if (favorite.value) {
      await removeFavorite(favorite.value.favoriteId || favorite.value.id || favorite.value.favoriteID);
      favorite.value = null;
      ElMessage.success('已取消收藏');
    } else {
      await addFavorite(props.file);
      await refresh();
      ElMessage.success('已收藏');
    }
  } catch (e) {
    console.warn('[FavReal] toggle failed', e);
    ElMessage.error('收藏操作失败');
  } finally { loading.value = false; }
}

onMounted(refresh);
watch(() => props.file?.fileId, () => refresh(), { immediate: false });
</script>

<style scoped>
.fav-btn { padding: 4px 6px; }
</style>
