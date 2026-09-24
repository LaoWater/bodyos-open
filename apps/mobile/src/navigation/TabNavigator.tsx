import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { PostureScreen } from '../screens/PostureScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { ProfileStack } from './ProfileStack';
import { GlassTabBar } from '../components/glass/GlassTabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false, // Mount all tabs eagerly — Camera is warm on first tap
        freezeOnBlur: true, // Freeze unfocused tabs to save CPU
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Posture" component={PostureScreen} options={{ title: 'Scan' }} />
      <Tab.Screen name="Camera" component={CameraScreen} options={{ title: 'Record' }} />
      <Tab.Screen name="Coach" component={AssistantScreen} options={{ title: 'Coach' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
