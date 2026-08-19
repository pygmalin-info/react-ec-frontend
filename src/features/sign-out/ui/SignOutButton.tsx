import { useNavigate } from 'react-router-dom'
import { routes } from '@/shared/config/routes'
import { Button } from '@/shared/ui/Button'
import { useSignOut } from '../api/useSignOut'

export function SignOutButton() {
  const navigate = useNavigate()
  const signOutMutation = useSignOut()

  return (
    <Button
      variant="secondary"
      isLoading={signOutMutation.isPending}
      onClick={() => {
        signOutMutation.mutate(undefined, {
          onSettled: () => navigate(routes.signIn, { replace: true }),
        })
      }}
    >
      ログアウト
    </Button>
  )
}
