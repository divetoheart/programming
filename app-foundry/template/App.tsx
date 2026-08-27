import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getProStatus, initializePurchases, openPaywall } from './src/lib/purchases';

export default function App() {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    initializePurchases().then(() => getProStatus()).then(setIsPro).catch(() => setIsPro(false));
  }, []);

  async function handleUpgrade() {
    await openPaywall();
    setIsPro(await getProStatus());
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>APP FOUNDRY</Text>
        <Text style={styles.title}>__APP_NAME__</Text>
        <Text style={styles.body}>
          Replace this screen with the product. Keep the infrastructure boring.
        </Text>
        <Text style={styles.status}>Entitlement: {isPro ? 'PRO' : 'FREE'}</Text>
        {!isPro && (
          <Pressable style={styles.button} onPress={handleUpgrade}>
            <Text style={styles.buttonText}>Unlock Pro</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    gap: 16,
  },
  eyebrow: {
    color: '#8c8c99',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
  },
  body: {
    color: '#b8b8c2',
    fontSize: 17,
    lineHeight: 25,
  },
  status: {
    color: '#ffffff',
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#0b0b0f',
    fontWeight: '800',
  },
});
