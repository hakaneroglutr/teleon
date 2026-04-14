// src/screens/SplashScreen.tsx  (Faz 3)
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions, StatusBar} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {RootNavProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {useServerStore} from '@store/serverStore';
import {DEMO_SERVER} from '@config/servers';

const {width} = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<RootNavProp>();
  const servers    = useServerStore((s) => s.servers);
  const addServer  = useServerStore((s) => s.addServer);

  const logoScale   = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden(true);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   {toValue: 1, useNativeDriver: true, tension: 55, friction: 8}),
        Animated.timing(logoOpacity, {toValue: 1, useNativeDriver: true, duration: 550}),
      ]),
      Animated.timing(tagOpacity, {toValue: 1, useNativeDriver: true, duration: 350}),
      Animated.timing(barWidth,   {toValue: width * 0.52, useNativeDriver: false, duration: 1000}),
    ]).start(() => {
      StatusBar.setHidden(false);
      setTimeout(() => {
        if (servers.length === 0) {
          addServer(DEMO_SERVER);
        }
        navigation.replace('Main');
      }, 300);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.grid} pointerEvents="none">
        {Array.from({length: 7}).map((_, i) => (
          <View key={i} style={[styles.gridLine, {top: i * 130 - 30}]} />
        ))}
      </View>
      <Animated.View style={[styles.logoRow, {opacity: logoOpacity, transform: [{scale: logoScale}]}]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoT}>T</Text>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.logoWord}>ELEON</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, {opacity: tagOpacity}]}>
        Her kanal, her an
      </Animated.Text>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, {width: barWidth}]} />
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  {flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center'},
  grid:       {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  gridLine:   {position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.white10, transform: [{rotate: '-7deg'}, {scaleX: 1.4}]},
  logoRow:    {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
  logoMark:   {width: 58, height: 58, backgroundColor: Colors.accent, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 10},
  logoT:      {fontSize: 34, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1, lineHeight: 38},
  logoDot:    {position: 'absolute', bottom: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textPrimary},
  logoWord:   {fontSize: 42, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 6},
  tagline:    {fontSize: 13, color: Colors.textTertiary, letterSpacing: 2.5, marginBottom: 48, textTransform: 'uppercase'},
  track:      {width: width * 0.52, height: 3, backgroundColor: Colors.white10, borderRadius: 2, overflow: 'hidden'},
  bar:        {height: '100%', backgroundColor: Colors.accent, borderRadius: 2},
  version:    {position: 'absolute', bottom: 32, fontSize: 11, color: Colors.textTertiary, letterSpacing: 1},
});
