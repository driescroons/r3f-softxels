import { useFrame, useThree } from '@react-three/fiber'
import { DefaultXRControllers, useXR, useXREvent, XREvent } from '@react-three/xr'
import {
  Mesh,
  MeshBasicMaterial,
  BoxBufferGeometry,
  Color,
  Raycaster,
  Object3D,
  Matrix4,
  AudioLoader,
  PositionalAudio,
  AudioListener,
  Vector3
} from 'three'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { useStore } from './store'

// @ts-ignore
import soundPlop from 'url:./sounds/plop.ogg'

interface Props {}

export default function Controllers({}: Props): ReactElement {
  const { controllers, player } = useXR()
  const { scene, camera } = useThree()
  const [rays] = React.useState(new Map<number, Mesh>())
  const world = useStore((store) => store.world)
  const [sfx, setSfx] = useState([])

  const canRotate = useRef(true)

  const [raycaster] = React.useState(() => new Raycaster())
  const [audioListener] = React.useState(() => new AudioListener())

  useXREvent('selectstart', (e: XREvent) => {
    // setup the raycaster
    const tempMatrix = new Matrix4()
    tempMatrix.identity().extractRotation(e.controller.controller.matrixWorld)
    raycaster.ray.origin.setFromMatrixPosition(e.controller.controller.matrixWorld)
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

    // check for an intersection
    const [hit] = raycaster.intersectObjects(world.current.children)

    if (hit) {
      hit.point.addScaledVector(hit.face.normal.normalize(), 0.25 * (e.controller.inputSource.handedness === 'left' ? -1 : 1))
      const affected = world.current.updateVolume(hit.point, 1, e.controller.inputSource.handedness === 'left' ? 0 : 0xff)

      if (affected && sfx) {
        const audio = sfx.find(({ isPlaying }) => !isPlaying)
        if (audio) {
          console.log(audio)
          audio.filters[0].type = e.controller.inputSource.handedness === 'left' ? 'highpass' : 'lowpass'
          audio.filters[0].frequency.value = (Math.random() + 0.5) * 1000
          audio.position.copy(hit.point)
          audio.play()
        }
      }
    }
  })

  useEffect(() => {
    const cleanups: any[] = []

    controllers.forEach(({ controller }) => {
      // setting up rays for the controllers
      const ray = new Mesh()
      ray.rotation.set(Math.PI / 2, 0, 0)
      ray.material = new MeshBasicMaterial({ color: new Color(0xffffff), opacity: 0.8, transparent: true })
      ray.geometry = new BoxBufferGeometry(0.002, 1, 0.002)

      rays.set(controller.id, ray)
      controller.add(ray)

      cleanups.push(() => {
        controller.remove(ray)
        rays.delete(controller.id)
      })
    })
    ;(async () => {
      const audioLoader = new AudioLoader()
      const buffer = await audioLoader.loadAsync(soundPlop)

      setSfx(
        [...Array(5)].map(() => {
          const audio = new PositionalAudio(audioListener)
          audio.filters.push(audio.context.createBiquadFilter())
          audio.setBuffer(buffer)
          audio.setRefDistance(8)
          scene.add(audio)
          return audio
        })
      )
    })()

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [controllers, scene, rays])

  useFrame(() => {
    controllers.forEach((it) => {
      const ray = rays.get(it.controller.id)
      if (!ray) return

      const rayLength = 5

      // Tiny offset to clip ray on AR devices
      // that don't have handedness set to 'none'
      const offset = -0.01
      ray.visible = true
      ray.scale.y = rayLength + offset
      ray.position.z = -rayLength / 2 - offset

      // check if we're using gamepads
      const { axes } = it?.inputSource?.gamepad ?? { axes: [0, 0, 0, 0] }
      const moving = axes.some((axis) => Math.abs(axis) > 0)

      if (moving) {
        const [, , x, y] = axes
        if (it.inputSource.handedness === 'left') {
          const v = new Vector3(x, 0, y)
          v.divideScalar(10)
          const tempMatrix = new Matrix4()
          tempMatrix.identity().extractRotation(camera.matrixWorld)
          v.applyMatrix4(tempMatrix)
          player.position.add(v)
        } else {
          if (canRotate.current) {
            player.rotateY(((x > 0 ? 1 : -1) * -Math.PI) / 6)
            canRotate.current = false
            // rotations at a 200ms delay
            setTimeout(() => {
              canRotate.current = true
            }, 200)
          }
        }
      }
    })
  })

  return <DefaultXRControllers />
}
