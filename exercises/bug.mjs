#!/usr/bin/env node
/**
 * バグ改修演習のバグを仕込む / 元に戻すためのスクリプト。
 *
 *   npm run bug -- list         仕込めるバグの一覧
 *   npm run bug -- status       いま仕込まれているバグ
 *   npm run bug -- apply 03     3番のバグを仕込む
 *   npm run bug -- apply 03 07  複数まとめて仕込む
 *   npm run bug -- random       ランダムに1つ仕込む（何番か表示しない）
 *   npm run bug -- reset        仕込んだバグをすべて元に戻す
 *
 * 仕組みは単純な文字列置換です。git は使いません。
 * 仕込んだバグの番号は exercises/.applied.json に記録しています。
 * 仕込んだ箇所を自分で書き換えたあとに reset すると失敗するので、
 * その場合は該当ファイルを手で直してから、この記録ファイルを削除してください。
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { bugs } from './bugs.mjs'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const stateFile = join(projectRoot, 'exercises/.applied.json')

const read = (file) => readFileSync(join(projectRoot, file), 'utf8')
const write = (file, content) => writeFileSync(join(projectRoot, file), content)

const stars = (level) => '★'.repeat(level) + '☆'.repeat(3 - level)

/**
 * 仕込み済みの番号。
 *
 * ファイルの中身から推測しないのは、削除系のバグ（消したあとの姿が、元の姿の一部）だと
 * 「仕込み済み」と「元のまま」を文字列だけでは区別できないため。
 */
function loadState() {
  if (!existsSync(stateFile)) return []
  try {
    const parsed = JSON.parse(readFileSync(stateFile, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveState(ids) {
  if (ids.length === 0) {
    if (existsSync(stateFile)) rmSync(stateFile)
    return
  }
  writeFileSync(stateFile, `${JSON.stringify([...ids].sort(), null, 2)}\n`)
}

function replaceOnce(file, from, to) {
  // 空文字を検索すると必ず先頭にヒットしてしまうので、定義ミスとして弾く
  if (from === '' || to === '') throw new Error(`${file}: from / to に空文字は使えません`)

  const source = read(file)
  const first = source.indexOf(from)
  if (first < 0) throw new Error(`${file} に対象の記述が見つかりません`)
  if (source.indexOf(from, first + from.length) >= 0) {
    throw new Error(`${file} に対象の記述が複数あります（定義を見直してください）`)
  }
  write(file, source.slice(0, first) + to + source.slice(first + from.length))
}

function apply(bug) {
  bug.changes.forEach((change) => replaceOnce(change.file, change.from, change.to))
}

function revert(bug) {
  // 逆順に戻す。あとの変更が前の変更で挿入した行を含んでいることがあるため。
  ;[...bug.changes].reverse().forEach((change) => replaceOnce(change.file, change.to, change.from))
}

const findBug = (id) => bugs.find((bug) => bug.id === String(id).padStart(2, '0'))

const [command = 'help', ...args] = process.argv.slice(2)
const applied = loadState()

switch (command) {
  case 'list': {
    console.log('仕込めるバグ:\n')
    for (const bug of bugs) {
      const mark = applied.includes(bug.id) ? '● ' : '  '
      console.log(`${mark}#${bug.id}  ${stars(bug.level)}  ${bug.title}`)
    }
    console.log('\n● = 現在仕込まれているもの')
    console.log('症状とヒントは docs/DEBUG_EXERCISES.md を読んでください。')
    break
  }

  case 'status': {
    if (applied.length === 0) {
      console.log('仕込まれているバグはありません。')
      break
    }
    console.log('仕込まれているバグ:\n')
    applied.forEach((id) => {
      const bug = findBug(id)
      if (bug) console.log(`  #${bug.id}  ${bug.title}`)
    })
    break
  }

  case 'apply': {
    if (args.length === 0) {
      console.error('番号を指定してください。例: npm run bug -- apply 03')
      process.exit(1)
    }

    const next = [...applied]
    for (const id of args) {
      const bug = findBug(id)
      if (!bug) {
        console.error(`#${id} は存在しません。npm run bug -- list で確認してください。`)
        process.exit(1)
      }
      if (next.includes(bug.id)) {
        console.log(`#${bug.id} は既に仕込まれています`)
        continue
      }
      apply(bug)
      next.push(bug.id)
      console.log(`#${bug.id} を仕込みました: ${bug.title}`)
    }

    saveState(next)
    console.log('\nnpm run dev で症状を確認してください。')
    break
  }

  case 'random': {
    const candidates = bugs.filter((bug) => !applied.includes(bug.id))
    if (candidates.length === 0) {
      console.log('仕込めるバグが残っていません。npm run bug -- reset を実行してください。')
      break
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)]
    apply(picked)
    saveState([...applied, picked.id])

    console.log('バグを1つ仕込みました。番号は表示しません。')
    console.log('npm run dev で動かして、何が起きているかを説明してください。')
    console.log('（答え合わせは npm run bug -- status）')
    break
  }

  case 'reset': {
    if (applied.length === 0) {
      console.log('元に戻すバグはありません。')
      break
    }

    const remaining = []
    // 1つ失敗しても残りは戻す。ここで止まると中途半端な状態が残ってしまう。
    for (const id of applied) {
      const bug = findBug(id)
      if (!bug) continue
      try {
        revert(bug)
        console.log(`#${bug.id} を元に戻しました`)
      } catch (error) {
        remaining.push(bug.id)
        console.error(`#${bug.id} を戻せませんでした: ${error.message}`)
      }
    }

    saveState(remaining)
    if (remaining.length > 0) {
      console.error('\n戻せなかったものは、該当ファイルを手で直してください。')
      process.exit(1)
    }
    break
  }

  default:
    console.log(
      [
        'バグ改修演習',
        '',
        '  npm run bug -- list          仕込めるバグの一覧',
        '  npm run bug -- status        いま仕込まれているバグ',
        '  npm run bug -- apply 03      3番のバグを仕込む（複数指定可）',
        '  npm run bug -- random        ランダムに1つ仕込む（番号は表示しない）',
        '  npm run bug -- reset         すべて元に戻す',
        '',
        '症状とヒント : docs/DEBUG_EXERCISES.md',
        '解答（講師用）: docs/DEBUG_ANSWERS.md',
      ].join('\n'),
    )
}
