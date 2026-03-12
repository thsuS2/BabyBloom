import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

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
    setTimer(300); // 5분
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>회원가입</Text>

        {step === 'form' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="닉네임 (선택)"
              value={nickname}
              onChangeText={setNickname}
            />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? '발송 중...' : '인증코드 발송'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>{email}</Text>
            <Text style={styles.desc}>이메일로 발송된 6자리 인증 코드를 입력해주세요</Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="인증 코드 6자리"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            {timer > 0 && (
              <Text style={styles.timer}>남은 시간: {formatTime(timer)}</Text>
            )}
            {timer === 0 && step === 'verify' && (
              <Text style={styles.expired}>인증 코드가 만료되었습니다</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading || timer === 0}>
              <Text style={styles.buttonText}>{loading ? '가입 중...' : '회원가입 완료'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResendCode} disabled={loading}>
              <Text style={styles.link}>인증코드 재발송</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('form'); setCode(''); if (intervalRef.current) clearInterval(intervalRef.current); }}>
              <Text style={styles.link}>이메일 변경</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#E91E63', textAlign: 'center', marginBottom: 32 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F0E0E0', fontSize: 16,
  },
  codeInput: {
    textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#E91E63', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#E91E63', textAlign: 'center', marginTop: 20, fontSize: 14 },
  timer: { color: '#E91E63', textAlign: 'center', fontSize: 14, marginBottom: 8 },
  expired: { color: '#999', textAlign: 'center', fontSize: 14, marginBottom: 8 },
});
