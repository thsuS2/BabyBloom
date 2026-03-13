import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius } from '../design';
import { Button } from '../design/components';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendSignUpCode = useAuthStore((s) => s.sendSignUpCode);
  const signUp = useAuthStore((s) => s.signUp);

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
    if (!password) return Alert.alert('알림', '비밀번호를 입력해주세요');
    if (password.length < 6) return Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다');

    setLoading(true);
    try {
      await sendSignUpCode(email);
      setStep('verify');
      startTimer();
      Alert.alert('발송 완료', '인증 코드가 이메일로 발송되었습니다');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      Alert.alert('발송 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await sendSignUpCode(email);
      setCode('');
      startTimer();
      Alert.alert('재발송 완료', '새 인증 코드가 발송되었습니다');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      Alert.alert('발송 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!code) return Alert.alert('알림', '인증 코드를 입력해주세요');
    if (code.length !== 6) return Alert.alert('알림', '6자리 인증 코드를 입력해주세요');

    setLoading(true);
    try {
      await signUp(email, password, code, nickname || undefined);
      if (intervalRef.current) clearInterval(intervalRef.current);
      Alert.alert('완료', '회원가입이 완료되었습니다!');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      Alert.alert('회원가입 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Text style={s.title}>회원가입</Text>

          {step === 'form' ? (
            <>
              <TextInput
                style={s.input}
                placeholder="닉네임 (선택)"
                placeholderTextColor={colors.textTertiary}
                value={nickname}
                onChangeText={setNickname}
              />
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
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
              <Text style={s.desc}>이메일로 발송된 6자리 인증 코드를 입력해주세요</Text>

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

              <Button
                title={loading ? '가입 중...' : '회원가입 완료'}
                onPress={handleSignUp}
                disabled={loading || timer === 0}
                style={{ marginTop: spacing.sm }}
              />

              <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                <Text style={s.link}>인증코드 재발송</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStep('form'); setCode(''); if (intervalRef.current) clearInterval(intervalRef.current); }}>
                <Text style={s.link}>이메일 변경</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.link}>이미 계정이 있으신가요? 로그인</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 32,
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
