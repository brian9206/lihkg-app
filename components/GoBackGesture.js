import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'

const THRESHOLD = 100

export default function GoBackGesture({ children, enable, onGesture }) {
  const touchXRef = useRef(new Animated.Value(0))
  const startXRef = useRef(new Animated.Value(0))
  const dotAnimRef = useRef(new Animated.Value(0))
  const [passThreshold, setPassThreshold] = useState(false)

  const { width } = useWindowDimensions()

  const onGestureEvent = useCallback(
    Animated.event([{ nativeEvent: { x: touchXRef.current } }], {
      useNativeDriver: true,
      listener: ({ nativeEvent }) => {
        if (!enable) return

        const pass = nativeEvent.x + startXRef.current._value >= THRESHOLD

        if (pass && !passThreshold) {
          Haptics.impactAsync(ImpactFeedbackStyle.Light).then()
          Animated.timing(dotAnimRef.current, undefined).stop()
          Animated.timing(dotAnimRef.current, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start()
        } else if (!pass && passThreshold) {
          Animated.timing(dotAnimRef.current, undefined).stop()
          Animated.timing(dotAnimRef.current, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }).start()
        }

        setPassThreshold(pass)
      },
    }),
    [passThreshold, enable]
  )

  const onHandlerStateChange = useCallback(
    ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        Animated.timing(touchXRef.current, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()

        Animated.timing(startXRef.current, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()

        Animated.timing(dotAnimRef.current, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()

        if (passThreshold) {
          if (onGesture) onGesture()
        }
      } else if (nativeEvent.state === State.BEGAN) {
        startXRef.current.setValue(-nativeEvent.x)
      }
    },
    [passThreshold]
  )

  return (
    <PanGestureHandler
      enabled={enable}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={styles.root}>
        {children}
        <Animated.View
          style={[
            styles.wrapper,
            {
              transform: [
                {
                  translateX: Animated.add(
                    Animated.add(
                      touchXRef.current,
                      startXRef.current
                    ).interpolate({
                      inputRange: [0, THRESHOLD],
                      outputRange: [0, THRESHOLD],
                      extrapolate: 'clamp',
                    }),
                    new Animated.Value(-width)
                  ),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [
                  {
                    scale: dotAnimRef.current.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 30 / 2,
    backgroundColor: '#42a5f5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
