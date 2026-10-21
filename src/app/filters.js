import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Switch, View } from "react-native";
import Animated from "react-native-reanimated";
import Chip from "../components/Chip";
import { useAuth } from "../context/AuthProvider";
import { useEntitlements } from "../context/EntitlementsProvider";
import { DEPARTMENT_OPTIONS, getGraduationYearOptions } from "../lib/onboarding";
import { PREMIUM_FILTER_KEYS } from "../lib/premium";
import { RELATIONSHIP_GOALS } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, Button, enter, haptics, IconButton, PressableScale, Screen } from "../ui";

const AGE_FLOOR = 18;
const AGE_CEILING = 60; // shown as "60+"; stored as no upper limit

function AgeStepper({ label, value, onChange, min, max }) {
  const styles = useStyles();
  const step = (delta) => {
    const next = Math.min(Math.max(value + delta, min), max);
    if (next !== value) {
      haptics.select();
      onChange(next);
    }
  };
  return (
    <View style={styles.stepper}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <View style={styles.stepperRow}>
        <IconButton icon="minus" size={36} iconSize={12} background="surfaceAlt" onPress={() => step(-1)} disabled={value <= min} accessibilityLabel={`Decrease ${label}`} />
        <AppText variant="h2" style={styles.stepperValue}>
          {value >= AGE_CEILING ? `${AGE_CEILING}+` : value}
        </AppText>
        <IconButton icon="plus" size={36} iconSize={12} background="surfaceAlt" onPress={() => step(1)} disabled={value >= max} accessibilityLabel={`Increase ${label}`} />
      </View>
    </View>
  );
}

function Section({ title, premium, locked, onLockedPress, index, children }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <Animated.View entering={enter(index)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="label" color="textSecondary">
          {title}
        </AppText>
        {premium && (
          <View style={styles.premiumTag}>
            <FontAwesome5 name="crown" size={9} color={t.colors.onPrimary} />
            <AppText variant="small" color="onPrimary" style={{ fontSize: 10 }}>
              PREMIUM
            </AppText>
          </View>
        )}
      </View>
      <View style={locked && { opacity: 0.45 }} pointerEvents={locked ? "none" : "auto"}>
        {children}
      </View>
      {locked && <PressableScale style={StyleSheetFill} onPress={onLockedPress} accessibilityLabel={`Unlock ${title} filter`} />}
    </Animated.View>
  );
}

// Covers a locked section so any tap opens the Premium screen
const StyleSheetFill = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

export default function FiltersScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();
  const { is_premium } = useEntitlements();
  const saved = profile?.discovery_filters ?? {};

  const [ageMin, setAgeMin] = useState(saved.age_min ?? AGE_FLOOR);
  const [ageMax, setAgeMax] = useState(saved.age_max ?? AGE_CEILING);
  const [departments, setDepartments] = useState(saved.departments ?? []);
  const [gradYears, setGradYears] = useState(saved.grad_years ?? []);
  const [goals, setGoals] = useState(saved.goals ?? []);
  const [verifiedOnly, setVerifiedOnly] = useState(!!saved.verified_only);
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return [String(thisYear - 1), ...getGraduationYearOptions()];
  }, []);

  const toggle = (list, setList) => (value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const openPaywall = () => router.push({ pathname: "/premium", params: { reason: "filters" } });

  const reset = () => {
    haptics.light();
    setAgeMin(AGE_FLOOR);
    setAgeMax(AGE_CEILING);
    setDepartments([]);
    setGradYears([]);
    setGoals([]);
    setVerifiedOnly(false);
  };

  const apply = async () => {
    const filters = {};
    if (ageMin > AGE_FLOOR) filters.age_min = ageMin;
    if (ageMax < AGE_CEILING) filters.age_max = ageMax;
    if (is_premium) {
      if (departments.length) filters.departments = departments;
      if (gradYears.length) filters.grad_years = gradYears;
      if (goals.length) filters.goals = goals;
      if (verifiedOnly) filters.verified_only = true;
    } else {
      // Keep any Premium filters chosen earlier so they come back after upgrading
      PREMIUM_FILTER_KEYS.forEach((k) => {
        if (saved[k] !== undefined) filters[k] = saved[k];
      });
    }
    setSaving(true);
    const { error } = await updateProfile({ discovery_filters: filters });
    setSaving(false);
    if (error) return Alert.alert("Couldn't save filters", error.message);
    haptics.success();
    router.back();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="times" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Close" />
        <AppText variant="title">Filters</AppText>
        <PressableScale onPress={reset} hitSlop={10}>
          <AppText variant="bodyStrong" color="textSecondary">
            Reset
          </AppText>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Age range" index={0}>
          <View style={styles.ageRow}>
            <AgeStepper label="From" value={ageMin} onChange={setAgeMin} min={AGE_FLOOR} max={ageMax} />
            <View style={styles.ageDash} />
            <AgeStepper label="To" value={ageMax} onChange={setAgeMax} min={ageMin} max={AGE_CEILING} />
          </View>
        </Section>

        {!is_premium && (
          <Animated.View entering={enter(1)}>
            <PressableScale onPress={openPaywall} style={styles.upsell} scaleTo={0.98} haptic="light">
              <FontAwesome5 name="crown" size={18} color={t.colors.onPrimary} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong" color="onPrimary">
                  Unlock advanced filters
                </AppText>
                <AppText variant="caption" color="onPrimary">
                  Department, year, what they&apos;re looking for and verified only.
                </AppText>
              </View>
              <FontAwesome5 name="chevron-right" size={13} color={t.colors.onPrimary} />
            </PressableScale>
          </Animated.View>
        )}

        <Section title="Verified profiles only" premium locked={!is_premium} onLockedPress={openPaywall} index={2}>
          <View style={styles.switchRow}>
            <FontAwesome5 name="check-circle" size={18} color={t.colors.verified} solid />
            <AppText variant="bodyMedium" style={{ flex: 1 }}>
              Only show people with a blue tick
            </AppText>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ true: t.colors.primary, false: t.colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Section>

        <Section title="Looking for" premium locked={!is_premium} onLockedPress={openPaywall} index={3}>
          <View style={styles.wrap}>
            {RELATIONSHIP_GOALS.map((g) => (
              <Chip key={g.value} label={`${g.emoji} ${g.label}`} selected={goals.includes(g.value)} onPress={() => toggle(goals, setGoals)(g.value)} />
            ))}
          </View>
        </Section>

        <Section title="Department" premium locked={!is_premium} onLockedPress={openPaywall} index={4}>
          <View style={styles.wrap}>
            {DEPARTMENT_OPTIONS.map((d) => (
              <Chip key={d} label={d} selected={departments.includes(d)} onPress={() => toggle(departments, setDepartments)(d)} />
            ))}
          </View>
        </Section>

        <Section title="Graduation year" premium locked={!is_premium} onLockedPress={openPaywall} index={5}>
          <View style={styles.wrap}>
            {yearOptions.map((y) => (
              <Chip key={y} label={y} selected={gradYears.includes(y)} onPress={() => toggle(gradYears, setGradYears)(y)} />
            ))}
          </View>
        </Section>

        <AppText variant="caption" color="textMuted" style={{ textAlign: "center", marginTop: 4 }}>
          Leave a section empty to see everyone.
        </AppText>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Apply filters" onPress={apply} loading={saving} haptic="medium" />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.md,
  },
  content: {
    padding: t.spacing.lg,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xl,
    padding: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: t.spacing.md,
  },
  premiumTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ageDash: {
    width: 16,
    height: 2,
    backgroundColor: t.colors.border,
    marginTop: 18,
  },
  stepper: {
    alignItems: "center",
    gap: 6,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperValue: {
    minWidth: 44,
    textAlign: "center",
  },
  upsell: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
  },
  footer: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
