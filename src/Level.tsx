import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useRef } from 'react'
import { AmbientLight, MeshPhongMaterial, PointLight, SpotLight } from 'three'

import { useStore } from './store'

// @ts-ignore
import World from 'softxels'

export function Level() {
  const { scene, camera, gl } = useThree()
  const worldRef = useRef(
    new World({
      chunkMaterial: new MeshPhongMaterial({ vertexColors: true }),
      chunkSize: 32
    })
  )
  const set = useStore((store) => store.set)

  useEffect(() => {
    scene.add(worldRef.current)

    // light in front of the player
    const light = new SpotLight(0xffffff, 1, 32, Math.PI / 3, 1)
    light.target.position.set(0, 0, -1)
    light.add(light.target)
    camera.add(light)

    // global light
    const ambientLight = new AmbientLight(0x0a1a2a)
    ambientLight.intensity = 0.1
    scene.add(ambientLight)

    // light around the player
    const pointLight = new PointLight(0xffffff, 1, 1, 1)
    camera.add(pointLight)

    gl.setClearColor('0x0a1a2a')

    set((store) => {
      store.world = worldRef
    })
    return () => {
      scene.remove(worldRef.current)
      set((store) => {
        store.world = null
      })
    }
  }, [])

  useFrame(() => {
    worldRef.current.updateChunks(camera.position)
  })

  return null
}
