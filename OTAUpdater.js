import React, { useEffect, useRef, useState } from 'react'
import * as Updates from 'expo-updates'
import {
  Animated,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'

export default function OTAUpdater() {
  const [appState, setAppState] = useState('active')
  const [shouldReloadOnActive, setShouldReloadOnActive] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const anim = useRef(new Animated.Value(0))

  useEffect(() => {
    async function ready() {
      // we only want trigger OTA updates when the user is coming back to the app without reloading
      if (appState !== 'active') {
        return
      }

      if (shouldReloadOnActive) {
        await Updates.reloadAsync()
        return
      }

      try {
        const checkUpdateResult = await Updates.checkForUpdateAsync()
        if (!checkUpdateResult.isAvailable) {
          return
        }

        const fetchResult = await Updates.fetchUpdateAsync()
        if (fetchResult.isNew) {
          // new update available. reload next time when the user comes back
          setShouldReloadOnActive(true)
          open()
        }
      } catch (err) {
        console.log('Unable to check for updates', err)
        open()
      }
    }
    ready().then()
  }, [appState])

  useEffect(() => {
    function handleAppStateChanged(appState) {
      setAppState(appState)
    }

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChanged
    )
    return () => subscription.remove()
  }, [])

  function open() {
    setIsVisible(true)
    Animated.timing(anim.current, undefined).stop()
    Animated.timing(anim.current, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  function close() {
    Animated.timing(anim.current, undefined).stop()
    Animated.timing(anim.current, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false)
    })
  }

  async function applyUpdate() {
    await Updates.reloadAsync()
  }

  if (!isVisible) {
    return null
  }

  return (
    <Animated.View style={[styles.root, { opacity: anim.current }]}>
      <View style={styles.bar}>
        <FontAwesome name="download" color="#fff" size={24} />
        <View style={styles.message}>
          <Text style={[styles.text, styles.title]}>有可用的更新</Text>
          <Text style={[styles.text, styles.description]}>
            新更新已下載及準備就緒，並將會在下次重新啟動時生效。
          </Text>
        </View>
        <View style={styles.action}>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={applyUpdate}>
            <Text style={[styles.text, { color: '#fff', fontWeight: 'bold' }]}>
              立即重啟
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close}>
            <Text style={styles.text}>稍後再說</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    width: '100%',
    bottom: 70,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: '95%',
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.49,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
  message: {
    marginHorizontal: 12,
    flex: 1,
  },
  action: {
    flexDirection: 'row',
  },
})
