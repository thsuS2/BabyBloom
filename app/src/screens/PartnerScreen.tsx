import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function PartnerScreen() {
  const user = useAuthStore((s) => s.user);
  const [partner, setPartner] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPartner();
  }, []);

  const loadPartner = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('partner_links')
      .select('*, requester:users!requester_id(*), partner:users!partner_id(*)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
      .single();

    setPartner(data);
  };

  const generateCode = async () => {
    if (!user) return;
    setLoading(true);

    // 기존 미사용 코드 삭제
    await supabase
      .from('invite_codes')
      .delete()
      .eq('user_id', user.id)
      .eq('is_used', false);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('invite_codes')
      .insert({ user_id: user.id, code, expires_at: expiresAt });

    setLoading(false);
    if (error) return Alert.alert('오류', error.message);
    setInviteCode(code);
  };

  const connectByCode = async () => {
    if (!user || !inputCode.trim()) return;
    setLoading(true);

    // 코드 조회
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inputCode.toUpperCase())
      .eq('is_used', false)
      .single();

    if (!invite) {
      setLoading(false);
      return Alert.alert('오류', '유효하지 않은 초대코드입니다');
    }

    if (new Date(invite.expires_at) < new Date()) {
      setLoading(false);
      return Alert.alert('오류', '만료된 초대코드입니다');
    }

    if (invite.user_id === user.id) {
      setLoading(false);
      return Alert.alert('오류', '본인의 초대코드는 사용할 수 없습니다');
    }

    // 파트너 연결
    const { error: linkError } = await supabase
      .from('partner_links')
      .insert({
        requester_id: invite.user_id,
        partner_id: user.id,
        status: 'accepted',
      });

    if (linkError) {
      setLoading(false);
      return Alert.alert('오류', linkError.message);
    }

    // 코드 사용 처리
    await supabase.from('invite_codes').update({ is_used: true }).eq('id', invite.id);

    setLoading(false);
    setInputCode('');
    Alert.alert('완료', '파트너와 연결되었습니다!');
    loadPartner();
  };

  const disconnect = async () => {
    Alert.alert('연결 해제', '파트너 연결을 해제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await supabase
            .from('partner_links')
            .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
            .eq('status', 'accepted')
            .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`);
          setPartner(null);
        },
      },
    ]);
  };

  const getPartnerName = () => {
    if (!partner || !user) return '';
    const isRequester = partner.requester_id === user.id;
    const p = isRequester ? partner.partner : partner.requester;
    return p?.nickname ?? p?.email ?? '파트너';
  };

  if (partner) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>파트너</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.partnerName}>{getPartnerName()}</Text>
          <Text style={styles.partnerStatus}>연결됨</Text>
        </View>
        <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
          <Text style={styles.disconnectText}>연결 해제</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>파트너 연결</Text>
        <Text style={styles.subtitle}>초대코드로 파트너와 연결하세요</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>초대코드 생성</Text>
        <TouchableOpacity style={styles.button} onPress={generateCode} disabled={loading}>
          <Text style={styles.buttonText}>초대코드 만들기</Text>
        </TouchableOpacity>
        {inviteCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode}</Text>
            <Text style={styles.codeHint}>24시간 내 유효 | 파트너에게 공유하세요</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>초대코드 입력</Text>
        <TextInput
          style={styles.input}
          placeholder="6자리 코드 입력"
          value={inputCode}
          onChangeText={setInputCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity style={styles.button} onPress={connectByCode} disabled={loading || !inputCode.trim()}>
          <Text style={styles.buttonText}>연결하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#E91E63', marginBottom: 12 },
  button: {
    backgroundColor: '#E91E63', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  codeBox: {
    marginTop: 16, backgroundColor: '#FFF5F5', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  codeText: { fontSize: 32, fontWeight: 'bold', color: '#E91E63', letterSpacing: 4 },
  codeHint: { fontSize: 12, color: '#999', marginTop: 8 },
  input: {
    backgroundColor: '#FAFAFA', borderRadius: 8, padding: 14, fontSize: 20, textAlign: 'center',
    borderWidth: 1, borderColor: '#F0E0E0', marginBottom: 12, letterSpacing: 4,
  },
  partnerName: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  partnerStatus: { fontSize: 14, color: '#4CAF50', textAlign: 'center', marginTop: 8 },
  disconnectBtn: {
    marginHorizontal: 16, borderRadius: 10, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E57373',
  },
  disconnectText: { color: '#E57373', fontSize: 15 },
});
