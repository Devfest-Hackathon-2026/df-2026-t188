// 案内ボックスのキャラクターの表情と、決まった文。AI は使わない。
// 選んだ内容を受けて決まった文を返すだけで、症状を判断したり、診断したりしない
import {
  BODY_PART_DISPLAY,
  DISCOMFORT_LABELS,
  FEELING_DISPLAY,
  FEELING_NOT_SENT,
} from "./options";
import type { Step } from "./flow";
import type { FamilyAnswers, PatientAnswers } from "./types";

// 表情（public/mascot/guide の画像の名前）
export type GuidePose =
  | "hello"
  | "listen"
  | "think"
  | "empathy"
  | "calm"
  | "checklist";

export type Guide = {
  pose: GuidePose;
  title: string; // 画面の見出し（その画面の質問）
  description: string;
  reaction: string; // 選んだ内容への短い返事。なければ空
};

// 保護者の画面ごとに、答えたかを見る項目
const FAMILY_PAGE_FIELDS: Partial<Record<Step, (keyof FamilyAnswers)[]>> = {
  familyProfile: ["age", "sex", "height", "weight"],
  familyConcern: ["chiefConcern", "onset"],
  familyCondition: ["temperature", "foodIntake"],
  familyHistory: ["medications", "allergies", "conditions"],
};

const FAMILY_TEXT: Partial<Record<Step, { title: string; description: string }>> = {
  familyProfile: {
    title: "お子さんのこと",
    description: "わかる範囲で入力してください。すべて任意です。",
  },
  familyConcern: {
    title: "一番心配なこと・いつから",
    description: "保護者の方から見たようすを教えてください。",
  },
  familyCondition: {
    title: "熱・食べる飲む",
    description: "わかる範囲で教えてください。",
  },
  familyHistory: {
    title: "薬・アレルギー・持病",
    description: "「ある」のときは、内容も書けます（書かなくても進めます）。",
  },
};

const DONT_KNOW_REACTION = "わからなくても だいじょうぶだよ";

// 選んだ順に並んでいるので、最後が一番新しく選んだもの
function lastSelected<T>(answer: PatientAnswers["feelings" | "bodyParts"]): T | null {
  return answer.status === "answered" && answer.value.length > 0
    ? (answer.value[answer.value.length - 1] as T)
    : null;
}

function selectionGuide(
  title: string,
  label: string | null,
  isDontKnow: boolean,
): Guide {
  const description = "あてはまるものを えらんでね。いくつでも えらべるよ。";
  if (label === null) return { pose: "hello", title, description, reaction: "" };
  if (isDontKnow) {
    return { pose: "think", title, description, reaction: DONT_KNOW_REACTION };
  }
  return { pose: "listen", title, description, reaction: `「${label}」を えらんだね` };
}

export function guideFor(
  step: Step,
  patient: PatientAnswers,
  family: FamilyAnswers,
): Guide | null {
  switch (step) {
    case "ability":
      return {
        pose: "calm",
        title: "お子さんは、自分で答えられそう？",
        description: "保護者の方がお選びください。",
        reaction: "",
      };
    case "patientFeeling": {
      const last = lastSelected<keyof typeof FEELING_DISPLAY>(patient.feelings);
      return selectionGuide(
        "どんな かんじ？",
        last && FEELING_DISPLAY[last].label,
        last === FEELING_NOT_SENT,
      );
    }
    case "patientBody": {
      const last = lastSelected<keyof typeof BODY_PART_DISPLAY>(patient.bodyParts);
      return selectionGuide("どこが へん？", last && BODY_PART_DISPLAY[last].label, false);
    }
    case "patientDiscomfort": {
      const title = "どれくらい つらい？";
      const description = "いちばん ちかい かおを 1つ えらんでね。";
      return patient.discomfort.status === "answered"
        ? {
            pose: "empathy",
            title,
            description,
            reaction: `「${DISCOMFORT_LABELS[patient.discomfort.value - 1]}」だね。おしえてくれて ありがとう`,
          }
        : { pose: "empathy", title, description, reaction: "" };
    }
    case "familyProfile":
    case "familyConcern":
    case "familyCondition":
    case "familyHistory": {
      // 保護者の画面は、表情だけを変えて返事は出さない。
      // 返事は説明と入れ替わるので、「任意です」などの説明を消さないため
      const text = FAMILY_TEXT[step]!;
      const hasAnswer = FAMILY_PAGE_FIELDS[step]!.some(
        (field) => family[field].status === "answered",
      );
      return { pose: hasAnswer ? "listen" : "calm", ...text, reaction: "" };
    }
    case "review":
      return {
        pose: "checklist",
        title: "入力内容の見直し",
        description: "直したいところは「編集」を押してください。",
        reaction: "",
      };
    default:
      // 起動、ようこそ、区切り、医師、終了の画面には、案内ボックスを置かない
      return null;
  }
}
