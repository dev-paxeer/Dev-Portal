<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import AppLayout from '@/components/layout/AppLayout.vue'

// Initialize theme on app mount
useTheme()
</script>

<template>
  <AppLayout />
</template>
