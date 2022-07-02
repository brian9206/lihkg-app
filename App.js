import 'react-native-url-polyfill/auto'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import LIHKG from './components/LIHKG'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import OTAUpdater from './components/OTAUpdater'
import { View } from 'react-native'

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView>
        <View style={{ width: '100%', height: '100%' }}>
          <LIHKG />
          <OTAUpdater />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
