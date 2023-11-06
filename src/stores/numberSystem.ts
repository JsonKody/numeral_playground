// numberSystem.ts
import type { Base, Lang, Name } from "../types/typings";
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { generateCzechName, generateEnglishName } from "../prefixes";
import { debounce } from "lodash-es";

const delimiter = ",";

function ls_get<T extends "boolean" | "number" | "string" | "digits">(
  key: string,
  type: T
): T extends "boolean"
  ? boolean
  : T extends "number"
  ? number
  : T extends "string"
  ? string
  : T extends "digits"
  ? string[]
  : never {
  const item = localStorage.getItem(key);
  if (type === "string") {
    return item as any;
  } else if (type === "boolean") {
    return (item === "true") as any;
  } else if (type === "number") {
    return (item ? Number(item) : 0) as any;
  } else if (type === "digits") {
    return (item ? item.split(delimiter) : []) as any;
  }
  throw new Error(`Unsupported type: ${type}`);
}

const ls_queue: Record<string, string> = {};

const saved = ref(false);
const ls_set_batch = debounce(() => {
  for (const key in ls_queue) {
    localStorage.setItem(key, ls_queue[key]);
    delete ls_queue[key]; // Odstraní hodnotu z fronty
  }
  saved.value = true;
  setTimeout(() => (saved.value = false), 180);
}, 1000);

function enqueue_ls_set(key: string, value: string) {
  ls_queue[key] = value; // Přepíše předchozí hodnotu pokud existuje
  ls_set_batch(); // Zavolá debounced funkci
}

export const useNumberSystem = defineStore("numberSystem", () => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const zero = chars[0];
  const MIN_BASE = 2;
  const MAX_BASE = chars.length;

  const lang = ref<Lang>((ls_get("lang", "string") as Lang) || "cs");

  const base_green = ref<Base>((ls_get("base_green", "number") as Base) || 10);
  const base_purple = ref<Base>(
    (ls_get("base_purple", "number") as Base) || 16
  );

  const digits = ref<string[]>(
    (ls_get("digits", "digits") as string[]) || [zero]
  );
  const show_digits_value = ref<boolean>(
    (ls_get("show_digits_value", "boolean") as boolean) || true
  );
  // zamkne pocet ciselnych mist - mohou rust dle potreby ale nebudou se samy snizovat
  const lock_digits = ref<boolean>(
    (ls_get("lock_digits", "boolean") as boolean) || true
  );

  const name_green = computed(() =>
    lang.value === "cs"
      ? generateCzechName(base_green.value)
      : generateEnglishName(base_green.value)
  );
  const name_purple = computed(() =>
    lang.value === "cs"
      ? generateCzechName(base_purple.value)
      : generateEnglishName(base_purple.value)
  );
  const en_name = computed(() => generateEnglishName(base_purple.value));

  const availableCharsForBase = computed(() => {
    return chars.substring(0, base_purple.value);
  });

  const setBase = (val: Base) => {
    const digits_length = digits.value.length;

    const new_digits_array = digits_converter(
      digits.value,
      base_purple.value,
      val
    );
    digits.value = [];
    base_purple.value = val;
    digits.value = new_digits_array;

    if (lock_digits.value && digits.value.length < digits_length) {
      const zeros = new Array(digits_length - digits.value.length).fill(zero);
      digits.value = [...zeros, ...digits.value];
    }
  };

  const setDigitsToZero = () => {
    const zero = availableCharsForBase.value[0];
    digits.value = digits.value.map(() => zero);
  };

  const mas_available_str_digit = computed(() => {
    return availableCharsForBase.value[availableCharsForBase.value.length - 1];
  });

  const setDigitsToMax = () => {
    const max = mas_available_str_digit.value;
    digits.value = digits.value.map(() => max);
  };

  const setDigit = (index: number, value: string) => {
    digits.value[index] = value;
    enqueue_ls_set("digits", digits.value.join(delimiter));
  };

  const addDigit = () => {
    digits.value.unshift(chars[0]);
  };

  const removeDigit = () => {
    digits.value.shift();
  };

  function stringToBigInt(str: string, base: Base): BigInt {
    let result = BigInt(0);
    const bigBase = BigInt(base);
    let multiplier = BigInt(1);

    for (let i = str.length - 1; i >= 0; i--) {
      const digit = str[i];
      const value = BigInt(parseInt(digit, base));
      result += value * multiplier;
      multiplier *= bigBase;
    }

    return result;
  }

  function digits_converter(current: string[], base_from: Base, base_to: Base) {
    const str_num = current.join("");
    return str_number_converter(str_num, base_from, base_to).split("");
  }

  function str_number_converter(
    str_num: string,
    base_from: Base,
    base_to: Base
  ) {
    str_num = stringToBigInt(str_num, base_from)
      .toString(base_to)
      .toUpperCase();
    return str_num ? str_num : zero;
  }

  const digitsToGreenStrNumber = computed(() =>
    str_number_converter(
      digits.value.join(""),
      base_purple.value,
      base_green.value
    )
  );
  const digitsToPurpleStrNumber = computed(() =>
    str_number_converter(
      digits.value.join(""),
      base_purple.value,
      base_purple.value
    )
  );

  const switchGreenPurple = () => {
    const new_digits_array = digitsToGreenStrNumber.value.split("");
    digits.value = [];
    const temp = base_green.value;
    base_green.value = base_purple.value;
    base_purple.value = temp;
    digits.value = new_digits_array;
  };

  const t = (cs: string, en: string) => (lang.value === "cs" ? cs : en);
  const to = (lang_obj: Name) => lang_obj[lang.value];
  const toggleLang = () => {
    lang.value = lang.value === "cs" ? "en" : "cs";
    enqueue_ls_set("lang", lang.value);
  };

  watch(
    () => digits.value,
    () => {
      enqueue_ls_set("digits", digits.value.join(delimiter));
    }
  );
  watch(
    () => digits.value.length,
    () => {
      enqueue_ls_set("digits", digits.value.join(delimiter));
    }
  );
  watch(
    () => show_digits_value.value,
    () =>
      enqueue_ls_set("show_digits_value", show_digits_value.value.toString())
  );
  watch(
    () => lock_digits.value,
    () => enqueue_ls_set("lock_digits", lock_digits.value.toString())
  );
  watch(
    () => base_green.value,
    () => enqueue_ls_set("base_green", base_green.value.toString())
  );
  watch(
    () => base_purple.value,
    () => enqueue_ls_set("base_purple", base_purple.value.toString())
  );
  return {
    saved,
    t,
    to,
    lang,
    toggleLang,
    base_green,
    base_purple,
    setBase,
    chars,
    zero,
    MIN_BASE,
    MAX_BASE,
    digits,
    lock_digits,
    setDigit,
    addDigit,
    removeDigit,
    availableCharsForBase,
    digitsToPurpleStrNumber,
    digitsToGreenStrNumber,
    show_digits_value,
    setDigitsToZero,
    mas_available_str_digit,
    setDigitsToMax,
    name_green,
    name_purple,
    en_name,
    switchGreenPurple,
  };
});
