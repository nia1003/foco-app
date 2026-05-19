/**

 * Inline focus setup — mission, companion, duration (Home screen, below START FOCUS).

 */

import React, { useState } from 'react';

import {

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,

} from 'react-native';

import { DurationPickerModal } from '@/components/home/DurationPickerModal';

import { PetRenderer } from '@/components/pets/PetRenderer';

import { PETS } from '@/constants/pets';

import { useSound } from '@/components/SoundProvider';

import { useAppTheme } from '@/hooks/useAppTheme';

import { useThemedStyles } from '@/hooks/useThemedStyles';

import type { AppTheme } from '@/hooks/useAppTheme';

import { TaskIcon } from '@/components/tasks/TaskIcon';

import { TaskIconSelector } from '@/components/tasks/TaskIconSelector';

import { resolveTaskIcon, type TaskIconValue } from '@/lib/taskIcon';

import type { FocoPet, Task, TaskIconType } from '@/types';

export type TaskMode = 'none' | 'existing' | 'new';



export interface FocusQuickSetupValue {

  taskMode: TaskMode;

  selectedTaskId: string | null;

  newIconType: TaskIconType;

  newIcon: string;

  newTitle: string;

  newMemo: string;

  selectedPetId: string | null;

  durationMin: number;

}



interface Props {

  pets: FocoPet[];

  tasks: Task[];

  value: FocusQuickSetupValue;

  onChange: (patch: Partial<FocusQuickSetupValue>) => void;
}

export function FocusQuickSetup({ pets, tasks, value, onChange }: Props) {

  const { play } = useSound();

  const { colors } = useAppTheme();

  const styles = useThemedStyles(createStyles);

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [durationModalOpen, setDurationModalOpen] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const {

    taskMode,

    selectedTaskId,

    newIconType,

    newIcon,

    newTitle,

    newMemo,

    selectedPetId,

    durationMin,

  } = value;



  const draftIcon: TaskIconValue = { type: newIconType, value: newIcon };



  return (

    <View style={styles.wrap}>

      <Text style={styles.sectionLabel}>MISSION</Text>

      <View style={styles.card}>

        <TouchableOpacity

          style={[styles.optionRow, taskMode === 'none' && styles.optionRowActive]}

          onPress={() => {

            play('tap');

            onChange({ taskMode: 'none', selectedTaskId: null });

          }}

          activeOpacity={0.75}

        >

          <Text style={styles.optionEmoji}>✦</Text>

          <Text style={[styles.optionLabel, taskMode === 'none' && styles.optionLabelActive]}>

            Free focus

          </Text>

        </TouchableOpacity>



        {pendingTasks.map((t) => {

          const active = taskMode === 'existing' && selectedTaskId === t.id;

          const icon = resolveTaskIcon(t);

          return (

            <TouchableOpacity

              key={t.id}

              style={[styles.optionRow, active && styles.optionRowActive]}

              onPress={() => {

                play('tap');

                onChange({ taskMode: 'existing', selectedTaskId: t.id });

              }}

              activeOpacity={0.75}

            >

              <View style={styles.iconSlot}>

                <TaskIcon icon={icon} size={18} />

              </View>

              <Text style={[styles.optionLabel, active && styles.optionLabelActive]} numberOfLines={1}>

                {t.title}

              </Text>

            </TouchableOpacity>

          );

        })}



        {taskMode !== 'new' ? (

          <TouchableOpacity

            style={styles.newTaskBtn}

            onPress={() => {

              play('tap');

              onChange({ taskMode: 'new', selectedTaskId: null, newTitle: '' });

            }}

            activeOpacity={0.75}

          >

            <Text style={styles.newTaskBtnText}>+ New task</Text>

          </TouchableOpacity>

        ) : (

          <View style={styles.newTaskForm}>

            <TouchableOpacity

              style={styles.iconPickerBtn}

              onPress={() => {

                play('tap');

                setIconPickerOpen(true);

              }}

              activeOpacity={0.8}

            >

              <View style={styles.iconPickerPreview}>

                <TaskIcon icon={draftIcon} size={24} />

              </View>

              <Text style={styles.iconPickerLabel}>Change icon</Text>

            </TouchableOpacity>

            <TextInput

              style={styles.input}

              value={newTitle}

              onChangeText={(t) => onChange({ newTitle: t })}

              placeholder="What do you want to focus on?"

              placeholderTextColor={colors.inkFaint}

            />

            <TextInput

              style={[styles.input, { marginTop: 8 }]}

              value={newMemo}

              onChangeText={(t) => onChange({ newMemo: t.slice(0, 60) })}

              placeholder="Short note… (optional)"

              placeholderTextColor={colors.inkFaint}

              maxLength={60}

            />

          </View>

        )}

      </View>



      <TaskIconSelector

        visible={iconPickerOpen}

        value={draftIcon}

        onChange={(icon) =>

          onChange({ newIconType: icon.type, newIcon: icon.value })

        }

        onClose={() => setIconPickerOpen(false)}

      />



      <Text style={styles.sectionLabel}>COMPANION</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>

        {pets.map((p) => {

          const def = PETS.find((d) => d.id === p.name.toLowerCase()) ?? PETS[0];

          const active = selectedPetId === p.id;

          return (

            <TouchableOpacity

              key={p.id}

              style={[styles.petCard, active && { borderColor: def.accent }]}

              onPress={() => {

                play('tap');

                onChange({ selectedPetId: p.id });

              }}

              activeOpacity={0.8}

            >

              <PetRenderer pet={def} size={64} interactive={false} />

              <Text style={[styles.petName, active && { color: def.accent }]}>{def.name}</Text>

            </TouchableOpacity>

          );

        })}

      </ScrollView>



      <Text style={styles.sectionLabel}>DURATION</Text>
      <TouchableOpacity
        style={styles.durationCard}
        onPress={() => {
          play('tap');
          setDurationModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.durationRow}>
          <Text style={styles.durationValue}>{durationMin}</Text>
          <Text style={styles.durationUnit}>min</Text>
        </View>
        <Text style={styles.durationHint}>Tap to adjust</Text>
      </TouchableOpacity>

      <DurationPickerModal
        visible={durationModalOpen}
        value={durationMin}
        onChange={(m) => onChange({ durationMin: m })}
        onClose={() => setDurationModalOpen(false)}
      />

    </View>

  );

}



function createStyles({ colors, surfaces }: AppTheme) {

  return StyleSheet.create({

    wrap: { gap: 8 },

    sectionLabel: {

      fontSize: 10,

      fontWeight: '700',

      color: colors.inkFaint,

      letterSpacing: 1.4,

      marginTop: 8,

      marginBottom: 4,

      paddingLeft: 4,

    },

    card: {

      borderRadius: 20,

      backgroundColor: surfaces.panelBg,

      borderWidth: 0.5,

      borderColor: surfaces.panelBorder,

      overflow: 'hidden',

    },

    optionRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 10,

      paddingHorizontal: 16,

      paddingVertical: 12,

      borderBottomWidth: StyleSheet.hairlineWidth,

      borderBottomColor: surfaces.divider,

    },

    optionRowActive: { backgroundColor: surfaces.rowActive },

    optionEmoji: { fontSize: 18, width: 28, textAlign: 'center' },

    iconSlot: { width: 28, alignItems: 'center', justifyContent: 'center' },

    optionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.inkSoft },

    optionLabelActive: { color: colors.ink, fontWeight: '600' },

    newTaskBtn: { padding: 14, alignItems: 'center' },

    newTaskBtnText: { fontSize: 13, fontWeight: '600', color: colors.pinkText },

    newTaskForm: { padding: 14, gap: 10 },

    iconPickerBtn: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 12,

    },

    iconPickerPreview: {

      width: 44,

      height: 44,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor: surfaces.emojiCellBg,

      borderWidth: 0.5,

      borderColor: surfaces.panelBorder,

    },

    iconPickerLabel: { fontSize: 13, fontWeight: '600', color: colors.pinkText },

    input: { fontSize: 15, color: colors.ink, paddingVertical: 6 },

    petRow: { gap: 10, paddingVertical: 4 },

    petCard: {

      width: 100,

      paddingVertical: 10,

      alignItems: 'center',

      borderRadius: 16,

      borderWidth: 1.5,

      borderColor: surfaces.panelBorder,

      backgroundColor: surfaces.panelBg,

    },

    petName: { fontSize: 11, fontWeight: '600', color: colors.inkSoft, marginTop: 4 },

    durationCard: {
      borderRadius: 20,
      backgroundColor: surfaces.panelBg,
      borderWidth: 0.5,
      borderColor: surfaces.panelBorder,
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    durationRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    durationValue: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 48,
      fontWeight: '600',
      color: colors.ink,
      letterSpacing: -2,
    },
    durationUnit: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.inkSoft,
    },
    durationHint: {
      fontSize: 11,
      color: colors.inkFaint,
      marginTop: 6,
      letterSpacing: 0.3,
    },
  });

}

