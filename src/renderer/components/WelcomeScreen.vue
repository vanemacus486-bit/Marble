<script setup>
import { NButton, NIcon } from 'naive-ui';
import { CubeOutline } from '@vicons/ionicons5';
import { chooseVault } from '../store';
</script>

<template>
  <div class="welcome">
    <div class="logo">
      <n-icon class="logo-ic"><cube-outline /></n-icon>
      <span>Marble</span>
    </div>
    <p>选择一个文件夹作为你的笔记库</p>
    <n-button type="primary" size="large" @click="chooseVault">选择文件夹</n-button>
  </div>
</template>

<style scoped>
.welcome { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.logo { display: flex; align-items: center; gap: 12px; font-size: 36px; font-weight: 600; color: var(--accent); }
.logo-ic { font-size: 40px; }
.welcome p { color: var(--dim); margin: 0; }
</style>
