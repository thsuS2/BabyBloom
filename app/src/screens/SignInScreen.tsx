import React, { useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius } from '../design';
import { Button } from '../design/components';

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert('알림', '이메일과 비밀번호를 입력해주세요');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Image
          source={require('../../assets/BabyBloom.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.title}>BabyBloom</Text>
        <Text style={s.subtitle}>여성 웰니스 라이프로그</Text>

        <TextInput
          style={s.input}
          placeholder="이메일"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="비밀번호"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={loading ? '로그인 중...' : '로그인'}
          onPress={handleSignIn}
          disabled={loading}
          style={{ marginTop: spacing.sm }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={s.link}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body1,
    color: colors.textPrimary,
  },
  link: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
