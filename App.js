import { StatusBar } from 'expo-status-bar'
import { BackHandler, Platform, StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Linking from 'expo-linking'
import * as SplashScreen from 'expo-splash-screen'
import OTAUpdater from './OTAUpdater'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'

const INJECTED_STYLES = `
html, body {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

html.ver-desktop, html.ver-desktop body {
  overflow: hidden;
}
`

const INJECTED_JAVASCRIPT = `
let pageType = 'other'

const observer = new MutationObserver((mutationList, observer) => {
  // remove open in app
  const openInAppDiv = document.querySelector('.K8RRn4bHyCRrG1IjoFbTr')
  if (openInAppDiv) openInAppDiv.remove()
  
  // remove fucking ads
  document.querySelectorAll('.WAy0Ey7yZXz96vkCPtKCd, ._3t1IIUwX87Q7giYt9CBgsT, .D0MIrDaQVCROYmrlpFNJp').forEach(e => {
    e.src = 'about:blank'   // in case of iframe
    e.innerHTML = ''
  })
  
  // remove game button as it is not working
  document.querySelectorAll('[title="Game Center"]').forEach(e => {
    e.title = ''
    e.className = ''
    e.innerHTML = ''
  })
  
  // remove footer
  document.querySelectorAll('._2DLdp-7b_R-zIetW0YAyy_').forEach(e => {
    e.innerHTML = '<br><br>'
    e.className = 'fucked'
  })
  
  // hide navbar
  const navbar = document.querySelector('._1H_MPAqZWxI0DjGT6LORkT')
  if (navbar) navbar.style.visibility = (pageType === 'thread' && window.innerWidth < 768) ? 'hidden' : ''
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})

// hook localStorage
const localStorageSetItem = localStorage.setItem.bind(localStorage)
localStorage.setItem = (key, value) => {
  localStorageSetItem(key, value)
  
  if (key === 'modesettings') {
    _onModeSettingsChanged()
  }
}

function _onModeSettingsChanged() {
  let config
  
  try {
    config = JSON.parse(localStorage.modesettings)[0]
    if (!config) return
  } catch (err) {
    return
  }
  
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'configChanged',
    config
  }))
}

_onModeSettingsChanged()

// detect desktop version
function _onResize() {
  document.documentElement.className = 'ver-' + (window.innerWidth >= 768 ? 'desktop' : 'mobile')
}

window.addEventListener('resize', () => setTimeout(_onResize, 500))
_onResize()

// custom style injection
const style = document.createElement('style')
style.innerText = \`${INJECTED_STYLES}\`
document.head.appendChild(style)

// detect current page
function _onLocationChanged() {  
  if (location.href.indexOf('/thread/') !== -1) {
    pageType = 'thread'
  }
  else if (location.href.indexOf('/category/') !== -1) {
    pageType = 'category'
  }
  else {
    pageType = 'other'
  }

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'pageChanged',
    pageType
  }))
}

window.history.pushState = new Proxy(window.history.pushState, {
  apply: (target, thisArg, argArray) => {
    const retval = target.apply(thisArg, argArray)
    _onLocationChanged()
    return retval
  }
})

window.history.replaceState = new Proxy(window.history.replaceState, {
  apply: (target, thisArg, argArray) => {
    const retval = target.apply(thisArg, argArray)
    _onLocationChanged()
    return retval
  }
})

window.addEventListener('popstate', _onLocationChanged)
`

function App() {
  const insets = useSafeAreaInsets()
  const [darkMode, setDarkMode] = useState(false)
  const [pageType, setPageType] = useState('other')
  const webViewRef = useRef()

  const onMessage = useCallback((e) => {
    const event = JSON.parse(e.nativeEvent.data)
    if (event.type === 'configChanged') {
      setDarkMode(event.config.darkMode)
    } else if (event.type === 'pageChanged') {
      setPageType(event.pageType)
    }
  }, [])

  const onShouldStartLoadWithRequest = useCallback((e) => {
    if (
      e.url.startsWith('https://lihkg.com/') ||
      e.url.startsWith('https://lih.kg/') ||
      e.url.indexOf('recaptcha') !== -1
    )
      return true

    if (e.navigationType === 'click') {
      Linking.openURL(e.url).then()
    }

    return false
  }, [])

  const onLoadEnd = useCallback(() => {
    setTimeout(() => SplashScreen.hideAsync().then(), 100)
  }, [])

  useEffect(() => {
    async function ready() {
      await SplashScreen.preventAutoHideAsync()
    }
    ready().then()

    const handleBackPressed = () => {
      if (webViewRef.current) webViewRef.current.goBack()
    }

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', handleBackPressed)

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackPressed)
      }
    }
  }, [])

  const flingGestureRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      if (!webViewRef.current || pageType !== 'thread') return

      // click the back button, and close the navbar
      webViewRef.current.injectJavaScript(`
        document.querySelector('.Po8iCa0b9ZUovZ9Ofa_Gk').click()
        document.querySelector('._3DGiuOeHzi-9xAeU4GPqcb').click()`)

      setTimeout(() => {
        // fixup navbar
        webViewRef.current.injectJavaScript(`
          document.querySelector('._2avg7BNCZG5kjB9vMIsfGj').style.left = '-280px'
          document.querySelector('._3DGiuOeHzi-9xAeU4GPqcb').style.opacity = '0'
          document.querySelector('._1H_MPAqZWxI0DjGT6LORkT').className = '_1H_MPAqZWxI0DjGT6LORkT'`)
      }, 10)
    })

  return (
    <GestureDetector gesture={flingGestureRight}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            backgroundColor: darkMode ? '#222' : 'white',
          },
        ]}
      >
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <WebView
          style={{ flex: 1, backgroundColor: darkMode ? '#151515' : '#f6f6f6' }}
          source={{ uri: 'https://lihkg.com' }}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
          allowsBackForwardNavigationGestures={true}
          decelerationRate={0.995}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          autoManageStatusBarEnabled={false}
          ref={webViewRef}
        />
        <OTAUpdater />
      </View>
    </GestureDetector>
  )
}

export default function Main() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <App />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
