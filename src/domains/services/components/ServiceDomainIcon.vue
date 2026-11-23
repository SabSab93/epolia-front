<template>
  <BaseIcon :icon="domainIcons[domainId] ?? domainIcons[label] ?? CategoryIcon" :size="20" />
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import CategoryIcon from '~icons/material-symbols/category'
import ComputerIcon from '~icons/material-symbols/laptop-mac'
import DocumentIcon from '~icons/material-symbols/description'
import SchoolIcon from '~icons/material-symbols/school'
import PhotoCameraIcon from '~icons/material-symbols/photo-camera'
import MovieIcon from '~icons/material-symbols/movie'
import BookIcon from '~icons/material-symbols/menu-book'
import DesignIcon from '~icons/material-symbols/draw'
import EventIcon from '~icons/material-symbols/event'
import DevicesIcon from '~icons/material-symbols/devices'
import TextileIcon from '~icons/material-symbols/checkroom'
import CraftIcon from '~icons/material-symbols/brush'
import VideoCallIcon from '~icons/material-symbols/videocam'
import PaletteIcon from '~icons/material-symbols/palette'
import BaseIcon from '@/shared/components/BaseIcon.vue'

defineProps<{ domainId: string; label: string }>()
// Illustrations only. Eligibility comes from the server.
const domainIcons: Record<string, Component> = {
  'Déco, style et beauté': PaletteIcon,
  'Web et projets numériques personnels': ComputerIcon,
  'Couture et personnalisation textile': TextileIcon,
  'Création textile': TextileIcon,
  'Photographie et souvenirs': PhotoCameraIcon,
  'Vidéo et audio': MovieIcon,
  Audiovisuel: MovieIcon,
  'Écriture, lecture et langues': BookIcon,
  'Graphisme et édition personnelle': DesignIcon,
  'Création graphique': DesignIcon,
  'Organisation et événements privés': EventIcon,
  'Études, candidatures et expression orale': SchoolIcon,
  'Ateliers numériques et artistiques de loisir en visio': DevicesIcon,
  'Cours créatifs à distance': VideoCallIcon,
  'Loisirs créatifs': CraftIcon,
  '65aa6725-3216-47a7-b1c8-0dad9b38ca4f': ComputerIcon,
  '212135bc-1485-4713-aed6-17565dd628a3': ComputerIcon,
  'daa0e671-5f57-4b3f-bf4d-21c51d6552fa': SchoolIcon,
  '0628ae71-869c-4b86-9982-e0d00cf0596b': SchoolIcon,
  'a49f8e81-076c-4ffc-b3d6-4185d8f68881': DocumentIcon,
}
</script>
