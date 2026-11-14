<template>
  <AuthLayout :title="title" :back-to="{ name: 'home' }" back-label="Retour à l’accueil">
    <div class="flex flex-col gap-epolia-md">
      <p v-if="hasRole" ref="confirmation" tabindex="-1">{{ successMessage }}</p>
      <form v-else class="flex flex-col gap-epolia-md" @submit.prevent="confirmRole">
        <p>{{ description }}</p>
        <p>
          Vos coordonnées restent associées à votre compte. Vous pourrez compléter votre nouveau
          profil lorsque le parcours sera disponible.
        </p>
        <BaseAlert :message="errorMessage" variant="error" announcement="assertive" />
        <BaseButton label="Ajouter ce rôle" type="submit" :loading="isSubmitting" />
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import { useAdditionalRoleRegistration } from '@/domains/auth/composables/useAdditionalRoleRegistration'
import type { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

const props = defineProps<{ role: AccountRoleEnum }>()
const {
  title,
  description,
  hasRole,
  successMessage,
  isSubmitting,
  errorMessage,
  confirmation,
  confirmRole,
} = useAdditionalRoleRegistration(() => props.role)
</script>
