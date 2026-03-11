import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [profile, setProfile] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [logTypes, setLogTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPartner();
    loadLogTypes();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(data);
  };

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

  const loadLogTypes = async () => {
    const { data } = await supabase.from('log_types').select('*').order('display_order');
    setLogTypes(data ?? []);
  };

  const getPartnerName = () => {
    if (!partner || !user) return '';
    const isRequester = partner.requester_id === user.id;
    const p = isRequester ? partner.partner : partner.requester;
    return p?.nickname ?? p?.email ?? '파트너';
  };

  const generateCode = async () => {
    if (!user) return;
    setLoading(true);

    await supabase.from('invite_codes').delete().eq('user_id', user.id).eq('is_used', false);

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

    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inputCode.toUpperCase())
      .eq('is_used', false)
      .single();

    if (!invite) { setLoading(false); return Alert.alert('오류', '유효하지 않은 초대코드입니다'); }
    if (new Date(invite.expires_at) < new Date()) { setLoading(false); return Alert.alert('오류', '만료된 초대코드입니다'); }
    if (invite.user_id === user.id) { setLoading(false); return Alert.alert('오류', '본인의 초대코드는 사용할 수 없습니다'); }

    const { error } = await supabase
      .from('partner_links')
      .insert({ requester_id: invite.user_id, partner_id: user.id, status: 'accepted' });

    if (error) { setLoading(false); return Alert.alert('오류', error.message); }

    await supabase.from('invite_codes').update({ is_used: true }).eq('id', invite.id);
    setLoading(false);
    setInputCode('');
    Alert.alert('완료', '파트너와 연결되었습니다!');
    loadPartner();
  };

  const disconnect = () => {
    Alert.alert('연결 해제', '파트너 연결을 해제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제', style: 'destructive',
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      {/* 프로필 & 파트너 */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.profileItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.nickname?.[0] ?? '나'}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.nickname ?? '나'}</Text>
          </View>

          {partner ? (
            <>
              <Text style={styles.heartIcon}>❤️</Text>
              <View style={styles.profileItem}>
                <View style={[styles.avatar, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.avatarText, { color: '#1976D2' }]}>
                    {getPartnerName()[0]}
                  </Text>
                </View>
                <Text style={styles.profileName}>{getPartnerName()}</Text>
              </View>
            </>
          ) : (
            <View style={styles.profileItem}>
              <View style={[styles.avatar, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.avatarText, { color: '#ccc' }]}>?</Text>
              </View>
              <Text style={[styles.profileName, { color: '#ccc' }]}>파트너 없음</Text>
            </View>
          )}
        </View>

        {partner ? (
          <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
            <Text style={styles.disconnectText}>연결 해제</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.partnerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={generateCode} disabled={loading}>
              <Text style={styles.actionBtnText}>초대코드 생성</Text>
            </TouchableOpacity>
            {inviteCode ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{inviteCode}</Text>
                <Text style={styles.codeHint}>24시간 유효 | 파트너에게 공유</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <TextInput
              style={styles.codeInput}
              placeholder="초대코드 입력"
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.actionBtn, !inputCode.trim() && { opacity: 0.5 }]}
              onPress={connectByCode}
              disabled={loading || !inputCode.trim()}
            >
              <Text style={styles.actionBtnText}>연결하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 기록 항목 관리 (향후) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>기록 항목</Text>
        {logTypes.map((lt) => (
          <View key={lt.id} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{lt.name}</Text>
            <Text style={styles.settingCategory}>{lt.category}</Text>
          </View>
        ))}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => {
        Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: signOut },
        ]);
      }}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#E91E63', marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 16 },
  profileItem: { alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FCE4EC',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#E91E63' },
  profileName: { fontSize: 14, fontWeight: '600', color: '#333' },
  heartIcon: { fontSize: 24, marginTop: -12 },
  partnerActions: { marginTop: 8 },
  actionBtn: {
    backgroundColor: '#E91E63', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  codeBox: { backgroundColor: '#FFF5F5', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  codeText: { fontSize: 28, fontWeight: 'bold', color: '#E91E63', letterSpacing: 4 },
  codeHint: { fontSize: 11, color: '#999', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F0E0E0', marginVertical: 12 },
  codeInput: {
    backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 18, textAlign: 'center',
    borderWidth: 1, borderColor: '#F0E0E0', marginBottom: 8, letterSpacing: 4,
  },
  disconnectBtn: {
    borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E57373',
  },
  disconnectText: { color: '#E57373', fontSize: 14 },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  settingLabel: { fontSize: 15, color: '#333' },
  settingCategory: { fontSize: 13, color: '#999' },
  logoutBtn: {
    marginHorizontal: 16, borderRadius: 12, padding: 16, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E57373',
  },
  logoutText: { color: '#E57373', fontSize: 16, fontWeight: '600' },
});
