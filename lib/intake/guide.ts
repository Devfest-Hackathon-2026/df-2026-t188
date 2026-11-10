// 案内ボックスのキャラクターの表情と、決まった文。AI は使わない。
// 選んだ内容を受けて決まった文を返すだけで、症状を判断したり、診断したりしない
import { detailCategoryOf, type Step } from "./flow";
import { BODY_PART_DISPLAY, DISCOMFORT_LABELS } from "./options";
import {
  OTHER_QUESTION,
  SYMPTOM_CATEGORIES,
  type DetailCategoryKey,
  type PatientSymptoms,
} from "./symptoms";
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

// 主症状ごとの詳しい質問と「ほかにも きになることは ある？」の画面で、最後に押したもの。HTML では、押したボタンで返事を変える
// （「わからない」なら think と「わからなくても だいじょうぶだよ。」、ほかは listen と「えらびなおすことも できるよ。」）
export type OtherReaction = "pick" | "dontKnow" | null;

export type GuideContext = {
  patient: PatientAnswers;
  family: FamilyAnswers;
  symptoms: PatientSymptoms;
  otherReaction: OtherReaction;
};

// 保護者の画面ごとに、答えたかを見る項目
const FAMILY_PAGE_FIELDS: Partial<Record<Step, (keyof FamilyAnswers)[]>> = {
  familyProfile: ["age", "sex", "weight"],
  familyRecord: [
    "chiefConcern",
    "concernChoices",
    "onset",
    "temperature",
    "temperatureRange",
    "foodIntake",
    "conditions",
    "allergies",
    "medications",
  ],
};

const FAMILY_TEXT: Partial<Record<Step, { title: string; description: string }>> = {
  familyProfile: {
    title: "お子さんのこと",
    description: "わかる範囲で入力してください。すべて任意です。",
  },
  // 見出しは、バーの区切りの名前（家族からの記録）にそろえる
  familyRecord: {
    title: "家族からの記録",
    description: "保護者の方から見たようすを、わかる範囲で教えてください。",
  },
};

// ここから下の「症状をえらぶ」「ほかにも きになることは ある？」の文は、
// かずまさんの v3 の症状画面.html（updateMascotForStep と、ボタンを押したときの setGuide）のとおり
function chooseSymptomsGuide(symptoms: PatientSymptoms): Guide {
  const title = "どんなかんじがする？";
  const description = "あてはまるものを えらんでね。いくつでも えらべるよ。";
  const picked = symptoms.categories;
  if (picked.length === 0) return { pose: "hello", title, description, reaction: "" };
  if (picked.includes("unknown")) {
    return { pose: "think", title, description, reaction: "わからなくても だいじょうぶだよ。" };
  }
  return {
    pose: "listen",
    title,
    description,
    reaction:
      picked.length === 1
        ? `「${SYMPTOM_CATEGORIES[picked[0]].label}」を えらんだね。`
        : "いくつでも えらべるよ。",
  };
}

// 「ほかにも きになることは ある？」の画面の説明（HTML の画面2の headline-desc）
export const OTHER_DESCRIPTION =
  "わかるところだけでだいじょうぶ。あてはまるものをえらんでね。";

// 主症状ごとの詳しい質問の画面（消す前のとおり。見出しは「○○」について）
function detailGuide(key: DetailCategoryKey, reaction: OtherReaction): Guide {
  const title = `「${SYMPTOM_CATEGORIES[key].label}」について`;
  const description = OTHER_DESCRIPTION;
  if (reaction === "dontKnow") {
    return { pose: "think", title, description, reaction: "わからなくても だいじょうぶだよ。" };
  }
  if (reaction === "pick") {
    return { pose: "listen", title, description, reaction: "えらびなおすことも できるよ。" };
  }
  return { pose: "listen", title, description, reaction: "わかるところだけで だいじょうぶ。" };
}

function otherGuide(reaction: OtherReaction): Guide {
  const title = OTHER_QUESTION;
  const description = OTHER_DESCRIPTION;
  if (reaction === "dontKnow") {
    return { pose: "think", title, description, reaction: "わからなくても だいじょうぶだよ。" };
  }
  if (reaction === "pick") {
    return { pose: "listen", title, description, reaction: "えらびなおすことも できるよ。" };
  }
  return { pose: "think", title, description, reaction: "ほかにも あれば おしえてね。" };
}

// 選んだ順に並んでいるので、最後が一番新しく選んだもの
function lastSelected<T>(answer: PatientAnswers["bodyParts"]): T | null {
  return answer.status === "answered" && answer.value.length > 0
    ? (answer.value[answer.value.length - 1] as T)
    : null;
}

function selectionGuide(title: string, label: string | null): Guide {
  const description = "あてはまるものを えらんでね。いくつでも えらべるよ。";
  if (label === null) return { pose: "hello", title, description, reaction: "" };
  return { pose: "listen", title, description, reaction: `「${label}」を えらんだね` };
}

export function guideFor(
  step: Step,
  { patient, family, symptoms, otherReaction }: GuideContext,
): Guide | null {
  const detail = detailCategoryOf(step);
  if (detail !== null) return detailGuide(detail, otherReaction);
  switch (step) {
    case "ability":
      return {
        pose: "calm",
        title: "お子さんは、自分で答えられそう？",
        description: "保護者の方がお選びください。",
        reaction: "",
      };
    case "patientFeeling":
      return chooseSymptomsGuide(symptoms);
    case "patientBody": {
      const last = lastSelected<keyof typeof BODY_PART_DISPLAY>(patient.bodyParts);
      return selectionGuide("どこが へん？", last && BODY_PART_DISPLAY[last].label);
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
    case "patientOther":
      return otherGuide(otherReaction);
    case "familyProfile":
    case "familyRecord": {
      // 保護者の画面は、表情だけを変えて返事は出さない。
      // 返事は説明と入れ替わるので、「任意です」などの説明を消さないため
      const text = FAMILY_TEXT[step]!;
      const hasAnswer = FAMILY_PAGE_FIELDS[step]!.some(
        (field) => family[field]?.status === "answered",
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
