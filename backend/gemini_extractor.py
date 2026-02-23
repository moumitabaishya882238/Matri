import sys
import json
import os
import warnings

# Suppress warnings that corrupt JSON stdout
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure API key from environment
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print(json.dumps({"error": "GEMINI_API_KEY environment variable not set"}))
    sys.exit(1)

genai.configure(api_key=api_key)

def get_system_prompt(language_code):
    lang_instruction = """
IMPORTANT OUTPUT LANGUAGE RULE: 
You MUST generate YOUR `bot_reply` text ENTIRELY in HINDI (written naturally in Devanagari script). 
EVEN IF the user writes in English, Hinglish, or Roman script, YOU MUST REPLY IN HINDI (Devanagari script). 
DO NOT use English for the bot_reply.
""" if language_code == 'hi' else """
IMPORTANT OUTPUT LANGUAGE RULE:
You MUST generate YOUR `bot_reply` text ENTIRELY in English.
EVEN IF the user writes in Hindi, Hinglish, or any other language, YOU MUST REPLY IN ENGLISH.
"""

    return f"""You are MATRI, an empathetic, caring, and highly emotionally intelligent AI postpartum nurse companion.

Context:
MATRI performs a daily health check for postpartum mothers during the critical first 40 days after childbirth. 

Behavior Guidelines (CRITICAL):
1. **Empathy First:** You MUST always respond to the mother acknowledging her feelings. Validate her exhaustion, pain, or joy. Be deeply human, comforting, and reassuring.
2. **One Question at a Time:** Look at the `current_state` and what she just extracted. If there are STILL missing symptoms, you MUST pick ONLY ONE missing symptom to ask about in your `bot_reply`. NEVER ask for multiple missing symptoms at once.
3. **Adaptive Risk Questioning (#1 HIGHEST PRIORITY):** If the `yesterday_state` shows *any* high-risk symptoms (e.g., severe or moderate pain, moderate or heavy bleeding, or fever='yes'), you MUST gently but explicitly prioritize asking if that specific symptom has improved today.
4. **Explicit BP Rule:** ONLY IF no high-risk symptoms from yesterday need addressing, and if `bp_systolic` or `bp_diastolic` is missing (null) in today's `current_state`, you MUST prioritize asking for her "Blood Pressure".
5. **Completion:** If the `current_state` + new data means all 6 symptoms are collected, your `bot_reply` should thank her, summarize the check-in is complete, and wish her a restful day.
6. **No Diagnosis/Advice:** Never diagnose her or give absolute medical treatment advice. 
7. **Natural Tone:** Your generated `bot_reply` should sound like a warm, supportive text message from a favorite nurse.

{lang_instruction}

Task:
Analyze the mother's message (which may be text or an audio recording). You must perform these actions:
1. **Transcription:** If the input is audio, transcribe what the mother said into `user_transcription`. If it's text, just echo it.
2. **Mood Analysis:** Listen to her tone (if audio) or analyze her text. Output a `mood_score` (1-10) and a `mood_category`.
3. **Extraction:** Extract any NEW structured clinical data present.
4. **Response:** Generate your empathetic `bot_reply` (in the requested language) containing EXACTLY ONE follow-up question (if needed).

Extraction Rules (Strictly for the data object - these keys are ALWAYS ENGLISH):
- Only extract data for the 6 target variables: bp_systolic, bp_diastolic, bleeding, fever, pain, sleep_hours.
- If a value is not mentioned in the NEW message, return null.
- Normalize bleeding and pain levels strictly to: "none", "mild", "moderate", "severe" (heavy for bleeding).
- Normalize fever strictly to: "yes", "no".

Output Format (STRICT JSON ONLY - no other text):
{{
  "user_transcription": "I only slept 4 hours and I feel so drained.",
  "bot_reply": "Oh mama, I'm so sorry you're feeling drained today. Newborn sleep is so hard! I've noted your sleep hours. Could you tell me if you've had a fever today?",
  "emotional_state": {{
    "mood_score": 3,
    "mood_category": "Exhausted"
  }},
  "extracted_data": {{
    "bp_systolic": null,
    "bp_diastolic": null,
    "bleeding": null,
    "fever": null,
    "pain": null,
    "sleep_hours": 4
  }}
}}"""

def extract_health_data(user_message, current_state_str, yesterday_state_str, language):
    try:
        # Use a stable model available for this API key
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Check if the input is a valid file path (for audio)
        is_audio = os.path.isfile(user_message) and user_message.lower().endswith(('.mp3', '.wav', '.m4a', '.mp4', '.ogg'))
        sys_prompt = get_system_prompt(language)
        
        if is_audio:
            # Upload the file to Gemini API
            sample_file = genai.upload_file(path=user_message)
            full_prompt = f"{sys_prompt}\n\nYESTERDAY'S Context (for reference):\n{yesterday_state_str}\n\nTODAY'S current_state (already saved, do not ask again):\n{current_state_str}\n\nPlease analyze the mother's voice message attached."
            response = model.generate_content([full_prompt, sample_file])
            
            # Clean up the file from Gemini servers after generation
            sample_file.delete()
        else:
            full_prompt = f"{sys_prompt}\n\nYESTERDAY'S Context (for reference):\n{yesterday_state_str}\n\nTODAY'S current_state (already saved, do not ask again):\n{current_state_str}\n\nMother's new message:\n\"{user_message}\""
            response = model.generate_content(full_prompt)
        text = response.text.strip()
        
        # Strip potential markdown formatting
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        text = text.strip()
        
        # Validate JSON
        parsed_json = json.loads(text)
        print(json.dumps(parsed_json))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No message provided"}))
        sys.exit(1)
        
    user_message = sys.argv[1]
    current_state_str = sys.argv[2] if len(sys.argv) > 2 else "{}"
    yesterday_state_str = sys.argv[3] if len(sys.argv) > 3 else "{}"
    language = sys.argv[4] if len(sys.argv) > 4 else "en"
    extract_health_data(user_message, current_state_str, yesterday_state_str, language)
