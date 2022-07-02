import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import * as SplashScreen from 'expo-splash-screen'
import { BackHandler, Platform, useWindowDimensions, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import WebView from 'react-native-webview'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import GoBackGesture from './GoBackGesture'
import isAdsUrl from '../utils/isAdsUrl'

const INJECTED_STYLES = `
html, body {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

html[data-ver="desktop"], html[data-ver="desktop"] body {
  overflow: hidden;
}

html[data-page-type="thread"][data-ver="mobile"] ._1H_MPAqZWxI0DjGT6LORkT {
  visibility: hidden !important;
}

html[data-page-type="thread"][data-ver="mobile"] ._1DZ_Nn0pmLuOkdbW3sB_4B > span:first-child {
  display: none !important;
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
  document.documentElement.setAttribute('data-ver', window.innerWidth >= 768 ? 'desktop' : 'mobile')
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
  
  document.documentElement.setAttribute('data-page-type', pageType)

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

function LIHKG() {
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
      e.url.startsWith('https://lih.kg/')
    )
      return true

    // save some traffic by fucking ads
    if (isAdsUrl(e.url)) return false

    if (e.navigationType === 'click') {
      async function openLink() {
        // try to open youtube link in youtube app
        if (e.url.indexOf('youtube.com/watch?v=') !== -1) {
          const ytLink = e.url.replace(/https?/, 'youtube')
          if (await Linking.canOpenURL(ytLink)) {
            await Linking.openURL(ytLink)
            return
          }
        }

        await Linking.openURL(e.url)
      }

      openLink().then()
      return false
    }

    return true
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

  const onGoBackGesture = useCallback(() => {
    if (!webViewRef.current) return

    // click the back button, and close the navbar
    webViewRef.current.goBack()
    webViewRef.current
      .injectJavaScript(`document.querySelector('._3DGiuOeHzi-9xAeU4GPqcb').click()
      document.querySelector('._2avg7BNCZG5kjB9vMIsfGj').style.left = '-280px'
      document.querySelector('._3DGiuOeHzi-9xAeU4GPqcb').style.opacity = '0'
      document.querySelector('._1H_MPAqZWxI0DjGT6LORkT').className = '_1H_MPAqZWxI0DjGT6LORkT'`)
  }, [])

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      const { hostname, queryParams } = Linking.parse(event.url)
      if (hostname === 'open_topic') {
        const { thread_id, page, order } = queryParams
        const actualUrl =
          'https://lihkg.com/thread/' +
          encodeURIComponent(thread_id) +
          '/page/' +
          encodeURIComponent(page) +
          '?order=' +
          encodeURIComponent(order)

        if (webViewRef.current)
          webViewRef.current.injectJavaScript(
            'location.href = ' + JSON.stringify(actualUrl)
          )
      }
    })

    return () => subscription.remove()
  }, [])

  const { width } = useWindowDimensions()

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: darkMode ? '#222' : 'white',
      }}
    >
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <GoBackGesture
        enable={width < 768 && pageType === 'thread'}
        onGesture={onGoBackGesture}
      >
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
      </GoBackGesture>
    </View>
  )
}

export default forwardRef(LIHKG)
