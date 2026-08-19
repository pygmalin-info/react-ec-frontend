import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authToken } from '@/shared/api/authToken'
import { signUp, userKeys, type SignInResult } from '@/entities/user'

/**
 * 会員登録（登録と同時にログイン状態になる）。
 *
 * 中身は useSignIn とほぼ同じだが、features/sign-in から import はしていない。
 * feature 同士を参照させると「sign-up を消したら sign-in が壊れる」ような
 * 追いにくい結合が生まれるため。
 * 共有したい処理が出てきたら、それは entity か shared に置くべきものかを先に考える。
 */
export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signUp,
    onSuccess: (result: SignInResult) => {
      authToken.set(result.token)
      queryClient.setQueryData(userKeys.me, result.user)
    },
  })
}
