import { useRouter, type RouteLocationRaw } from 'vue-router'

export function useAuthLayout() {
  const router = useRouter()

  function goBack(backTo: RouteLocationRaw, backAction?: () => void) {
    if (backAction) {
      backAction()
      return
    }

    const destination = router.resolve(backTo)

    if (router.options.history.state.back === destination.fullPath) {
      router.back()
      return
    }

    router.replace(destination.fullPath)
  }

  return { goBack }
}
