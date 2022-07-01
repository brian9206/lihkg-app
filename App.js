import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
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

const INJECTED_STYLES = `
html, body {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

html.ver-desktop, html.ver-desktop body {
  overflow: hidden;
}
`

const INJECTED_JAVASCRIPT = `
const observer = new MutationObserver((mutationList, observer) => {
  // remove open in app
  const openInAppDiv = document.querySelector('.K8RRn4bHyCRrG1IjoFbTr')
  if (openInAppDiv) openInAppDiv.remove()
  
  // remove fucking ads
  document.querySelectorAll('.WAy0Ey7yZXz96vkCPtKCd, ._3t1IIUwX87Q7giYt9CBgsT, iframe').forEach(e => {
    e.src = 'about:blank'   // in case of iframe
    e.innerHTML = ''
  })
  
  // remove footer
  document.querySelectorAll('._2DLdp-7b_R-zIetW0YAyy_').forEach(e => {
    e.innerHTML = '<br><br>'
    e.className = 'fucked'
  })
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

window.addEventListener('resize', _onResize)
_onResize()

// custom style injection
const style = document.createElement('style')
style.innerText = \`${INJECTED_STYLES}\`
document.head.appendChild(style)
`

function App() {
  const insets = useSafeAreaInsets()
  const [darkMode, setDarkMode] = useState(false)

  const onMessage = useCallback((e) => {
    const event = JSON.parse(e.nativeEvent.data)
    if (event.type === 'configChanged') {
      setDarkMode(event.config.darkMode)
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
  }, [])

  return (
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
        allowsFullscreenVideo={false}
      />
      <OTAUpdater />
    </View>
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
