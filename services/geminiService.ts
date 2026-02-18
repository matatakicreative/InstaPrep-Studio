
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types.ts";

const getApiKey = () => {
  // process オブジェクトが存在するか、env プロパティがあるかを確認
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY || "";
  }
  return "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const translateAndGenerateCaption = async (japanesePrompt: string): Promise<GeneratedContent> => {
  try {
    const randomSalt = Math.random().toString(36).substring(7);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${japanesePrompt} (Salt: ${randomSalt})`,
      config: {
        systemInstruction: `あなたはインスタグラムの投稿支援アシスタントです。
入力された日本語の内容を元に、魅力的な英語の投稿案を作成してください。

以下の4点を生成してください：
1. imagePhrase: 画像内に入れる3〜5語程度のキャッチーな英語フレーズ。
2. imagePhrase_jp: 上記英語フレーズの自然な日本語訳。
3. caption: インスタグラムの投稿本文（英語）。最後に5つのハッシュタグを含めてください。
4. caption_jp: 上記投稿本文の自然な日本語訳（ハッシュタグ部分は除く）。

レスポンスは必ず指定されたJSON形式で返してください。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            caption_jp: { type: Type.STRING },
            imagePhrase: { type: Type.STRING },
            imagePhrase_jp: { type: Type.STRING }
          },
          required: ["caption", "caption_jp", "imagePhrase", "imagePhrase_jp"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      caption: result.caption || "",
      caption_jp: result.caption_jp || "",
      imagePhrase: result.imagePhrase || "",
      imagePhrase_jp: result.imagePhrase_jp || ""
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      caption: "Error generating content.",
      caption_jp: "コンテンツ生成中にエラーが発生しました。",
      imagePhrase: "Error",
      imagePhrase_jp: "エラー"
    };
  }
};
