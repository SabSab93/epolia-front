<script lang="ts">
export type AvatarProfileExampleProps = {
  src: string
  alt: string
  initials: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  shape: 'circle' | 'rounded'
  presentation: 'search' | 'map' | 'profile'
  displayName: string
  serviceLabel: string
  showWork: boolean
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import {
  map,
  otherProfile,
  projects,
  reviews,
  work,
  type TalentDemoProfile,
} from '@/storybook/examples/avatarGallery.data'

const props = defineProps<AvatarProfileExampleProps>()
const view = ref(props.presentation)
const previousView = ref(props.presentation)
const selectedId = ref('camille')
const sheetOpen = ref(true)
const feedback = ref('')
const activeTab = ref<'projects' | 'reviews'>('projects')
const favorites = ref<string[]>([])
const searchList = ref<globalThis.HTMLElement | null>(null)
const profileHeading = ref<InstanceType<typeof BaseTitle> | null>(null)
const mapHeading = ref<globalThis.HTMLElement | null>(null)
const mapAction = ref<InstanceType<typeof BaseButton> | null>(null)
const pin = ref<InstanceType<typeof BaseButton> | null>(null)
const projectsTab = ref<globalThis.HTMLButtonElement | null>(null)
const reviewsTab = ref<globalThis.HTMLButtonElement | null>(null)
const tabId = useId()

const mainProfile = computed<TalentDemoProfile>(() => ({
  id: 'camille',
  name: props.displayName,
  service: props.serviceLabel,
  location: 'Grenoble',
  photo: props.src,
  alt: props.alt,
  initials: props.initials,
  cover: work,
  price: '22',
  rating: '4,9',
  reviews: '12',
  formation: 'Étudiante en design graphique',
  bio: 'Je crée des visuels qui donnent du sens à vos projets : affiches, identités visuelles et supports imprimés. Nous choisissons ensemble le style et les livrables.',
  projects,
  feedback: reviews,
}))
const profiles = computed(() => [mainProfile.value, otherProfile])
const selected = computed(
  () => profiles.value.find((person) => person.id === selectedId.value) || mainProfile.value,
)

watch(
  () => props.presentation,
  (value) => {
    view.value = value
    selectedId.value = 'camille'
    sheetOpen.value = true
    feedback.value = ''
  },
)

async function openProfile(person: TalentDemoProfile) {
  previousView.value = view.value
  selectedId.value = person.id
  activeTab.value = 'projects'
  feedback.value = ''
  view.value = 'profile'
  await nextTick()
  profileHeading.value?.$el.focus()
}

async function back() {
  view.value = previousView.value
  feedback.value = ''
  await nextTick()
  if (view.value === 'map') mapAction.value?.$el.focus()
  else
    searchList.value
      ?.querySelector<globalThis.HTMLButtonElement>(`[data-profile="${selectedId.value}"]`)
      ?.focus()
}

async function openMap() {
  view.value = 'map'
  selectedId.value = 'camille'
  sheetOpen.value = true
  await nextTick()
  mapHeading.value?.focus()
}

async function openSheet() {
  sheetOpen.value = true
  await nextTick()
  mapHeading.value?.focus()
}

async function closeSheet() {
  sheetOpen.value = false
  await nextTick()
  pin.value?.$el.focus()
}

function favorite(person: TalentDemoProfile) {
  const saved = favorites.value.includes(person.id)
  favorites.value = saved
    ? favorites.value.filter((id) => id !== person.id)
    : [...favorites.value, person.id]
  feedback.value = saved
    ? `${person.name} retiré des favoris de démonstration.`
    : `${person.name} ajouté aux favoris de démonstration.`
}

async function tabKey(event: globalThis.KeyboardEvent) {
  let tab: typeof activeTab.value
  if (event.key === 'Home') tab = 'projects'
  else if (event.key === 'End') tab = 'reviews'
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    tab = activeTab.value === 'projects' ? 'reviews' : 'projects'
  else return
  event.preventDefault()
  activeTab.value = tab
  await nextTick()
  if (tab === 'projects') projectsTab.value?.focus()
  else reviewsTab.value?.focus()
}
</script>

<template>
  <div class="talent-demo">
    <p class="talent-demo-note">Profils, photos et chiffres fictifs</p>

    <div v-if="view === 'search'" ref="searchList" class="talent-results">
      <article v-for="person in profiles" :key="person.id" class="talent-result">
        <button
          type="button"
          class="talent-result-open"
          :data-profile="person.id"
          :aria-label="`Voir le profil de ${person.name}, ${person.service}, ${person.price} euros par heure, ${person.rating} sur 5, ${person.reviews} avis, ${person.location}`"
          @click="openProfile(person)"
        >
          <span class="talent-result-media">
            <img
              v-if="showWork"
              :src="person.cover"
              alt=""
              width="960"
              height="640"
              class="talent-cover"
            />
          </span>
          <span class="talent-result-info">
            <span
              class="talent-result-avatar"
              :class="shape === 'circle' ? 'talent-round' : 'talent-rounded'"
            >
              <BaseAvatar
                :src="person.photo"
                :alt="person.alt"
                :initials="person.initials"
                :size="size"
                :shape="shape"
              />
            </span>
            <span class="talent-result-description">
              <span class="talent-emphasis">{{ person.name }}</span>
              <span class="talent-muted">{{ person.service }}</span>
              <span class="talent-rating"
                ><span aria-hidden="true" class="talent-star">★</span> {{ person.rating }} ·
                {{ person.reviews }} avis</span
              >
            </span>
            <span class="talent-result-details">
              <span class="talent-price">{{ person.price }} € / h</span>
              <span class="talent-muted">{{ person.location }}</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          class="talent-icon talent-favorite"
          :aria-pressed="favorites.includes(person.id)"
          :aria-label="`${favorites.includes(person.id) ? 'Retirer' : 'Ajouter'} ${person.name} ${favorites.includes(person.id) ? 'des' : 'aux'} favoris`"
          @click="favorite(person)"
        >
          <span aria-hidden="true">{{ favorites.includes(person.id) ? '♥' : '♡' }}</span>
        </button>
      </article>
      <BaseButton
        label="Voir sur la carte"
        variant="secondary"
        class="talent-map-link"
        @click="openMap"
      />
    </div>

    <section
      v-else-if="view === 'map'"
      class="talent-map"
      aria-label="Carte illustrative, sans géolocalisation"
    >
      <img :src="map" alt="" width="720" height="960" class="talent-map-background" />
      <p class="talent-map-note">Carte illustrative · sans géolocalisation</p>
      <div class="talent-map-space">
        <BaseButton
          ref="pin"
          :label="`${mainProfile.price} € / h`"
          :aria-label="`Afficher le profil de ${mainProfile.name} sur la carte, ${mainProfile.price} euros par heure`"
          :aria-expanded="sheetOpen"
          class="talent-pin"
          @click="openSheet"
        />
      </div>
      <section
        v-if="sheetOpen"
        class="talent-sheet"
        :aria-labelledby="`${tabId}-map-name`"
        @keydown.esc.stop.prevent="closeSheet"
      >
        <div class="talent-sheet-top">
          <span class="talent-sheet-handle" aria-hidden="true"></span>
          <button
            type="button"
            class="talent-icon"
            aria-label="Fermer l’aperçu"
            @click="closeSheet"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <img
          v-if="showWork"
          :src="mainProfile.cover"
          alt="Exemple fictif de supports graphiques imprimés"
          width="960"
          height="640"
          class="talent-sheet-image"
        />
        <div class="talent-sheet-main">
          <span
            class="talent-sheet-avatar"
            :class="shape === 'circle' ? 'talent-round' : 'talent-rounded'"
          >
            <BaseAvatar
              :src="mainProfile.photo"
              :alt="mainProfile.alt"
              :initials="mainProfile.initials"
              :size="size"
              :shape="shape"
            />
          </span>
          <div class="talent-sheet-identity">
            <p
              :id="`${tabId}-map-name`"
              ref="mapHeading"
              tabindex="-1"
              class="talent-emphasis talent-focus-target"
            >
              {{ mainProfile.name }}
            </p>
            <p>{{ mainProfile.service }}</p>
            <p class="talent-rating">
              <span aria-hidden="true" class="talent-star">★</span> {{ mainProfile.rating }} ·
              {{ mainProfile.reviews }} avis · {{ mainProfile.location }}
            </p>
          </div>
          <p class="talent-price talent-sheet-price">{{ mainProfile.price }} € / h</p>
        </div>
        <BaseButton
          ref="mapAction"
          label="Voir le profil"
          class="talent-sheet-action"
          @click="openProfile(mainProfile)"
        />
      </section>
    </section>

    <article v-else class="talent-profile">
      <BaseButton
        v-if="presentation !== 'profile'"
        :label="previousView === 'map' ? 'Retour à la carte' : 'Retour aux résultats'"
        variant="tertiary"
        class="talent-back"
        @click="back"
      />
      <div class="talent-profile-cover" aria-hidden="true"></div>
      <div class="talent-profile-body">
        <div class="talent-person">
          <span
            class="talent-profile-avatar"
            :class="shape === 'circle' ? 'talent-round' : 'talent-rounded'"
          >
            <BaseAvatar
              :src="selected.photo"
              :alt="selected.alt"
              :initials="selected.initials"
              :size="presentation === 'profile' ? size : 'xl'"
              :shape="shape"
            />
          </span>
          <div class="talent-person-name">
            <BaseTitle ref="profileHeading" level="h2" tabindex="-1" class="talent-focus-target">{{
              selected.name
            }}</BaseTitle>
            <p class="talent-muted">{{ selected.formation }}</p>
            <p class="talent-profile-meta">
              <span class="talent-rating"
                ><span aria-hidden="true" class="talent-star">★</span> {{ selected.rating }} ·
                {{ selected.reviews }} avis</span
              >
              <span class="talent-muted">{{ selected.location }}</span>
            </p>
          </div>
        </div>
        <div class="talent-service">
          <p class="talent-emphasis">{{ selected.service }}</p>
          <p class="talent-price">{{ selected.price }} € / h</p>
        </div>
        <p class="talent-muted">{{ selected.bio }}</p>
        <div class="talent-tabs" role="tablist" aria-label="Informations du profil">
          <button
            :id="`${tabId}-projects-tab`"
            ref="projectsTab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'projects'"
            :aria-controls="`${tabId}-projects`"
            :tabindex="activeTab === 'projects' ? 0 : -1"
            @click="activeTab = 'projects'"
            @keydown="tabKey"
          >
            Mes projets
          </button>
          <button
            :id="`${tabId}-reviews-tab`"
            ref="reviewsTab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'reviews'"
            :aria-controls="`${tabId}-reviews`"
            :tabindex="activeTab === 'reviews' ? 0 : -1"
            @click="activeTab = 'reviews'"
            @keydown="tabKey"
          >
            Avis
          </button>
        </div>
        <section
          :id="`${tabId}-projects`"
          role="tabpanel"
          :tabindex="activeTab === 'projects' ? 0 : -1"
          class="talent-focus-target"
          :aria-labelledby="`${tabId}-projects-tab`"
          :hidden="activeTab !== 'projects'"
        >
          <div v-if="showWork" class="talent-projects">
            <figure v-for="project in selected.projects" :key="project.title">
              <img
                :src="project.image"
                :alt="project.title + ', photo de démonstration'"
                width="960"
                height="640"
                loading="lazy"
              />
              <figcaption>{{ project.title }}</figcaption>
            </figure>
          </div>
          <p v-else class="talent-muted">Aucune réalisation publiée pour le moment.</p>
        </section>
        <section
          :id="`${tabId}-reviews`"
          role="tabpanel"
          :tabindex="activeTab === 'reviews' ? 0 : -1"
          :aria-labelledby="`${tabId}-reviews-tab`"
          :hidden="activeTab !== 'reviews'"
          class="talent-reviews talent-focus-target"
        >
          <article v-for="review in selected.feedback" :key="review.name">
            <p class="talent-emphasis">{{ review.name }} · 5/5</p>
            <p class="talent-muted">{{ review.text }}</p>
          </article>
        </section>
        <BaseButton
          label="Contacter"
          :aria-label="`Contacter ${selected.name}`"
          class="w-full"
          @click="feedback = 'Démonstration : aucun message n’a été envoyé.'"
        />
      </div>
    </article>
    <p v-if="feedback" role="status" class="talent-demo-note">{{ feedback }}</p>
  </div>
</template>

<style scoped>
@layer components {
  .talent-demo {
    color: var(--color-epolia-text);
    font-family: var(--font-epolia-body);
    font-size: var(--text-epolia-body-small);
    line-height: var(--text-epolia-body-small--line-height);
    overflow-wrap: anywhere;
  }
  .talent-demo-note {
    margin-block-end: var(--spacing-epolia-sm);
    color: var(--color-epolia-text-secondary);
  }
  .talent-results {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-sm);
  }
  .talent-result {
    container-type: inline-size;
    position: relative;
    min-width: 0;
    border-radius: var(--radius-epolia-media);
    background: var(--color-epolia-secondary-hover);
  }
  .talent-result-open {
    display: grid;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: start;
    border-radius: inherit;
    cursor: pointer;
  }
  .talent-result-open:focus-visible,
  .talent-icon:focus-visible,
  .talent-focus-target:focus-visible,
  .talent-tabs button:focus-visible {
    outline: 2px solid var(--color-epolia-focus);
    outline-offset: 4px;
  }
  .talent-result-media {
    grid-area: 1 / 1;
    display: block;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: var(--radius-epolia-media);
    background: var(--color-epolia-secondary-hover);
  }
  .talent-cover {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .talent-result-avatar {
    display: inline-flex;
    align-self: center;
    background: var(--color-epolia-page);
    box-shadow: 0 0 0 4px var(--color-epolia-page);
  }
  .talent-round {
    border-radius: 50%;
  }
  .talent-rounded {
    border-radius: var(--radius);
  }
  .talent-result-info {
    grid-area: 1 / 1;
    align-self: end;
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--spacing-epolia-xs);
    margin: var(--spacing-epolia-xs);
    padding: var(--spacing-epolia-xs);
    border: 1px solid var(--color-epolia-border);
    border-radius: var(--radius-epolia-media);
    background: var(--color-epolia-page);
  }
  .talent-comparison {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-epolia-xs);
  }
  .talent-result-description,
  .talent-result-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-2xs);
    min-width: 0;
  }
  .talent-result-description {
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .talent-result-details {
    align-items: flex-end;
    font-size: 0.75rem;
  }
  .talent-result-details .talent-price {
    font-size: var(--text-epolia-body-small);
  }
  .talent-emphasis,
  .talent-price {
    font-weight: 600;
  }
  .talent-price {
    white-space: nowrap;
  }
  .talent-rating {
    white-space: normal;
  }
  .talent-star {
    color: var(--color-epolia-accent);
  }
  .talent-muted {
    color: var(--color-epolia-text-secondary);
  }
  .talent-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--color-epolia-page);
    color: var(--color-epolia-text);
    font-size: 1.75rem;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
  }
  .talent-favorite {
    position: absolute;
    inset-block-start: var(--spacing-epolia-xs);
    inset-inline-end: var(--spacing-epolia-xs);
  }
  .talent-favorite[aria-pressed='true'] {
    color: var(--color-epolia-primary);
  }
  .talent-map-link {
    align-self: center;
    border-radius: var(--radius-epolia-panel);
  }
  .talent-map {
    container-type: inline-size;
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius-epolia-panel);
    background: var(--color-epolia-secondary-hover);
  }
  .talent-map-background {
    position: absolute;
    z-index: -1;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .talent-map-note {
    align-self: center;
    margin: var(--spacing-epolia-sm);
    padding: var(--spacing-epolia-2xs) var(--spacing-epolia-xs);
    border-radius: var(--radius);
    background: var(--color-epolia-page);
    color: var(--color-epolia-text-secondary);
  }
  .talent-map-space {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 22rem;
  }
  .talent-pin {
    border-radius: var(--radius-epolia-panel);
  }
  .talent-sheet {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--spacing-epolia-xs);
    padding: var(--spacing-epolia-xs);
    border-radius: var(--radius-epolia-panel) var(--radius-epolia-panel) 0 0;
    background: var(--color-epolia-page);
    box-shadow: var(--shadow-epolia-panel);
  }
  .talent-sheet-top {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    min-height: var(--spacing-epolia-xs);
  }
  .talent-sheet-handle {
    width: 3rem;
    height: 4px;
    margin-inline-start: auto;
    margin-inline-end: auto;
    border-radius: var(--radius);
    background: var(--color-epolia-border);
  }
  .talent-sheet-main {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--spacing-epolia-xs);
    min-width: 0;
  }
  .talent-sheet-image {
    grid-column: 1 / -1;
    width: 100%;
    aspect-ratio: 3 / 1;
    height: auto;
    border-radius: var(--radius-epolia-media);
    object-fit: cover;
  }
  .talent-sheet-identity {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-2xs);
    min-width: 0;
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .talent-sheet-top .talent-icon {
    position: absolute;
    z-index: 1;
    inset-block-start: var(--spacing-epolia-lg);
    inset-inline-end: var(--spacing-epolia-xs);
  }
  .talent-sheet-avatar {
    display: inline-flex;
    position: relative;
    margin-block-start: calc(-1 * var(--spacing-epolia-lg));
    box-shadow: 0 0 0 4px var(--color-epolia-page);
  }
  .talent-sheet-price {
    font-size: var(--text-epolia-body-small);
  }
  .talent-sheet-action {
    grid-column: 2;
    justify-self: end;
  }
  .talent-service {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--spacing-epolia-xs);
  }
  .talent-profile {
    container-type: inline-size;
    min-width: 0;
  }
  .talent-back {
    margin-block-end: var(--spacing-epolia-sm);
  }
  .talent-profile-cover {
    aspect-ratio: 12 / 5;
    overflow: hidden;
    border-radius: var(--radius-epolia-media) var(--radius-epolia-media) 0 0;
    background: var(--color-epolia-secondary-hover) url('@/assets/images/profile-cover-default.svg')
      center / cover;
  }
  .talent-profile-body {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-md);
    margin-block-start: calc(-1 * var(--spacing-epolia-xl));
    padding: 0 var(--spacing-epolia-md) var(--spacing-epolia-md);
    border-radius: var(--radius-epolia-panel) var(--radius-epolia-panel) var(--radius-epolia-media)
      var(--radius-epolia-media);
    background: var(--color-epolia-page);
    border: 1px solid var(--color-epolia-border);
  }
  .talent-person {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-epolia-xs);
    text-align: center;
  }
  .talent-profile-avatar {
    flex-shrink: 0;
    display: inline-flex;
    position: relative;
    margin-block-start: calc(-1 * var(--spacing-epolia-xl));
    background: var(--color-epolia-page);
    box-shadow: 0 0 0 4px var(--color-epolia-page);
  }
  .talent-person-name {
    min-width: 0;
    width: 100%;
  }
  .talent-profile-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-epolia-lg);
    margin-block-start: var(--spacing-epolia-xs);
  }
  .talent-service {
    padding-block-start: var(--spacing-epolia-md);
    border-block-start: 1px solid var(--color-epolia-border);
  }
  .talent-tabs {
    display: flex;
    gap: var(--spacing-epolia-lg);
    border-block-end: 1px solid var(--color-epolia-border);
  }
  .talent-tabs button {
    min-width: 3rem;
    min-height: 3rem;
    padding: var(--spacing-epolia-xs) 0;
    border-block-end: 2px solid transparent;
    color: var(--color-epolia-text-secondary);
    cursor: pointer;
  }
  .talent-tabs button[aria-selected='true'] {
    border-color: var(--color-epolia-primary);
    color: var(--color-epolia-text);
    font-weight: 600;
  }
  .talent-projects {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-epolia-xs);
  }
  .talent-projects img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: var(--radius);
  }
  .talent-projects figcaption {
    margin-block-start: var(--spacing-epolia-xs);
  }
  .talent-reviews:not([hidden]) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-md);
  }
  .talent-reviews article {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-xs);
  }
  @container (max-width: 18rem) {
    .talent-result-info {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .talent-result-details {
      grid-column: 2;
      align-items: flex-start;
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--spacing-epolia-xs);
    }
    .talent-sheet-main {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .talent-sheet-price {
      grid-column: 2;
    }
  }
  @container (max-width: 12rem) {
    .talent-profile-body {
      padding-inline: var(--spacing-epolia-xs);
    }
    .talent-tabs {
      flex-wrap: wrap;
    }
    .talent-tabs > button {
      flex: 1 1 100%;
    }
    .talent-result-open {
      display: block;
    }
    .talent-result-media {
      aspect-ratio: 4 / 3;
    }
    .talent-result-info {
      grid-template-columns: minmax(0, 1fr);
      margin-block-start: calc(-1 * var(--spacing-epolia-md));
    }
    .talent-result-avatar {
      justify-self: start;
    }
    .talent-result-details,
    .talent-sheet-price {
      grid-column: auto;
    }
    .talent-sheet-main {
      grid-template-columns: minmax(0, 1fr);
    }
    .talent-sheet-avatar {
      justify-self: start;
    }
    .talent-sheet-action {
      grid-column: 1 / -1;
      justify-self: stretch;
    }
  }
  @container (max-width: 20rem) {
    .talent-tabs {
      gap: var(--spacing-epolia-xs);
    }
    .talent-tabs button {
      flex: 1 1 0;
    }
    .talent-projects {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (forced-colors: active) {
    .talent-favorite[aria-pressed='true'] {
      outline: 2px solid Highlight;
    }
    .talent-tabs button[aria-selected='true'] {
      border-color: Highlight;
    }
    .talent-icon,
    .talent-map-note,
    .talent-sheet {
      border: 1px solid CanvasText;
    }
  }
}
</style>
