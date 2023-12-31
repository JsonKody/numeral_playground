<script setup lang="ts">
import { useNumberSystem } from "../stores/numberSystem";
import { Base } from "../types/typings";
import Lock from "./icons/Lock.vue";
import LockOpen from "./icons/LockOpen.vue";
import Digit from "./Digit.vue";
import Plus from "./icons/Plus.vue";
import Minus from "./icons/Minus.vue";
import Eye from "./icons/Eye.vue";
import { computed } from "vue";
const ns = useNumberSystem();

const set_base = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value);
  if (!value || value < 2 || value > ns.MAX_BASE) {
    return;
  }
  ns.set_base(value as Base);
};

const baseTitle = computed(() =>
  ns.t_info(
    `[ ${ns.base_purple} ]  je základ v této soustavy.
Je to tedy ${ns.name_purple.toLowerCase()}.`,
    `[ ${ns.base_purple} ]  is the base in this number system.
So it's called ${ns.name_purple.toLowerCase()}.`
  )
);

const digitMinusDisabled = computed(() => ns.digits.length < 2);
const baseMinusDisabled = computed(() => ns.base_purple <= ns.MIN_BASE);
const basePlusDisabled = computed(() => ns.base_purple >= ns.MAX_BASE);
</script>

<template>
  <div>
    <!-- Digits -->
    <div class="digits-wrap">
      <TransitionGroup
        tag="div"
        class="relative flex flex-row flex-wrap gap-1 grow center"
        name="list"
      >
        <div v-for="(_digit, i) in ns.digits" :key="i">
          <Digit :index="i" />
        </div>
      </TransitionGroup>
      <div class="flex justify-between">
        <div class="center" @click="ns.lock_digits = !ns.lock_digits">
          <button
            v-pop:right="
              ns.t_info(
                'Zamknuto - počet číslic se nebude automaticky snižovat.',
                'Locked - number of digits won\'t automatically decrease.',
                'Zamknuto',
                'Locked'
              )
            "
            class="digit-lock"
            v-if="ns.lock_digits"
          >
            <Lock />
          </button>
          <button
            v-pop:right="
              ns.t_info(
                'Odemknuto - počet číslic bude vždy minimum nutné k vyjádření čísla.',
                'Unlocked - number of digits will always be the minimum necessary to represent the number.',
                'Odemknuto',
                'Unlocked'
              )
            "
            class="digit-lock"
            v-else
          >
            <LockOpen />
          </button>
        </div>
        <div class="flex gap-1">
          <button
            class="digit-button"
            v-pop="
              digitMinusDisabled
                ? ns.t_info(
                    'Ale, no tak, nech si tu alespoň jednu číslici 😉',
                    'Oh, come on, keep at least one digit here 😉'
                  )
                : ns.t_info('Odebrat číslici', 'Remove digit')
            "
            @click="ns.remove_digit"
            :disabled="digitMinusDisabled"
          >
            <Minus />
          </button>
          <button
            v-pop="ns.t_info('Přidat číslici', 'Add digit')"
            class="digit-button"
            @click="ns.add_digit"
          >
            <Plus />
          </button>
        </div>
        <div>
          <Lock class="digit-button invisible" />
        </div>
      </div>
    </div>

    <!-- Base -->
    <div class="base-wrap">
      <!-- Save diod -->
      <div
        v-pop="
          ns.t_info(
            'Toto je indikátor uložení.',
            'This is the save indicator.',
            'Uloženo',
            'Saved'
          )
        "
        class="m-2 trans absolute top-0 left-0 w-2 h-2 bg-purple-800 rounded-full"
        :class="{
          'opacity-40': ns.saved,
          'opacity-20': !ns.saved,
          'cursor-help': ns.info,
          'cursor-default': !ns.info,
        }"
      ></div>
      <div class="center">
        <!-- Base number -->
        <Transition name="switch-h" mode="out-in">
          <div
            v-pop="baseTitle"
            :key="ns.base_purple"
            class="trans number-base pink-grad"
            :class="{ 'cursor-help': ns.info }"
          >
            {{ ns.base_purple }}
          </div>
        </Transition>
      </div>
      <label
        v-pop="baseTitle"
        for="base"
        :class="{ 'cursor-help': ns.info }"
        class="text-base"
        >{{ ns.t("Základ", "Base") }}</label
      >
      <input
        v-pop="
          ns.t_info(
            `Zde můžete změnit základ soustavy - min:   ${ns.MIN_BASE}\nmax:   ${ns.MAX_BASE}`,
            `Here you can change the base of the number system - min:   ${ns.MIN_BASE}\nmax:   ${ns.MAX_BASE}`
          )
        "
        class="opacity-10 hover:opacity-80 focus:opacity-80"
        :value="ns.base_purple"
        :min="ns.MIN_BASE"
        :max="ns.MAX_BASE"
        type="number"
        name="base"
        id="base"
        @change="set_base"
      />

      <div class="base-buttons">
        <button
          v-pop:left="
            basePlusDisabled
              ? ns.t_info(
                  `[ ${ns.MAX_BASE} ]  je nejvyšší povolený základ.`,
                  `[ ${ns.MAX_BASE} ]  is the highest allowed base.`
                )
              : ns.t_info('Základ + 1', 'Base + 1')
          "
          :disabled="ns.base_purple >= ns.MAX_BASE"
          @click="ns.increase_base"
          class="base-button"
        >
          <Plus />
        </button>
        <button
          v-pop:left="
            baseMinusDisabled
              ? ns.t_info(
                  `[ ${ns.MIN_BASE} ]  je nejmenší povolený základ.`,
                  `[ ${ns.MIN_BASE} ]  is the lowest allowed base.`
                )
              : ns.t_info('Základ - 1', 'Base - 1')
          "
          :disabled="baseMinusDisabled"
          @click="ns.decrease_base"
          class="base-button"
        >
          <Minus />
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="gap-1 center">
      <button
        v-pop="
          ns.t_info(
            'Nastaví všechny číslice na nulu.',
            'Set all digits to zero.'
          )
        "
        @click="ns.set_digits_to_zero"
        class="control-button"
      >
        Min
      </button>
      <button
        v-pop="
          ns.t_info(
            'Přepíná mezi zobrazením hodnot řádů a indexů řádů.',
            'Toggle between displaying positional values and place indices.'
          )
        "
        @click="ns.toggle_digits_val"
        class="control-button"
      >
        <Eye />
        {{
          ns.show_digits_val
            ? ns.t("Hodnoty řádů", "Positional values")
            : ns.t("Indexy řádů", "Place indices")
        }}
      </button>
      <button
        v-pop="
          ns.t_info(
            'Nastaví všechny číslice na maximální hodnotu.',
            'Set all digits to their maximum value.'
          )
        "
        @click="ns.set_digits_to_max"
        class="control-button"
      >
        Max
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
