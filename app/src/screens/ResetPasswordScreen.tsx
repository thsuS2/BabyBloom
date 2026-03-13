import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';
import { colors, typography, spacing, radius } from '../design';
import { Button } from '../design/components';

export default function ResetPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(300);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (!email) return Alert.alert('알림', '이메일을 입력해주세요');
    setLoading(true);
    try {
      await api.post('/auth/send-signup-code', { email });
      setStep('verify');
      startTimer();
      Alert.alert('발송 완료', '인증 코드가 이메일로 발송되었습니다');
    } catch (e: any) {
      Alert.alert('발송 실패', e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code) return Alert.alert('알림', '인증 코드를 입력해주세요');
    if (code.length !== 6) return Alert.alert('알림', '6자리 인증 코드를 입력해주세요');
    if (!newPassword) return Alert.alert('알림', '새 비밀번호를 입력해주세요');
    if (newPassword.length < 6) return Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
      Alert.alert('완료', data.message, [
        { text: '로그인하기', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('실패', e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.post('/auth/send-signup-code', { email });
      setCode('');
      startTimer();
      Alert.alert('재발송 완료', '새 인증 코드가 발송되었습니다');
    } catch (e: any) {
      Alert.alert('발송 실패', e.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.title}>비밀번호 재설정</Text>

        {step === 'email' ? (
          <>
            <Text style={s.desc}>가입한 이메일을 입력하면 인증 코드를 보내드립니다</Text>
            <TextInput
              style={s.input}
              placeholder="이메일"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button
              title={loading ? '발송 중...' : '인증코드 발송'}
              onPress={handleSendCode}
              disabled={loading}
              style={{ marginTop: spacing.sm }}
            />
          </>
        ) : (
          <>
            <Text style={s.subtitle}>{email}</Text>
            <Text style={s.desc}>이메일로 발송된 인증 코드와 새 비밀번호를 입력해주세요</Text>

            <TextInput
              style={[s.input, s.codeInput]}
              placeholder="인증 코드 6자리"
              placeholderTextColor={colors.textTertiary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            {timer > 0 && (
              <Text style={s.timer}>남은 시간: {formatTime(timer)}</Text>
            )}
            {timer === 0 && step === 'verify' && (
              <Text style={s.expired}>인증 코드가 만료되었습니다</Text>
            )}

            <TextInput
              style={s.input}
              placeholder="새 비밀번호 (6자 이상)"
              placeholderTextColor={colors.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Button
              title={loading ? '변경 중...' : '비밀번호 변경'}
              onPress={handleReset}
              disabled={loading || timer === 0}
              style={{ marginTop: spacing.sm }}
            />

            <TouchableOpacity onPress={handleResendCode} disabled={loading}>
              <Text style={s.link}>인증코드 재발송</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setNewPassword(''); if (intervalRef.current) clearInterval(intervalRef.current); }}>
              <Text style={s.link}>이메일 변경</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>로그인으로 돌아가기</Text>
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
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  desc: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  link: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  timer: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  expired: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
