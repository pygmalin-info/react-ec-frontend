import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type FieldFrameProps = {
  label: string
  error?: string | undefined
  hint?: string | undefined
  children: (props: { id: string; describedBy: string | undefined; isInvalid: boolean }) => React.ReactNode
}

/**
 * ラベル・エラー・aria 属性の面倒を1箇所に集める。
 *
 * ■ なぜ入力要素ごとに3つのコンポーネントを作り、枠だけ共通化したのか
 *   input / textarea / select は受け取れる props が違うので、
 *   1つのコンポーネントに押し込めると props の型が union だらけになって使いにくい。
 *   一方「ラベルとエラーの出し方」は完全に同じなので、そこだけ共有している。
 */
function FieldFrame({ label, error, hint, children }: FieldFrameProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({ id, describedBy, isInvalid: error !== undefined })}
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: React.Ref<HTMLInputElement>
}

export function TextField({ label, error, hint, ...rest }: TextFieldProps) {
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      {({ id, describedBy, isInvalid }) => (
        <input
          {...rest}
          id={id}
          className="field__control"
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
        />
      )}
    </FieldFrame>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: React.Ref<HTMLTextAreaElement>
}

export function TextAreaField({ label, error, hint, ...rest }: TextAreaFieldProps) {
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      {({ id, describedBy, isInvalid }) => (
        <textarea
          {...rest}
          id={id}
          className="field__control"
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
        />
      )}
    </FieldFrame>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string | undefined
  hint?: string | undefined
  ref?: React.Ref<HTMLSelectElement>
}

export function SelectField({ label, error, hint, children, ...rest }: SelectFieldProps) {
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      {({ id, describedBy, isInvalid }) => (
        <select
          {...rest}
          id={id}
          className="field__control"
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
        >
          {children}
        </select>
      )}
    </FieldFrame>
  )
}
