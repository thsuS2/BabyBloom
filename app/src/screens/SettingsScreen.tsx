import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius, layout } from '../design';
import { Card, Button } from '../design/components';

export default function SettingsScreen() {
  const navigation = useNavigation();
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
    <ScrollView style={s.container}>
      {/* 헤더 + 뒤로가기 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={s.backBtn}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={s.title}>설정</Text>
      </View>

      {/* 프로필 & 파트너 */}
      <Card>
        <View style={s.profileRow}>
          <View style={s.profileItem}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{profile?.nickname?.[0] ?? '나'}</Text>
            </View>
            <Text style={s.profileName}>{profile?.nickname ?? '나'}</Text>
          </View>

          {partner ? (
            <>
              <Text style={s.heartIcon}>❤️</Text>
              <View style={s.profileItem}>
                <View style={[s.avatar, { backgroundColor: colors.softBlueLight }]}>
                  <Text style={[s.avatarText, { color: colors.softBlue }]}>
                    {getPartnerName()[0]}
                  </Text>
                </View>
                <Text style={s.profileName}>{getPartnerName()}</Text>
              </View>
            </>
          ) : (
            <View style={s.profileItem}>
              <View style={[s.avatar, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[s.avatarText, { color: colors.textTertiary }]}>?</Text>
              </View>
              <Text style={[s.profileName, { color: colors.textTertiary }]}>파트너 없음</Text>
            </View>
          )}
        </View>

        {partner ? (
          <Button title="연결 해제" onPress={disconnect} variant="outline" size="small" />
        ) : (
          <View style={s.partnerActions}>
            <Button title="초대코드 생성" onPress={generateCode} disabled={loading} size="small" />
            {inviteCode ? (
              <View style={s.codeBox}>
                <Text style={s.codeText}>{inviteCode}</Text>
                <Text style={s.codeHint}>24시간 유효 | 파트너에게 공유</Text>
              </View>
            ) : null}

            <View style={s.divider} />

            <TextInput
              style={s.codeInput}
              placeholder="초대코드 입력"
              placeholderTextColor={colors.textTertiary}
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Button
              title="연결하기"
              onPress={connectByCode}
              disabled={loading || !inputCode.trim()}
              variant="secondary"
              size="small"
            />
          </View>
        )}
      </Card>

      {/* 기록 항목 */}
      <Card>
        <Text style={s.cardTitle}>기록 항목</Text>
        {logTypes.map((lt) => (
          <View key={lt.id} style={s.settingRow}>
            <Text style={s.settingLabel}>{lt.name}</Text>
            <Text style={s.settingCategory}>{lt.category}</Text>
          </View>
        ))}
      </Card>

      {/* 로그아웃 */}
      <TouchableOpacity style={s.logoutBtn} onPress={() => {
        Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: signOut },
        ]);
      }}>
        <Text style={s.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xxl,
    paddingTop: layout.screenPaddingTop,
  },
  backBtn: {
    ...typography.body2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  cardTitle: {
    ...typography.subtitle2,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.lg,
  },
  profileItem: {
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  profileName: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  heartIcon: {
    fontSize: 24,
    marginTop: -spacing.md,
  },
  partnerActions: {
    marginTop: spacing.sm,
  },
  codeBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  codeText: {
    ...typography.code,
    color: colors.primary,
  },
  codeHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  codeInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    ...typography.numberSmall,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    letterSpacing: 4,
    color: colors.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLabel: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  settingCategory: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutBtn: {
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    ...typography.subtitle1,
    color: colors.error,
  },
});
