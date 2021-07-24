import produce, { setAutoFreeze } from 'immer'
import createStore, { State as ZustandState, StateCreator } from 'zustand'
import { MutableRefObject } from 'react'

const immer =
  <T extends ZustandState>(config: StateCreator<T, (fn: (state: T) => void) => void>): StateCreator<T> =>
  (set, get, api) =>
    config((fn) => set(produce(fn) as (state: T) => T), get, api)

setAutoFreeze(false)

export type State = {
  world: null | MutableRefObject<any>
  set: (fn: (state: State) => void | State) => void
}

export const useStore = createStore<State>(
  immer((set, get, api) => {
    return {
      world: null,
      set: (fn: (state: State) => State) => {
        set(fn)
      }
    }
  })
)
